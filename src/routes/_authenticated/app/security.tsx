import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useScribeAccount } from "@/lib/use-scribe-account";
import { PLANS, type PlanId } from "@/lib/scribe-config";
import { ScribeHead, fieldClass } from "@/components/scribe/ScribeShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/security")({
  head: () => ({ meta: [{ title: "Security and plan · Rātana Scribe" }, { name: "description", content: "Multi-factor authentication, plan and retention." }, { property: "og:title", content: "Security and plan · Rātana Scribe" }, { property: "og:description", content: "Multi-factor authentication, plan and retention." }] }),
  component: SecurityPage,
});

function SecurityPage() {
  const { data: account } = useScribeAccount();
  const qc = useQueryClient();
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp.find((f) => f.status === "verified");
      if (verified) setFactorId(verified.id);
    });
  }, [account?.aal]);

  async function startEnroll() {
    setError(null); setBusy(true);
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Rātana ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (error || !data) { setError(`Authenticator set-up could not start. ${error?.message ?? ""}`.trim()); return; }
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const id = enroll?.factorId ?? factorId;
    if (!id) return;
    setBusy(true); setError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code: code.trim() });
    setBusy(false);
    if (error) { setError("Code not accepted. Check the time on your device and enter the current 6-digit code."); return; }
    setEnroll(null); setCode("");
    await qc.invalidateQueries({ queryKey: ["scribe-account"] });
  }

  const verifiedNow = account?.aal === "aal2";
  const plan = PLANS[(account?.org?.plan as PlanId) ?? "free"] ?? PLANS.free;

  return (
    <>
      <ScribeHead eyebrow="Account" title="Security and plan" summary="Multi-factor authentication is required before patient audio is captured and before notes are signed." />
      <div className="grid gap-5 p-5 lg:grid-cols-2 lg:p-8">
        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-semibold">Multi-factor authentication</h2>
          <p className="mt-1 text-sm">
            Status: <strong>{verifiedNow ? "Verified for this sign-in" : account?.hasFactor ? "Set up · verify for this sign-in" : "Not set up"}</strong>
          </p>
          {!account?.hasFactor && !enroll && <Button className="mt-4" onClick={startEnroll} disabled={busy}>Set up authenticator app</Button>}
          {enroll && (
            <div className="mt-4 space-y-3">
              <p className="text-sm">Scan with an authenticator app, then enter the 6-digit code.</p>
              <img src={enroll.qr} alt="Authenticator set-up QR code" className="size-44 rounded-control border border-border bg-card p-2" />
              <p className="text-xs text-muted-foreground">Or enter this key: <span className="break-all font-mono">{enroll.secret}</span></p>
            </div>
          )}
          {(enroll || (account?.hasFactor && !verifiedNow)) && (
            <form onSubmit={verify} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-sm font-medium">6-digit code
                <input className={cn(fieldClass, "mt-1 w-40 font-mono tabular-nums")} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required value={code} onChange={(e) => setCode(e.target.value)} />
              </label>
              <Button type="submit" disabled={busy}>Verify</Button>
            </form>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        </section>

        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="font-semibold">Clinician</h2>
          {account?.clinician ? (
            <dl className="mt-2 text-sm">
              {[["Name", account.clinician.full_name], ["Profession", account.clinician.profession], ["Registration", `${account.clinician.registration_body} ${account.clinician.registration_number}`], ["Verification", account.clinician.verification_status === "pending" ? "Pending review" : account.clinician.verification_status]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-t border-border py-2 first:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
          ) : <p className="mt-2 text-sm text-muted-foreground">No data</p>}
        </section>

        <section className="rounded-card border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-semibold">Plan</h2>
          <p className="mt-1 text-sm">Current: <strong>{plan.name}</strong> · {plan.summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {(Object.keys(PLANS) as PlanId[]).map((id) => (
              <div key={id} className={cn("rounded-card border p-4", id === (account?.org?.plan ?? "free") ? "border-primary" : "border-border")}>
                <div className="font-semibold">{PLANS[id].name}</div>
                <div className="mt-1 font-mono text-sm tabular-nums">{PLANS[id].price}</div>
                <p className="mt-2 text-xs text-muted-foreground">{PLANS[id].summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">{PLANS[id].seats}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Audio retention: {account?.org?.audio_retention === "on_sign" ? "deleted when the note is signed" : account?.org?.audio_retention === "7_days" ? "7 days" : "30 days"}.</p>
        </section>
      </div>
    </>
  );
}
