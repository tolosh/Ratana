import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Mic, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useScribeAccount } from "@/lib/use-scribe-account";
import { PLANS, type PlanId } from "@/lib/scribe-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "Sessions", icon: FileText },
  { to: "/app/new", label: "New session", icon: Mic },
  { to: "/app/security", label: "Security and plan", icon: ShieldCheck },
] as const;

export const fieldClass = "h-11 w-full rounded-control border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ScribeShell() {
  const { data: account, isLoading } = useScribeAccount();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#scribe-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
        <Link to="/app" className="flex items-center gap-2" aria-label="Rātana Scribe sessions">
          <svg className="size-7 text-primary" viewBox="0 0 40 40" aria-hidden="true" fill="none"><path d="M6 35V17.5C6 9.9 12.3 4 20 4s14 5.9 14 13.5V35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><circle cx="20" cy="21" r="3.6" fill="currentColor" /></svg>
          <span className="font-display text-xl font-semibold text-night">Rātana</span>
          <span className="text-sm text-muted-foreground">Scribe</span>
        </Link>
        {account?.org && (
          <div className="hidden border-l border-border pl-4 text-xs text-muted-foreground md:block">
            <span className="font-medium text-foreground">{account.org.name}</span> · {account.org.type === "solo" ? "Solo" : account.org.type === "practice" ? "Practice" : "Health service"} · {PLANS[(account.org.plan as PlanId) ?? "free"]?.name ?? account.org.plan} plan
          </div>
        )}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}><LogOut />Sign out</Button>
      </header>
      <div className="lg:flex">
        {account?.membership && (
          <aside className="border-b border-border bg-sidebar lg:min-h-[calc(100vh-3.5rem)] lg:w-60 lg:border-b-0 lg:border-r">
            <nav aria-label="Scribe navigation" className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:p-3">
              {nav.map((item) => {
                const active = item.to === "/app" ? path === "/app" || path.startsWith("/app/sessions") : path.startsWith(item.to);
                return (
                  <Link key={item.to} to={item.to} className={cn("flex h-11 shrink-0 items-center gap-2.5 rounded-control px-3 text-sm font-medium hover:bg-sidebar-accent", active && "bg-sidebar-accent text-primary")} aria-current={active ? "page" : undefined}>
                    <item.icon className="size-4" />{item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}
        <main id="scribe-main" className="min-w-0 flex-1">
          {isLoading ? <p className="p-8 text-sm text-muted-foreground">Loading account</p> : account && !account.membership ? <Onboarding /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

export function ScribeHead({ eyebrow, title, summary, actions }: { eyebrow: string; title: string; summary?: string | undefined; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-card px-5 py-5 sm:flex-row sm:items-end sm:justify-between lg:px-8">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase text-primary">{eyebrow}</div>
        <h1 className="font-display text-3xl font-semibold leading-tight">{title}</h1>
        {summary && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{summary}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function Onboarding() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ fullName: "", profession: "General practitioner", body: "Ahpra", number: "", country: "AU" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabase.rpc("create_solo_organisation", {
      _full_name: form.fullName, _profession: form.profession, _registration_body: form.body, _registration_number: form.number, _country: form.country,
    });
    setBusy(false);
    if (error) {
      setError(error.message.includes("clinicians_registration_unique") ? "This registration number is already linked to another account." : "Your account could not be set up. Check the details and try again.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["scribe-account"] });
  }

  return (
    <>
      <ScribeHead eyebrow="Set up · step 2 of 3" title="Your clinical details" summary="You start as a solo clinician on the Free plan. You can join or create a practice later with the same login." />
      <form onSubmit={submit} className="grid max-w-2xl gap-4 p-5 lg:p-8">
        <label className="text-sm font-medium">Full name as registered
          <input className={cn(fieldClass, "mt-1")} required maxLength={120} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </label>
        <label className="text-sm font-medium">Profession
          <select className={cn(fieldClass, "mt-1")} value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })}>
            {["General practitioner", "Specialist physician", "Registrar", "Nurse practitioner", "Registered nurse", "Physiotherapist", "Psychologist", "Other allied health"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <label className="text-sm font-medium">Registration body
            <select className={cn(fieldClass, "mt-1")} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value, country: e.target.value === "Ahpra" ? "AU" : "NZ" })}>
              <option value="Ahpra">Ahpra (AU)</option><option value="MCNZ">MCNZ (NZ)</option><option value="NCNZ">NCNZ (NZ)</option>
            </select>
          </label>
          <label className="text-sm font-medium">Registration number
            <input className={cn(fieldClass, "mt-1 font-mono uppercase")} required pattern="[A-Za-z0-9]{4,15}" title="4–15 letters or numbers" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Registration is checked by the Rātana team. You can record while verification is pending.</p>
        {error && <p role="alert" className="rounded-control border border-destructive px-3 py-2 text-sm text-destructive">{error}</p>}
        <div><Button type="submit" disabled={busy}>{busy ? "Setting up" : "Continue"}</Button></div>
      </form>
    </>
  );
}
