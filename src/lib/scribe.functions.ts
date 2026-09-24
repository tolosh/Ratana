import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONSENT_SCRIPT, CONSENT_SCRIPT_VERSION, offsetLabel, templateById } from "./scribe-config";

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

async function audit(ctx: Ctx, organisationId: string, action: string, entityType: string, entityId: string, detail: Record<string, unknown> = {}) {
  await ctx.supabase.from("audit_events").insert({ organisation_id: organisationId, actor_id: ctx.userId, action, entity_type: entityType, entity_id: entityId, detail });
}

async function membershipFor(ctx: Ctx, organisationId: string) {
  const { data } = await ctx.supabase.from("memberships").select("role,status").eq("organisation_id", organisationId).eq("user_id", ctx.userId).maybeSingle();
  return data as { role: string; status: string } | null;
}

async function loadSession(ctx: Ctx, sessionId: string) {
  const { data, error } = await ctx.supabase.from("scribe_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (error || !data) throw new Error("Session not found");
  return data as { id: string; organisation_id: string; clinician_id: string; template_id: string; status: string; patient_label: string };
}

export const createSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      organisationId: z.string().uuid(),
      patientLabel: z.string().trim().min(1).max(120),
      context: z.enum(["in_person", "telehealth", "home_visit", "dictation"]),
      templateId: z.string().min(1).max(40),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: row, error } = await ctx.supabase
      .from("scribe_sessions")
      .insert({ organisation_id: data.organisationId, clinician_id: ctx.userId, patient_label: data.patientLabel, context: data.context, template_id: templateById(data.templateId).id })
      .select("id")
      .single();
    if (error) throw new Error("Could not create session");
    await audit(ctx, data.organisationId, "scribe.session.created", "scribe_session", row.id, { context: data.context });
    return { id: row.id as string };
  });

export const captureConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const s = await loadSession(ctx, data.sessionId);
    const { error } = await ctx.supabase.from("scribe_consents").insert({ session_id: s.id, organisation_id: s.organisation_id, script_version: CONSENT_SCRIPT_VERSION, script_text: CONSENT_SCRIPT, captured_by: ctx.userId });
    if (error && !String(error.message).includes("duplicate")) throw new Error("Consent could not be recorded");
    await ctx.supabase.from("scribe_sessions").update({ status: "recording", started_at: new Date().toISOString() }).eq("id", s.id);
    await audit(ctx, s.organisation_id, "scribe.consent.captured", "scribe_session", s.id, { script_version: CONSENT_SCRIPT_VERSION });
    return { ok: true };
  });

export const markOffRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid(), seq: z.number().int().min(0), tStart: z.number(), tEnd: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const s = await loadSession(ctx, data.sessionId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("scribe_segments").upsert(
      { session_id: s.id, organisation_id: s.organisation_id, seq: data.seq, t_start: data.tStart, t_end: data.tEnd, kind: "off_record", text: "" },
      { onConflict: "session_id,seq" },
    );
    await audit(ctx, s.organisation_id, "scribe.off_record", "scribe_session", s.id, { from: data.tStart, to: data.tEnd });
    return { ok: true };
  });

export const endRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid(), chunks: z.number().int().min(0) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const s = await loadSession(ctx, data.sessionId);
    await ctx.supabase.from("scribe_sessions").update({ ended_at: new Date().toISOString() }).eq("id", s.id);
    await audit(ctx, s.organisation_id, "scribe.recording.ended", "scribe_session", s.id, { chunks: data.chunks });
    return { ok: true };
  });

