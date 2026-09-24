import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mic, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useScribeAccount } from "@/lib/use-scribe-account";
import { CONTEXT_LABELS, STATUS_LABELS, clock, templateById } from "@/lib/scribe-config";
import { ScribeHead } from "@/components/scribe/ScribeShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Sessions · Rātana Scribe" }, { name: "description", content: "Your recorded consultations and notes." }, { property: "og:title", content: "Sessions · Rātana Scribe" }, { property: "og:description", content: "Your recorded consultations and notes." }] }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data: account } = useScribeAccount();
  const orgId = account?.org?.id;
  const { data, isLoading, error } = useQuery({
    queryKey: ["scribe-sessions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("scribe_sessions").select("id,patient_label,context,template_id,status,created_at,started_at,ended_at").eq("organisation_id", orgId!).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <ScribeHead eyebrow="Scribe" title="Sessions" summary="Every note is drafted from the recording and filed only after you sign it." actions={<Button asChild><Link to="/app/new"><Mic />New session</Link></Button>} />
      <div className="p-5 lg:p-8">
        {false && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-border bg-muted px-4 py-3 text-sm">
            <span><strong>Set up multi-factor authentication</strong> before recording patient audio.</span>
            <Button asChild size="sm" variant="outline" className="ml-auto"><Link to="/app/security">Set up now</Link></Button>
          </div>
        )}
        {error ? (
          <p role="alert" className="rounded-card border border-destructive p-4 text-sm text-destructive">Sessions could not be loaded. Refresh to try again.</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions</p>
        ) : !data?.length ? (
          <div className="rounded-card border border-dashed border-border bg-card p-10 text-center">
            <h2 className="font-display text-2xl font-semibold">No sessions yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Start a session, capture consent, and record the consult.</p>
            <Button asChild className="mt-5"><Link to="/app/new"><Mic />New session</Link></Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted text-[11px] uppercase text-muted-foreground">
                <tr><th className="px-4 py-3">Patient</th><th>Context</th><th>Template</th><th>Started</th><th>Status</th><th><span className="sr-only">Open</span></th></tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id} className="h-10 border-t border-border hover:bg-accent">
                    <td className="px-4 py-2 font-medium"><Link to="/app/sessions/$sessionId" params={{ sessionId: s.id }} className="hover:underline">{s.patient_label}</Link></td>
                    <td>{CONTEXT_LABELS[s.context]}</td>
                    <td>{templateById(s.template_id).name}</td>
                    <td className="font-mono text-xs tabular-nums">{clock(s.started_at ?? s.created_at)}</td>
                    <td><span className={s.status === "signed" ? "text-foreground" : s.status === "review" ? "font-medium text-primary" : "text-muted-foreground"}>{STATUS_LABELS[s.status]}</span></td>
                    <td className="pr-2 text-right"><Button asChild variant="ghost" size="icon" aria-label={`Open ${s.patient_label}`}><Link to="/app/sessions/$sessionId" params={{ sessionId: s.id }}><ChevronRight /></Link></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
