// Server-only scribe engine: transcription, drafting and verification behind swappable interfaces.
import { streamText, Output } from "ai";
import { z } from "zod";
import { GATEWAY_BASE, requireGatewayKey, responsesProvider } from "./ai-gateway.server";
import type { TemplateDef } from "./scribe-config";

export const TRANSCRIBE_MODEL = "google/gemini-3.5-transcribe";
export const DRAFT_MODEL = "openai/gpt-6-astra";

export class ProviderError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// ---------- Transcription ----------
export interface TranscriptionProvider { transcribe(file: File): Promise<string> }

export const gatewayTranscription: TranscriptionProvider = {
  async transcribe(file) {
    const key = requireGatewayKey();
    const form = new FormData();
    form.append("model", TRANSCRIBE_MODEL);
    form.append("file", file, file.name);
    form.append("response_format", "json");
    form.append("stream", "true");
    form.append("language", "en");
    const res = await fetch(`${GATEWAY_BASE}/v1/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      console.error("transcription failed", res.status, body.slice(0, 200));
      throw new ProviderError("Transcription unavailable", res.status);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let deltas = "";
    let final: string | null = null;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const evt = JSON.parse(data) as { type?: string; delta?: string; text?: string; error?: { message?: string } };
            if (evt.type === "transcript.text.delta" && evt.delta) deltas += evt.delta;
            else if (evt.type === "transcript.text.done" && typeof evt.text === "string") final = evt.text;
            else if (evt.error) throw new ProviderError("Transcription unavailable", 502);
          } catch (e) {
            if (e instanceof ProviderError) throw e;
          }
        }
      }
    }
    return (final ?? deltas).trim();
  },
};

// ---------- Drafting ----------
export type DraftSegment = { seq: number; t: string; text: string };
export type DraftResult = {
  speakers: { seq: number; speaker: "clinician" | "patient" | "carer" | "other" }[];
  sections: { heading: string; sentences: { text: string; sources: number[] }[] }[];
};
export type Verification = { index: number; supported: boolean; reason: string | null }[];

const draftSchema = z.object({
  speakers: z.array(z.object({ seq: z.number().int(), speaker: z.enum(["clinician", "patient", "carer", "other"]) })),
  sections: z.array(
    z.object({
      heading: z.string(),
      sentences: z.array(z.object({ text: z.string(), sources: z.array(z.number().int()) })),
    }),
  ),
});

const verifySchema = z.object({
  results: z.array(z.object({ index: z.number().int(), supported: z.boolean(), reason: z.string().nullable() })),
});

const HARD_RULES = `Hard rules:
- Write only what was said in the transcript. Never add a diagnosis, differential diagnosis, investigation or treatment the clinician did not say.
- Never recommend, prescribe or change management. Never infer severity or urgency.
- Every sentence must cite the transcript segment numbers (seq) it came from in "sources". No sources means do not write the sentence.
- Omit a section's sentences entirely if nothing in the transcript supports it.
- Clinical style: terse, past tense, Australian English. 24-hour time. Doses as "0.5 mg" (leading zero, no trailing zero, space before unit). Use Tall Man lettering for look-alike drug names (for example predniSONE, predniSOLONE, hydrOXYzine, hydrALAZINE).
- No exclamation marks or emoji.`;

export interface DraftingProvider {
  draft(template: TemplateDef, segments: DraftSegment[]): Promise<DraftResult>;
  verify(sentences: { index: number; text: string; sourceText: string }[]): Promise<Verification>;
}

const reasoning = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

export const gatewayDrafting: DraftingProvider = {
  async draft(template, segments) {
    const provider = responsesProvider(requireGatewayKey());
    const transcript = segments.map((s) => `[${s.seq}] (${s.t}) ${s.text}`).join("\n");
    const result = streamText({
      model: provider.responses(DRAFT_MODEL),
      output: Output.object({ schema: draftSchema }),
      system: `You draft clinical notes from a consultation transcript for a clinician to review and sign.\n${HARD_RULES}\nAlso label each transcript segment's main speaker (clinician, patient, carer or other) from context.`,
      prompt: `Template: ${template.name}\nSections, in order: ${template.sections.join(" | ")}\nTemplate rules:\n- ${template.rules.join("\n- ")}\n\nTranscript (each line: [seq] (offset) text):\n${transcript}`,
      providerOptions: reasoning,
      maxRetries: 0,
    });
    return (await result.output) as DraftResult;
  },
  async verify(sentences) {
    if (!sentences.length) return [];
    const provider = responsesProvider(requireGatewayKey());
    const result = streamText({
      model: provider.responses(DRAFT_MODEL),
      output: Output.object({ schema: verifySchema }),
      system:
        "You check a drafted clinical note against its cited sources. For each sentence decide whether the cited source text fully supports it. A sentence is unsupported if it adds any fact, diagnosis, differential, treatment, dose, time or value not present in its sources. Give a short reason (under 15 words) for every unsupported sentence; reason is null when supported.",
      prompt: sentences.map((s) => `#${s.index}\nSentence: ${s.text}\nSources: ${s.sourceText || "(none)"}`).join("\n\n"),
      providerOptions: reasoning,
      maxRetries: 0,
    });
    const out = (await result.output) as z.infer<typeof verifySchema>;
    return out.results;
  },
};
