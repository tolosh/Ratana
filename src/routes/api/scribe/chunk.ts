import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const MAX_BYTES = 2 * 1024 * 1024;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export const Route = createFileRoute("/api/scribe/chunk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token || token.split(".").length !== 3) return json({ error: "Unauthorized" }, 401);
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES) return json({ error: "Chunk too large" }, 413);

        const supabase = createClient<Database>(url, key, {
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claimData, error: claimErr } = await supabase.auth.getClaims(token);
        const claims = claimData?.claims as Record<string, unknown> | undefined;
        if (claimErr || !claims?.sub) return json({ error: "Unauthorized" }, 401);
        if (claims["aal"] !== "aal2") return json({ error: "Multi-factor authentication is required before audio is captured." }, 403);

        const form = await request.formData();
        const sessionId = String(form.get("sessionId") ?? "");
        const seq = Number(form.get("seq"));
        const tStart = Number(form.get("tStart") ?? 0);
        const tEnd = Number(form.get("tEnd") ?? 0);
        const silent = form.get("silent") === "1";
        const file = form.get("file");
        if (!/^[0-9a-f-]{36}$/.test(sessionId) || !Number.isInteger(seq) || seq < 0) return json({ error: "Invalid chunk" }, 400);
        if (!(file instanceof File) || !file.size || file.size > MAX_BYTES || !file.type.startsWith("audio/")) return json({ error: "Invalid audio" }, 400);

        // RLS: only clinical members of the session's organisation can read it.
        const { data: session } = await supabase.from("scribe_sessions").select("id,organisation_id,status").eq("id", sessionId).maybeSingle();
        if (!session) return json({ error: "Session not found" }, 404);
        if (session.status === "signed") return json({ error: "Session is signed" }, 409);
        const { data: consent } = await supabase.from("scribe_consents").select("id").eq("session_id", sessionId).maybeSingle();
        if (!consent) return json({ error: "Consent has not been captured" }, 403);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: already } = await supabaseAdmin.from("scribe_segments").select("id").eq("session_id", sessionId).eq("seq", seq).maybeSingle();
        if (already) return json({ ok: true, duplicate: true });

        const path = `${session.organisation_id}/${sessionId}/${String(seq).padStart(5, "0")}.wav`;
        const up = await supabaseAdmin.storage.from("scribe-audio").upload(path, file, { contentType: "audio/wav", upsert: true });
        if (up.error) return json({ error: "Storage unavailable" }, 503);
        await supabaseAdmin.from("scribe_audio_chunks").upsert(
          { session_id: sessionId, organisation_id: session.organisation_id, seq, storage_path: path, bytes: file.size },
          { onConflict: "session_id,seq" },
        );

        let text = "";
        let kind: "speech" | "silence" | "failed" = silent ? "silence" : "speech";
        if (!silent) {
          try {
            const { gatewayTranscription } = await import("@/lib/scribe.server");
            text = await gatewayTranscription.transcribe(file);
            if (!text) kind = "silence";
          } catch {
            // Audio is stored; transcription can be retried. Do not store the segment so the client retries.
            return json({ error: "Transcription unavailable. Audio is saved and will be retried." }, 503);
          }
        }
        await supabaseAdmin.from("scribe_segments").upsert(
          { session_id: sessionId, organisation_id: session.organisation_id, seq, t_start: tStart, t_end: tEnd, kind, text },
          { onConflict: "session_id,seq" },
        );
        if (seq === 0) {
          await supabaseAdmin.from("audit_events").insert({ organisation_id: session.organisation_id, actor_id: String(claims.sub), action: "scribe.audio.capture_started", entity_type: "scribe_session", entity_id: sessionId, detail: {} });
        }
        return json({ ok: true, kind, text });
      },
    },
  },
});
