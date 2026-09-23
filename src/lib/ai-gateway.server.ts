// Server-only helpers for Lovable AI Gateway calls.
import { createOpenAI } from "@ai-sdk/openai";

export const GATEWAY_BASE = "https://ai.gateway.lovable.dev";

/** Wraps fetch so the gateway-minted run id is captured and resent on follow-up calls. */
export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId;
  const wrapped: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
    const res = await fetch(input, { ...init, headers });
    const minted = res.headers.get("X-Lovable-AIG-Run-ID");
    if (minted) runId = minted;
    return res;
  };
  return { fetch: wrapped, get runId() { return runId; } };
}

export function responsesProvider(apiKey: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  return createOpenAI({
    baseURL: `${GATEWAY_BASE}/v1`,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
}

export function requireGatewayKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Transcription and drafting are not configured.");
  return key;
}