export const draftNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const s = await loadSession(ctx, data.sessionId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { gatewayDrafting, DRAFT_MODEL } = await import("./scribe.server");

    const { data: existing } = await ctx.supabase.from("scribe_notes").select("id,status").eq("session_id", s.id).maybeSingle();
    if (existing?.status === "signed") throw new Error("This note is signed and locked.");

    const { data: segs } = await ctx.supabase.from("scribe_segments").select("seq,t_start,text,kind").eq("session_id", s.id).order("seq");
    const speech = ((segs ?? []) as { seq: number; t_start: number; text: string; kind: string }[]).filter((x) => x.kind === "speech" && x.text.trim());
    if (!speech.length) return { ok: false as const, error: "No speech was transcribed. Record again or write the note manually." };

    const { data: consent } = await ctx.supabase.from("scribe_consents").select("captured_at").eq("session_id", s.id).maybeSingle();
    const consentStatement = consent
      ? `Verbal consent to record obtained using script ${CONSENT_SCRIPT_VERSION} at ${new Date(consent.captured_at).toLocaleString("en-AU", { hour12: false, timeZone: "Australia/Sydney" })} (Sydney time).`
      : null;

    await ctx.supabase.from("scribe_sessions").update({ status: "drafting" }).eq("id", s.id);
    const template = templateById(s.template_id);
    const bySeq = new Map(speech.map((x) => [x.seq, x]));

    let draft;
    let verification: { index: number; supported: boolean; reason: string | null }[] = [];
    const flat: { section: string; sectionOrder: number; position: number; text: string; sources: number[] }[] = [];
    try {
      draft = await gatewayDrafting.draft(template, speech.map((x) => ({ seq: x.seq, t: offsetLabel(Number(x.t_start)), text: x.text })));
      draft.sections.forEach((sec, si) =>
        sec.sentences.forEach((sent, pi) => {
          const sources = [...new Set(sent.sources)].filter((n) => bySeq.has(n));
          if (sent.text.trim()) flat.push({ section: sec.heading, sectionOrder: si, position: pi, text: sent.text.trim(), sources });
        }),
      );
      verification = await gatewayDrafting.verify(
        flat.map((f, i) => ({ index: i, text: f.text, sourceText: f.sources.map((n) => bySeq.get(n)!.text).join(" ") })),
      );
    } catch (e) {
      console.error("draft failed", (e as Error).message);
      await ctx.supabase.from("scribe_sessions").update({ status: "draft_failed" }).eq("id", s.id);
      await audit(ctx, s.organisation_id, "scribe.draft.failed", "scribe_session", s.id, {});
      return { ok: false as const, error: "Draft not generated. The drafting service is unavailable. Retry or write the note manually." };
    }

    const verdict = new Map(verification.map((v) => [v.index, v]));
    if (existing) await supabaseAdmin.from("scribe_notes").delete().eq("id", existing.id);
    const { data: note, error: noteErr } = await supabaseAdmin
      .from("scribe_notes")
      .insert({ session_id: s.id, organisation_id: s.organisation_id, template_id: template.id, model: DRAFT_MODEL, consent_statement: consentStatement, generated_at: new Date().toISOString() })
      .select("id")
      .single();
    if (noteErr || !note) throw new Error("Could not save the draft");

    const rows = flat.map((f, i) => {
      const v = verdict.get(i);
      const noSource = f.sources.length === 0;
      const unsupported = v ? !v.supported : true;
      return {
        note_id: note.id, organisation_id: s.organisation_id, section: f.section, section_order: f.sectionOrder, position: f.position,
        text: f.text, source_seqs: f.sources, origin: "machine",
        flagged: noSource || unsupported,
        flag_reason: noSource ? "No source in transcript" : unsupported ? (v?.reason ?? "Verification did not return a result") : null,
      };
    });
    if (rows.length) await supabaseAdmin.from("scribe_sentences").insert(rows);
    for (const sp of draft.speakers) if (bySeq.has(sp.seq)) await supabaseAdmin.from("scribe_segments").update({ speaker: sp.speaker }).eq("session_id", s.id).eq("seq", sp.seq);
    await ctx.supabase.from("scribe_sessions").update({ status: "review" }).eq("id", s.id);
    await audit(ctx, s.organisation_id, "scribe.draft.generated", "scribe_note", note.id, { model: DRAFT_MODEL, sentences: rows.length, flagged: rows.filter((r) => r.flagged).length });
    return { ok: true as const, noteId: note.id as string };
  });

export const startManualNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const s = await loadSession(ctx, data.sessionId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await ctx.supabase.from("scribe_notes").select("id").eq("session_id", s.id).maybeSingle();
    if (existing) return { noteId: existing.id as string };
    const { data: note } = await supabaseAdmin.from("scribe_notes").insert({ session_id: s.id, organisation_id: s.organisation_id, template_id: s.template_id, model: null }).select("id").single();
    await ctx.supabase.from("scribe_sessions").update({ status: "review" }).eq("id", s.id);
    await audit(ctx, s.organisation_id, "scribe.note.manual", "scribe_note", note!.id, {});
    return { noteId: note!.id as string };
  });

export const editSentence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ sentenceId: z.string().uuid(), action: z.enum(["accept", "edit", "delete"]), text: z.string().trim().max(2000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: row } = await ctx.supabase.from("scribe_sentences").select("id,note_id,organisation_id").eq("id", data.sentenceId).maybeSingle();
    if (!row) throw new Error("Sentence not found");
    const patch =
      data.action === "accept" ? { resolution: "accepted" }
      : data.action === "delete" ? { resolution: "deleted", deleted: true }
      : { resolution: "edited", text: data.text ?? "" };
    if (data.action === "edit" && !data.text) throw new Error("Sentence text is required");
    const { error } = await ctx.supabase.from("scribe_sentences").update(patch).eq("id", row.id);
    if (error) throw new Error(error.message.includes("locked") ? "Signed notes are locked." : "Could not update sentence");
    await audit(ctx, row.organisation_id, `scribe.sentence.${data.action}`, "scribe_sentence", row.id, { note_id: row.note_id });
    return { ok: true };
  });

