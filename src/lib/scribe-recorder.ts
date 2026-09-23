// Browser-only capture: PCM → 5-second WAV chunks → IndexedDB → upload queue.
// Every chunk is written to IndexedDB before upload, so a dropped signal never loses audio.
import { supabase } from "@/integrations/supabase/client";
import { CHUNK_SECONDS } from "./scribe-config";

const TARGET_RATE = 16000;
type StoredChunk = { sessionId: string; seq: number; tStart: number; tEnd: number; silent: boolean; blob: Blob };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ratana-scribe", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("chunks", { keyPath: ["sessionId", "seq"] });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction("chunks", mode);
    const r = fn(t.objectStore("chunks"));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export const putChunk = (c: StoredChunk) => tx("readwrite", (s) => s.put(c));
const deleteChunk = (sessionId: string, seq: number) => tx("readwrite", (s) => s.delete([sessionId, seq]));
export async function pendingChunks(sessionId?: string): Promise<StoredChunk[]> {
  const all = (await tx("readonly", (s) => s.getAll())) as StoredChunk[];
  return all.filter((c) => !sessionId || c.sessionId === sessionId).sort((a, b) => a.seq - b.seq);
}

export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const tag = (o: number, v: string) => { for (let i = 0; i < v.length; i++) view.setUint8(o + i, v.charCodeAt(i)); };
  tag(0, "RIFF"); view.setUint32(4, 36 + samples.length * 2, true); tag(8, "WAVE"); tag(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  tag(36, "data"); view.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (const v of samples) { const s = Math.max(-1, Math.min(1, v)); view.setInt16(o, s * (s < 0 ? 32768 : 32767), true); o += 2; }
  return new Blob([bytes], { type: "audio/wav" });
}

function downsample(chunks: Float32Array[], from: number): Float32Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  if (from === TARGET_RATE) return merged;
  const ratio = from / TARGET_RATE;
  const out = new Float32Array(Math.floor(total / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio), end = Math.min(total, Math.floor((i + 1) * ratio));
    let sum = 0; for (let j = start; j < end; j++) sum += merged[j]; out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

export type RecorderState = "idle" | "recording" | "paused" | "off_record";

export class ChunkRecorder {
  private stream?: MediaStream;
  private ctx?: AudioContext;
  private node?: ScriptProcessorNode;
  private buffer: Float32Array[] = [];
  private bufferedSamples = 0;
  private windowStart = 0;
  private elapsedBase = 0;
  private resumedAt = 0;
  private offRecordStart = 0;
  state: RecorderState = "idle";
  seq = 0;

  constructor(private sessionId: string, private onChunk: (seq: number) => void, private onOffRecord: (seq: number, from: number, to: number) => void) {}

  elapsed() { return this.state === "recording" ? this.elapsedBase + (performance.now() - this.resumedAt) / 1000 : this.elapsedBase; }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    this.ctx = new AudioContext();
    await this.ctx.resume();
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = (e) => {
      if (this.state !== "recording") return;
      this.buffer.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      this.bufferedSamples += e.inputBuffer.length;
      if (this.bufferedSamples >= this.ctx!.sampleRate * CHUNK_SECONDS) void this.flush();
    };
    source.connect(this.node);
    this.node.connect(this.ctx.destination);
    this.state = "recording";
    this.resumedAt = performance.now();
    this.windowStart = 0;
  }

  private async flush() {
    if (!this.buffer.length || !this.ctx) return;
    const chunks = this.buffer; this.buffer = []; this.bufferedSamples = 0;
    const samples = downsample(chunks, this.ctx.sampleRate);
    let sq = 0; for (const v of samples) sq += v * v;
    const rms = Math.sqrt(sq / Math.max(1, samples.length));
    const seq = this.seq++;
    const tStart = this.windowStart;
    const tEnd = tStart + samples.length / TARGET_RATE;
    this.windowStart = tEnd;
    await putChunk({ sessionId: this.sessionId, seq, tStart, tEnd, silent: rms < 0.004, blob: encodeWav(samples, TARGET_RATE) });
    this.onChunk(seq);
  }

  async pause() {
    if (this.state !== "recording") return;
    this.elapsedBase = this.elapsed();
    this.state = "paused";
    await this.flush();
  }
  resume() {
    if (this.state === "off_record") {
      const seq = this.seq++;
      this.onOffRecord(seq, this.offRecordStart, this.elapsedBase);
      this.windowStart = this.elapsedBase;
    }
    this.state = "recording";
    this.resumedAt = performance.now();
  }
  async offRecord() {
    if (this.state === "recording") { this.elapsedBase = this.elapsed(); await this.flush(); }
    this.offRecordStart = this.elapsedBase;
    this.state = "off_record";
  }
  async stop() {
    if (this.state === "recording") this.elapsedBase = this.elapsed();
    if (this.state === "off_record") { const seq = this.seq++; this.onOffRecord(seq, this.offRecordStart, this.elapsedBase); }
    this.state = "idle";
    await this.flush();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.node?.disconnect();
    await this.ctx?.close().catch(() => undefined);
  }
}

/** Uploads pending chunks in order. Returns counts. Failures stay in IndexedDB for the next attempt. */
let uploading = false;
export async function flushUploads(sessionId?: string): Promise<{ uploaded: number; pending: number; error?: string }> {
  if (uploading) return { uploaded: 0, pending: (await pendingChunks(sessionId)).length };
  uploading = true;
  let uploaded = 0;
  let error: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { uploaded, pending: (await pendingChunks(sessionId)).length, error: "Signed out" };
    for (const c of await pendingChunks(sessionId)) {
      if (typeof navigator !== "undefined" && !navigator.onLine) { error = "offline"; break; }
      const form = new FormData();
      form.append("sessionId", c.sessionId);
      form.append("seq", String(c.seq));
      form.append("tStart", c.tStart.toFixed(2));
      form.append("tEnd", c.tEnd.toFixed(2));
      form.append("silent", c.silent ? "1" : "0");
      form.append("file", new File([c.blob], `chunk-${c.seq}.wav`, { type: "audio/wav" }));
      try {
        const res = await fetch("/api/scribe/chunk", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
        if (res.ok) { await deleteChunk(c.sessionId, c.seq); uploaded++; continue; }
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        error = body.error ?? `Upload failed (${res.status})`;
        if (res.status === 409) { await deleteChunk(c.sessionId, c.seq); continue; }
        break;
      } catch {
        error = "offline";
        break;
      }
    }
  } finally {
    uploading = false;
  }
  return { uploaded, pending: (await pendingChunks(sessionId)).length, error };
}
