import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, EyeOff, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useScribeAccount } from "@/lib/use-scribe-account";
import { CONSENT_SCRIPT, CONSENT_SCRIPT_VERSION, CONTEXT_LABELS, SPEAKER_LABELS, TEMPLATES, offsetLabel } from "@/lib/scribe-config";
import { captureConsent, createSession, endRecording, markOffRecord } from "@/lib/scribe.functions";
import { ChunkRecorder, flushUploads, pendingChunks, type RecorderState } from "@/lib/scribe-recorder";
import { ScribeHead, fieldClass } from "@/components/scribe/ScribeShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/new")({
  head: () => ({ meta: [{ title: "New session · Rātana Scribe" }, { name: "description", content: "Capture consent and record a consult." }, { property: "og:title", content: "New session · Rātana Scribe" }, { property: "og:description", content: "Capture consent and record a consult." }] }),
  component: NewSessionPage,
});

type Step = "setup" | "consent" | "recording";

function NewSessionPage() {
  const { data: account } = useScribeAccount();
  const [step, setStep] = useState<Step>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [form, setForm] = useState({ patientLabel: "", context: "in_person", templateId: "soap" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createSession);
  const consent = useServerFn(captureConsent);

  const mfaReady = true;
  const canCapture = account?.membership && ["owner", "practice_owner", "clinician", "registrar", "assistant"].includes(account.membership.role);

  async function submitSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!account?.org) return;
    setBusy(true); setError(null);
    try {
      const { id } = await create({ data: { organisationId: account.org.id, patientLabel: form.patientLabel, context: form.context as "in_person", templateId: form.templateId } });
      setSessionId(id); setStep("consent");
    } catch { setError("Session could not be created. Try again."); }
    setBusy(false);
  }

  async function giveConsent() {
    if (!sessionId) return;
    setBusy(true); setError(null);
    try { await consent({ data: { sessionId } }); setStep("recording"); }
    catch (e) { setError((e as Error).message || "Consent could not be recorded."); }
    setBusy(false);
  }

  if (account && !mfaReady) {
    return (
      <>
        <ScribeHead eyebrow="Scribe" title="New session" />
        <div className="p-5 lg:p-8">
          <div role="status" className="max-w-xl rounded-card border border-border bg-card p-5">
            <h2 className="font-semibold">Recording locked</h2>
            <p className="mt-1 text-sm">{account.hasFactor ? "Verify your authenticator code for this sign-in before capturing patient audio." : "Set up multi-factor authentication before capturing patient audio."}</p>
            <Button asChild className="mt-4"><Link to="/app/security">{account.hasFactor ? "Verify now" : "Set up now"}</Link></Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ScribeHead eyebrow={`Scribe · step ${step === "setup" ? 1 : step === "consent" ? 2 : 3} of 3`} title={step === "setup" ? "New session" : step === "consent" ? "Consent" : form.patientLabel} summary={step === "recording" ? `${CONTEXT_LABELS[form.context]} · ${TEMPLATES.find((t) => t.id === form.templateId)?.name}` : undefined} />
      <div className="p-5 lg:p-8">
        {!canCapture && <p role="alert" className="mb-4 text-sm text-destructive">Your role cannot capture sessions.</p>}
        {step === "setup" && (
          <form onSubmit={submitSetup} className="grid max-w-2xl gap-4">
            <label className="text-sm font-medium">Patient
              <input className={cn(fieldClass, "mt-1")} required maxLength={120} placeholder="Name or reference" value={form.patientLabel} onChange={(e) => setForm({ ...form, patientLabel: e.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Consult type
                <select className={cn(fieldClass, "mt-1")} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })}>
                  {Object.entries(CONTEXT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Template
                <select className={cn(fieldClass, "mt-1")} value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}>
                  {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
            </div>
            {form.context === "telehealth" && <p className="text-xs text-muted-foreground">Telehealth: keep the call on speaker so this device's microphone hears both sides.</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div><Button type="submit" disabled={busy || !canCapture}>Continue to consent</Button></div>
          </form>
        )}

        {step === "consent" && (
          <div className="max-w-2xl">
            <section className="rounded-card border border-border bg-card p-5">
              <div className="text-[11px] font-semibold uppercase text-muted-foreground">Read to the patient · {CONSENT_SCRIPT_VERSION}</div>
              <p className="mt-3 text-base leading-7">{CONSENT_SCRIPT}</p>
            </section>
            <p className="mt-3 text-xs text-muted-foreground">Recording cannot start until consent is captured. Consent is stored on the session, inserted in the note and written to the audit trail.</p>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={giveConsent} disabled={busy}>Patient consents · start recording</Button>
              <Button variant="outline" asChild><Link to="/app">Patient declines</Link></Button>
            </div>
          </div>
        )}

        {step === "recording" && sessionId && <Recorder sessionId={sessionId} />}
      </div>
    </>
  );
}

function Recorder({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const recRef = useRef<ChunkRecorder | null>(null);
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [captured, setCaptured] = useState(0);
  const [pending, setPending] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const offRecord = useServerFn(markOffRecord);
  const end = useServerFn(endRecording);

  const { data: segments } = useQuery({
    queryKey: ["scribe-live", sessionId],
    refetchInterval: 3000,
    queryFn: async () => (await supabase.from("scribe_segments").select("seq,t_start,t_end,kind,text,speaker").eq("session_id", sessionId).order("seq")).data ?? [],
  });

  async function upload() {
    const r = await flushUploads(sessionId);
    setPending(r.pending);
    setUploadError(r.error && r.error !== "offline" ? r.error : null);
  }

  useEffect(() => {
    const rec = new ChunkRecorder(
      sessionId,
      () => { setCaptured((n) => n + 1); void upload(); },
      (seq, from, to) => { void offRecord({ data: { sessionId, seq, tStart: from, tEnd: to } }); },
    );
    recRef.current = rec;
    rec.start().then(() => setState("recording")).catch((e: Error) => setMicError(e.name === "NotAllowedError" ? "denied" : "unavailable"));
    const tick = setInterval(() => setElapsed(rec.elapsed()), 500);
    const retry = setInterval(() => void upload(), 5000);
    const on = () => { setOnline(true); void upload(); };
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { clearInterval(tick); clearInterval(retry); window.removeEventListener("online", on); window.removeEventListener("offline", off); if (rec.state !== "idle") void rec.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function act(kind: "pause" | "resume" | "off" | "end") {
    const rec = recRef.current;
    if (!rec) return;
    if (kind === "pause") await rec.pause();
    if (kind === "resume") rec.resume();
    if (kind === "off") await rec.offRecord();
    if (kind === "end") {
      setEnding(true);
      await rec.stop();
      await upload();
      await end({ data: { sessionId, chunks: rec.seq } });
      navigate({ to: "/app/sessions/$sessionId", params: { sessionId } });
      return;
    }
    setState(rec.state);
  }

  if (micError) {
    return (
      <div role="alert" className="max-w-xl rounded-card border border-border bg-card p-5">
        <h2 className="font-semibold">{micError === "denied" ? "Microphone access blocked" : "No microphone available"}</h2>
        <p className="mt-1 text-sm">{micError === "denied" ? "Allow microphone access for this site in your browser settings, then reload this page. Consent is already recorded." : "Connect a microphone and reload this page."}</p>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }

  const uploaded = Math.max(0, captured - pending);
  const stateLabel = state === "recording" ? "Recording" : state === "paused" ? "Paused" : state === "off_record" ? "Off the record · not capturing" : "Starting microphone";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <section className="rounded-card border border-border bg-card p-5" aria-live="polite">
        <div className="text-[11px] font-semibold uppercase text-muted-foreground">Status</div>
        <div className="mt-1 flex items-center gap-2 font-semibold">
          <span aria-hidden className={cn("inline-block size-2.5 rounded-full", state === "recording" ? "bg-primary" : "bg-nodata")} />
          {stateLabel}
        </div>
        <div className="mt-3 font-mono text-4xl tabular-nums">{offsetLabel(elapsed)}</div>
        <dl className="mt-4 space-y-1 font-mono text-xs tabular-nums">
          <div className="flex justify-between"><dt className="text-muted-foreground">Chunks captured</dt><dd>{captured}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Uploaded</dt><dd>{uploaded} of {captured}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Stored on this device</dt><dd>{pending}</dd></div>
        </dl>
        {!online && <p role="status" className="mt-4 flex gap-2 rounded-control border border-border bg-muted p-3 text-xs"><WifiOff className="size-4 shrink-0" />Offline. {pending} chunk{pending === 1 ? "" : "s"} stored on this device. Will upload when connected.</p>}
        {uploadError && online && <p role="status" className="mt-4 rounded-control border border-border bg-muted p-3 text-xs">{uploadError} Retrying every 5 s. Audio stays on this device until it uploads.</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {state === "recording" ? <Button variant="outline" onClick={() => act("pause")}><Pause />Pause</Button> : <Button variant="outline" onClick={() => act("resume")} disabled={state === "idle"}><Play />{state === "off_record" ? "Back on record" : "Resume"}</Button>}
          <Button variant="outline" onClick={() => act("off")} disabled={state !== "recording"}><EyeOff />Off the record</Button>
          <Button className="col-span-2" onClick={() => act("end")} disabled={ending || state === "idle"}><Square />{ending ? "Finishing upload" : "End consult"}</Button>
        </div>
      </section>

      <section className="min-w-0 rounded-card border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="font-semibold">Live transcript</h2><span className="text-xs text-muted-foreground">Updates every 5 s · speakers labelled when drafting</span></div>
        <ol className="max-h-[60vh] divide-y divide-border overflow-y-auto">
          {!segments?.length && <li className="signal-hatch px-4 py-6 text-sm text-muted-foreground">No data. Transcript appears here once the first 5-second chunk uploads.</li>}
          {segments?.map((s) => (
            <li key={s.seq} className={cn("grid grid-cols-[4.5rem_1fr] gap-3 px-4 py-2 text-sm", s.kind === "off_record" && "signal-hatch")}>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{offsetLabel(Number(s.t_start))}</span>
              <span>{s.kind === "off_record" ? `Off the record ${offsetLabel(Number(s.t_start))}–${offsetLabel(Number(s.t_end))} · not captured` : s.kind === "silence" ? <span className="text-muted-foreground">No speech</span> : <><span className="mr-2 text-xs font-medium text-muted-foreground">{SPEAKER_LABELS[s.speaker]}</span>{s.text}</>}</span>
            </li>
          ))}
        </ol>
      </section>
      <PendingNote sessionId={sessionId} />
    </div>
  );
}

function PendingNote({ sessionId }: { sessionId: string }) {
  const [n, setN] = useState(0);
  useEffect(() => { pendingChunks(sessionId).then((c) => setN(c.length)); }, [sessionId]);
  return n ? <span className="sr-only">{n} chunks pending</span> : null;
}