export const addSentence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ noteId: z.string().uuid(), section: z.string().min(1).max(80), sectionOrder: z.number().int(), text: z.string().trim().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: note } = await ctx.supabase.from("scribe_notes").select("id,organisation_id").eq("id", data.noteId).maybeSingle();
    if (!note) throw new Error("Note not found");
    const { error } = await ctx.supabase.from("scribe_sentences").insert({ note_id: note.id, organisation_id: note.organisation_id, section: data.section, section_order: data.sectionOrder, position: 999, text: data.text, origin: "clinician" });
    if (error) throw new Error("Could not add sentence");
    await audit(ctx, note.organisation_id, "scribe.sentence.added", "scribe_note", note.id, {});
    return { ok: true };
  });

export const signNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: note } = await ctx.supabase.from("scribe_notes").select("id,organisation_id,session_id,status").eq("id", data.noteId).maybeSingle();
    if (!note) throw new Error("Note not found");
    if (note.status === "signed") throw new Error("Already signed");
    const m = await membershipFor(ctx, note.organisation_id);
    if (!m || m.status !== "active" || !["owner", "practice_owner", "clinician", "registrar"].includes(m.role)) throw new Error("Your role cannot sign notes.");
    const { data: sents } = await ctx.supabase.from("scribe_sentences").select("flagged,resolution,deleted").eq("note_id", note.id);
    const live = ((sents ?? []) as { flagged: boolean; resolution: string | null; deleted: boolean }[]).filter((x) => !x.deleted);
    const open = live.filter((x) => x.flagged && !x.resolution).length;
    if (open) throw new Error(`${open} flagged sentence${open === 1 ? "" : "s"} must be resolved before signing.`);
    if (!live.length) throw new Error("The note is empty.");
    const { data: clin } = await ctx.supabase.from("clinicians").select("full_name,registration_body,registration_number").eq("user_id", ctx.userId).maybeSingle();
    const signedName = clin ? `${clin.full_name} · ${clin.registration_body} ${clin.registration_number}` : "Clinician";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const signedAt = new Date().toISOString();
    const { error } = await supabaseAdmin.from("scribe_notes").update({ status: "signed", signed_by: ctx.userId, signed_name: signedName, signed_at: signedAt }).eq("id", note.id).eq("status", "draft");
    if (error) throw new Error("Could not sign");
    await supabaseAdmin.from("scribe_sessions").update({ status: "signed" }).eq("id", note.session_id);
    await audit(ctx, note.organisation_id, "scribe.note.signed", "scribe_note", note.id, { sentences: live.length });

    // Retention: default deletes audio when the note is signed.
    const { data: org } = await supabaseAdmin.from("organisations").select("audio_retention").eq("id", note.organisation_id).single();
    if (org?.audio_retention === "on_sign") {
      const { data: chunks } = await supabaseAdmin.from("scribe_audio_chunks").select("id,storage_path").eq("session_id", note.session_id).is("deleted_at", null);
      const paths = (chunks ?? []).map((c) => c.storage_path).filter(Boolean) as string[];
      for (let i = 0; i < paths.length; i += 100) await supabaseAdmin.storage.from("scribe-audio").remove(paths.slice(i, i + 100));
      await supabaseAdmin.from("scribe_audio_chunks").update({ deleted_at: signedAt }).eq("session_id", note.session_id).is("deleted_at", null);
      await audit(ctx, note.organisation_id, "scribe.audio.deleted", "scribe_session", note.session_id, { chunks: paths.length, reason: "retention_on_sign" });
    }
    return { ok: true, signedAt };
  });

export const addAddendum = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ noteId: z.string().uuid(), text: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: note } = await ctx.supabase.from("scribe_notes").select("id,organisation_id,status").eq("id", data.noteId).maybeSingle();
    if (!note || note.status !== "signed") throw new Error("Addenda can only be added to signed notes.");
    const { data: clin } = await ctx.supabase.from("clinicians").select("full_name").eq("user_id", ctx.userId).maybeSingle();
    const { error } = await ctx.supabase.from("scribe_addenda").insert({ note_id: note.id, organisation_id: note.organisation_id, author_id: ctx.userId, author_name: clin?.full_name ?? "Clinician", text: data.text });
    if (error) throw new Error("Could not add addendum");
    await audit(ctx, note.organisation_id, "scribe.addendum.added", "scribe_note", note.id, {});
    return { ok: true };
  });

export const logScribeEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ organisationId: z.string().uuid(), action: z.enum(["scribe.note.viewed", "scribe.note.copied"]), entityId: z.string().uuid(), section: z.string().max(80).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await audit(ctx, data.organisationId, data.action, "scribe_note", data.entityId, data.section ? { section: data.section } : {});
    return { ok: true };
  });
