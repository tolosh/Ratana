import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Lock, PenLine, Check, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useScribeAccount } from "@/lib/use-scribe-account";
import { CONTEXT_LABELS, SPEAKER_LABELS, STATUS_LABELS, clock, offsetLabel, templateById } from "@/lib/scribe-config";
import { addAddendum, addSentence, draftNote, editSentence, logScribeEvent, signNote, startManualNote } from "@/lib/scribe.functions";
import { flushUploads, pendingChunks } from "@/lib/scribe-recorder";
import { ScribeHead, fieldClass } from "@/components/scribe/ScribeShell";
import { MachineMark } from "@/components/lantern/SignalBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/sessions/$sessionId")({
  head: () => ({ meta: [{ title: "Review note · Rātana Scribe" }, { name: "description", content: "Review sources, resolve flags and sign." }, { property: "og:title", content: "Review note · Rātana Scribe" }, { property: "og:description", content: "Review sources, resolve flags and sign." }] }),
  component: ReviewPage,
});

type Sentence = { id: string; section: string; section_order: number; position: number; text: string; source_seqs: number[]; origin: string; flagged: boolean; flag_reason: string | null; resolution: string | null; deleted: boolean };

function ReviewPage() {
  const { sessionId } = Route.useParams();
  const { data: account } = useScribeAccount();
  const qc = useQueryClient();
  const [active, setActive] = useState<number[]>([]);
  const [pending, setPending] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = useServerFn(draftNote);
  const manual = useServerFn(startManualNote);
  const sign = useServerFn(signNote);
  const log = useServerFn(logScribeEvent);
  const logged = useRef(false);

  const q = useQuery({
    queryKey: ["scribe-session", sessionId],
    queryFn: async () => {
      const [s, segs, note] = await Promise.all([
        supabase.from("scribe_sessions").select("*").eq("id", sessionId).maybeSingle(),
        supabase.from("scribe_segments").select("seq,t_start,t_end,kind,text,speaker").eq("session_id", sessionId).order("seq"),
        supabase.from("scribe_notes").select("*").eq("session_id", sessionId).maybeSingle(),
      ]);
      let sentences: Sentence[] = [];
      let addenda: { id: string; author_name: string; text: string; created_at: string }[] = [];
      if (note.data) {
        const [a, b] = await Promise.all([
          supabase.from("scribe_sentences").select("*").eq("note_id", note.data.id).order("section_order").order("position"),
          supabase.from("scribe_addenda").select("id,author_name,text,created_at").eq("note_id", note.data.id).order("created_at"),
        ]);
        sentences = (a.data ?? []) as Sentence[];
        addenda = b.data ?? [];
      }
      return { session: s.data, segments: segs.data ?? [], note: note.data, sentences, addenda };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["scribe-session", sessionId] });

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const before = (await pendingChunks(sessionId)).length;
      if (before) { const r = await flushUploads(sessionId); if (alive) { setPending(r.pending); if (r.uploaded) refresh(); } }
      else if (alive) setPending(0);
    };
    void run();
    const t = setInterval(run, 5000);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (q.data?.note && q.data.session && !logged.current) {
      logged.current = true;
      void log({ data: { organisationId: q.data.session.organisation_id, action: "scribe.note.viewed", entityId: q.data.note.id } });
    }
  }, [q.data, log]);

  const segBySeq = useMemo(() => new Map((q.data?.segments ?? []).map((s) => [s.seq, s])), [q.data]);
  const sections = useMemo(() => {
    const map = new Map<string, { order: number; items: Sentence[] }>();
    for (const s of q.data?.sentences ?? []) {
      if (s.deleted) continue;
      if (!map.has(s.section)) map.set(s.section, { order: s.section_order, items: [] });
      map.get(s.section)!.items.push(s);
    }
    const tpl = templateById(q.data?.note?.template_id ?? "soap");
    tpl.sections.forEach((name, i) => { if (!map.has(name)) map.set(name, { order: i, items: [] }); });
    return [...map.entries()].sort((a, b) => a[1].order - b[1].order);
  }, [q.data]);

  useEffect(() => {
    if (active.length) document.getElementById(`seg-${active[0]}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (q.isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading session</p>;
  if (!q.data?.session) return <p className="p-8 text-sm">Session not found or not available to your role. <Link to="/app" className="text-primary underline">Back to sessions</Link></p>;
  const { session, segments, note, sentences, addenda } = q.data;
  const signed = note?.status === "signed";
  const openFlags = sentences.filter((s) => !s.deleted && s.flagged && !s.resolution).length;
  const liveCount = sentences.filter((s) => !s.deleted).length;
  const speechCount = segments.filter((s) => s.kind === "speech").length;

  async function runDraft() {
    setDrafting(true); setError(null);
    try { const r = await draft({ data: { sessionId } }); if (!r.ok) setError(r.error); }
    catch (e) { setError((e as Error).message); }
    setDrafting(false); refresh();
  }
  async function runManual() { await manual({ data: { sessionId } }); refresh(); }
  async function runSign() {
    setError(null);
    try { await sign({ data: { noteId: note!.id } }); refresh(); qc.invalidateQueries({ queryKey: ["scribe-sessions"] }); }
    catch (e) { setError((e as Error).message); }
  }
  async function copySection(name: string, items: Sentence[]) {
    await navigator.clipboard.writeText(`${name}\n${items.map((i) => i.text).join(" ")}`);
    void log({ data: { organisationId: session!.organisation_id, action: "scribe.note.copied", entityId: note!.id, section: name } });
  }

  return (
    <>
      <ScribeHead
        eyebrow={`${CONTEXT_LABELS[session.context]} · ${templateById(session.template_id).name}`}
        title={session.patient_label}
        summary={`${STATUS_LABELS[session.status]} · started ${clock(session.started_at)} · ended ${clock(session.ended_at)}`}
        actions={note && !signed ? (
          <div className="flex flex-col items-end gap-1">
            <Button onClick={runSign} disabled={openFlags > 0 || liveCount === 0 || account?.aal !== "aal2"}><Lock />Sign note</Button>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{openFlags ? `${openFlags} flag${openFlags === 1 ? "" : "s"} to resolve` : account?.aal !== "aal2" ? "Verify MFA to sign" : "Ready to sign"}</span>
          </div>
        ) : undefined}
      />
      {signed && (
        <div role="status" className="flex flex-wrap items-center gap-2 border-b border-border bg-muted px-5 py-3 text-sm lg:px-8">
          <Lock className="size-4" /><strong>Signed {clock(note.signed_at)}</strong> by {note.signed_name}. Locked. Changes are added as addenda. Audio {account?.org?.audio_retention === "on_sign" ? "deleted on signing" : "retained per organisation policy"}.
        </div>
      )}
      {error && <p role="alert" className="border-b border-destructive px-5 py-3 text-sm text-destructive lg:px-8">{error}</p>}
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:p-8">
        <section className="min-w-0 rounded-card border border-border bg-card lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-semibold">Transcript</h2>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{speechCount} segments{pending ? ` · ${pending} on device` : ""}</span>
          </div>
          <ol className="max-h-[70vh] divide-y divide-border overflow-y-auto">
            {!segments.length && <li className="signal-hatch px-4 py-6 text-sm text-muted-foreground">No data. No transcript has been received for this session.</li>}
            {segments.map((s) => (
              <li key={s.seq} id={`seg-${s.seq}`} className={cn("grid grid-cols-[4.5rem_1fr] gap-3 px-4 py-2 text-sm", s.kind === "off_record" && "signal-hatch", active.includes(s.seq) && "bg-machine-soft outline outline-1 -outline-offset-1 outline-machine")}>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{offsetLabel(Number(s.t_start))}</span>
                <span>{s.kind === "off_record" ? `Off the record ${offsetLabel(Number(s.t_start))}–${offsetLabel(Number(s.t_end))} · not captured` : s.kind === "silence" ? <span className="text-muted-foreground">No speech</span> : <><span className="mr-2 text-xs font-medium text-muted-foreground">{SPEAKER_LABELS[s.speaker]}</span>{s.text}</>}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="min-w-0">
          {!note ? (
            <div className="rounded-card border border-border bg-card p-5">
              {session.status === "draft_failed" ? (
                <><h2 className="font-semibold">Draft not generated</h2><p className="mt-1 text-sm">The drafting service is unavailable. The transcript is kept. Retry, or write the note yourself.</p></>
              ) : (
                <><h2 className="font-semibold">No draft yet</h2><p className="mt-1 text-sm">{pending ? `${pending} chunk${pending === 1 ? "" : "s"} still on this device. Drafting unlocks once they upload.` : speechCount ? "The transcript is complete. Draft the note to review it against its sources." : "No speech transcribed yet."}</p></>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={runDraft} disabled={drafting || pending > 0 || !speechCount}>{drafting ? "Drafting and verifying sources" : session.status === "draft_failed" ? "Retry draft" : "Draft note"}</Button>
                <Button variant="outline" onClick={runManual} disabled={drafting}>Write manually</Button>
              </div>
              {drafting && <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">Drafting from the transcript, then checking every sentence against its sources. This can take a minute.</p>}
            </div>
          ) : (
            <div className="rounded-card border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                {note.model ? <MachineMark verb="Drafted" confidence="Moderate" /> : <span className="text-xs font-medium text-muted-foreground">Written by clinician</span>}
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {note.model ? `Model ${note.model} · generated ${clock(note.generated_at)} · each sentence checked against its cited transcript segments` : "No machine draft"}
                </p>
              </div>
              {note.consent_statement && (
                <div className="border-b border-border px-4 py-3 text-sm"><div className="text-[11px] font-semibold uppercase text-muted-foreground">Consent</div><p className="mt-1">{note.consent_statement}</p></div>
              )}
              {sections.map(([name, sec]) => (
                <div key={name} className="border-b border-border px-4 py-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-semibold uppercase text-muted-foreground">{name}</h3>
                    {sec.items.length > 0 && <Button variant="ghost" size="sm" onClick={() => copySection(name, sec.items)} aria-label={`Copy ${name}`}><Copy />Copy</Button>}
                  </div>
                  {!sec.items.length && <p className="mt-1 text-sm text-muted-foreground">Nothing recorded for this section.</p>}
                  <ul className="mt-1 space-y-1">
                    {sec.items.map((s) => <SentenceRow key={s.id} s={s} signed={signed} segBySeq={segBySeq} onActive={setActive} onChange={refresh} />)}
                  </ul>
                  {!signed && <AddSentence noteId={note.id} section={name} order={sec.order} onDone={refresh} />}
                </div>
              ))}
              {signed && <Addenda noteId={note.id} addenda={addenda} onDone={refresh} />}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function SentenceRow({ s, signed, segBySeq, onActive, onChange }: { s: Sentence; signed: boolean; segBySeq: Map<number, { t_start: number }>; onActive: (x: number[]) => void; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(s.text);
  const [err, setErr] = useState<string | null>(null);
  const edit = useServerFn(editSentence);
  const machine = s.origin === "machine";
  const openFlag = s.flagged && !s.resolution;
  const sources = s.source_seqs.map((n) => segBySeq.get(n)).filter(Boolean).map((x) => offsetLabel(Number(x!.t_start)));

  async function act(action: "accept" | "edit" | "delete") {
    setErr(null);
    try { await edit({ data: { sentenceId: s.id, action, text: action === "edit" ? text : undefined } }); setEditing(false); onChange(); }
    catch (e) { setErr((e as Error).message); }
  }

  return (
    <li
      tabIndex={0}
      onMouseEnter={() => onActive(s.source_seqs)} onMouseLeave={() => onActive([])}
      onFocus={() => onActive(s.source_seqs)} onBlur={() => onActive([])}
      className={cn("rounded-control border-l-2 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", machine && s.resolution !== "edited" ? "border-machine" : "border-border", openFlag && "border border-l-2 border-machine bg-machine-soft")}
    >
      {editing ? (
        <div className="space-y-2">
          <textarea className={cn(fieldClass, "h-24 py-2")} value={text} onChange={(e) => setText(e.target.value)} aria-label="Edit sentence" />
          <div className="flex gap-2"><Button size="sm" onClick={() => act("edit")}>Save</Button><Button size="sm" variant="outline" onClick={() => { setEditing(false); setText(s.text); }}>Cancel</Button></div>
        </div>
      ) : <p className="leading-6">{s.text}</p>}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        {machine ? <span className="text-machine">{s.resolution === "edited" ? "Drafted · edited by clinician" : "Drafted"} · sources {sources.length ? sources.join(", ") : "none"}</span> : <span>Clinician-written</span>}
        {s.flagged && <span className={openFlag ? "text-machine" : ""}>{openFlag ? "Flag" : `Flag ${s.resolution}`} · {s.flag_reason}</span>}
      </div>
      {!signed && !editing && (
        <div className="mt-1 flex flex-wrap gap-1">
          {openFlag && <Button size="sm" variant="outline" onClick={() => act("accept")}><Check />Accept</Button>}
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><PenLine />Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => act("delete")}><Trash2 />Delete</Button>
        </div>
      )}
      {err && <p role="alert" className="mt-1 text-xs text-destructive">{err}</p>}
    </li>
  );
}

function AddSentence({ noteId, section, order, onDone }: { noteId: string; section: string; order: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const add = useServerFn(addSentence);
  if (!open) return <Button size="sm" variant="ghost" className="mt-1" onClick={() => setOpen(true)}><Plus />Add sentence</Button>;
  return (
    <form className="mt-2 space-y-2" onSubmit={async (e) => { e.preventDefault(); await add({ data: { noteId, section, sectionOrder: order, text } }); setText(""); setOpen(false); onDone(); }}>
      <textarea className={cn(fieldClass, "h-20 py-2")} required value={text} onChange={(e) => setText(e.target.value)} aria-label={`New sentence for ${section}`} />
      <div className="flex gap-2"><Button size="sm" type="submit">Add</Button><Button size="sm" variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button></div>
    </form>
  );
}

function Addenda({ noteId, addenda, onDone }: { noteId: string; addenda: { id: string; author_name: string; text: string; created_at: string }[]; onDone: () => void }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const add = useServerFn(addAddendum);
  return (
    <div className="border-t border-border px-4 py-3">
      <h3 className="text-[11px] font-semibold uppercase text-muted-foreground">Addenda</h3>
      {!addenda.length && <p className="mt-1 text-sm text-muted-foreground">None.</p>}
      <ul className="mt-1 space-y-2">{addenda.map((a) => <li key={a.id} className="text-sm"><span className="font-mono text-[11px] text-muted-foreground">{clock(a.created_at)} · {a.author_name}</span><p>{a.text}</p></li>)}</ul>
      <form className="mt-3 space-y-2" onSubmit={async (e) => { e.preventDefault(); setErr(null); try { await add({ data: { noteId, text } }); setText(""); onDone(); } catch (x) { setErr((x as Error).message); } }}>
        <textarea className={cn(fieldClass, "h-20 py-2")} required value={text} onChange={(e) => setText(e.target.value)} aria-label="Addendum" />
        <Button size="sm" type="submit">Add addendum</Button>
        {err && <p role="alert" className="text-xs text-destructive">{err}</p>}
      </form>
    </div>
  );
}
