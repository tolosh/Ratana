import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Ambulance,
  ArrowRight,
  ClipboardCheck,
  Database,
  FileCheck2,
  Menu,
  Network,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import dashboardImage from "@/assets/network-command.png";

const platformFeatures = [
  { icon: Network, title: "Network command", copy: "See active patients, service pressure, admissions, discharges and transfers across the whole network." },
  { icon: ClipboardCheck, title: "Clinical queue and alert review", copy: "Turn observations into prioritised, owned work with clear reasons, due times and outcomes." },
  { icon: Activity, title: "Patient state and scoring", copy: "Bring trends, symptoms, data quality and pathway rules together without hiding the source evidence." },
  { icon: Smartphone, title: "Patient and caregiver app", copy: "Guide home observations, daily tasks and help requests in calm, plain language." },
  { icon: Users, title: "Onboarding and access", copy: "Assign people to the right organisation, region, team, service zone and patient relationship." },
  { icon: Ambulance, title: "Emergency handover", copy: "Coordinate time-limited access and a structured, auditable transfer when hospital care is needed." },
  { icon: Database, title: "FHIR-shaped integration", copy: "Prepare observations, episodes and care context for connection with provider systems." },
  { icon: ShieldCheck, title: "Governance and auditability", copy: "Keep clinical decisions human-led with explainable alerts and a traceable record of every action." },
];

const steps = [
  { number: "01", title: "Admit", copy: "Enrol the patient into a pathway and confirm that home is a suitable care setting.", example: "Pathway · team · device kit" },
  { number: "02", title: "Monitor", copy: "Receive observations, symptoms, device status and scheduled check-ins from home.", example: "SpO₂ · symptoms · no data" },
  { number: "03", title: "Score", copy: "Convert raw events into a transparent patient state, trend and explainable alert drivers.", example: "Clinical state · trend · reason" },
  { number: "04", title: "Prioritise", copy: "Order clinical work by concern, time, freshness and the action that is required.", example: "Owner · due time · queue" },
  { number: "05", title: "Escalate or discharge", copy: "Coordinate transfer or confirm readiness to leave the pathway with clinician oversight.", example: "Handover · disposition · audit" },
];

const trustPoints = [
  "Human-in-the-loop review",
  "Explainable alerts",
  "Complete audit trail",
  "Role-based access",
  "Patient and caregiver onboarding",
  "Time-limited emergency access",
  "FHIR-shaped resources",
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Rātana home">
      <svg className="size-8 shrink-0 text-primary" viewBox="0 0 40 40" aria-hidden="true" fill="none">
        <path d="M6 35V17.5C6 9.9 12.3 4 20 4s14 5.9 14 13.5V35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M13 35V19.5a7 7 0 0 1 14 0V35" stroke="currentColor" strokeWidth="1.4" opacity=".45" strokeLinecap="round" />
        <circle cx="20" cy="21" r="3.6" fill="currentColor" />
        <path d="M20 4V1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="font-display text-2xl font-semibold text-night">Rātana</span>
    </Link>
  );
}

function DemoButton({ className = "" }: { className?: string }) {
  return (
    <Button asChild size="lg" className={className}>
      <Link to="/demo">Take it for a run<ArrowRight /></Link>
    </Button>
  );
}

export function RatanaHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5 lg:px-8">
          <Brand />
          <nav aria-label="Primary navigation" className="ml-auto hidden items-center gap-7 lg:flex">
            <a href="#problem" className="text-sm font-medium hover:text-primary">Problem</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary">How it works</a>
            <a href="#platform" className="text-sm font-medium hover:text-primary">Platform</a>
            <a href="#demo" className="text-sm font-medium hover:text-primary">Demo</a>
            <a href="#contact" className="text-sm font-medium hover:text-primary">Contact</a>
            <DemoButton />
          </nav>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <nav aria-label="Mobile navigation" className="border-t border-border bg-background px-5 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {[['Problem', '#problem'], ['How it works', '#how-it-works'], ['Platform', '#platform'], ['Demo', '#demo'], ['Contact', '#contact']].map(([label, href]) => (
                <a key={href} href={href} onClick={closeMenu} className="flex min-h-11 items-center border-b border-border text-sm font-medium">{label}</a>
              ))}
              <DemoButton className="mt-3 w-full" />
            </div>
          </nav>
        )}
      </header>

      <main id="content">
        <section className="overflow-hidden border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-5 pb-0 pt-12 text-center sm:pt-16 lg:px-8 lg:pt-20">
            <h1 className="mx-auto max-w-5xl font-display text-4xl font-semibold leading-[1.08] text-night sm:text-5xl lg:text-6xl">
              Move more hospital care home, without losing command of the patient journey.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Rātana helps health providers reduce bed waits by managing Hospital in the Home patients as one live, clinically governed network. Monitor active patients at home, prioritise deterioration risk, coordinate teams, and escalate with full auditability.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DemoButton className="w-full sm:w-auto" />
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto"><a href="#how-it-works">See how it works</a></Button>
            </div>
            
            <div className="relative mx-auto mt-10 max-w-6xl border-x border-t border-border bg-muted p-2 sm:p-3">
              <div className="flex h-8 items-center gap-2 border-b border-border bg-card px-3" aria-hidden="true"><span className="size-2 rounded-full bg-rapid" /><span className="size-2 rounded-full bg-review" /><span className="size-2 rounded-full bg-stable" /><span className="ml-2 font-mono text-[10px] text-muted-foreground">NETWORK COMMAND</span></div>
              <img src={dashboardImage} alt="Rātana Network Command showing 5,000 active monitored patients and 100% virtual-bed occupancy" className="block h-auto w-full border border-border" />
            </div>
          </div>
        </section>

        <section id="problem" className="scroll-mt-20 border-b border-border py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:px-8">
            <div><p className="text-xs font-semibold uppercase text-primary">The operating problem</p><h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-night">Bed pressure is a care coordination problem.</h2></div>
            <div>
              <p className="text-xl leading-8">Hospitals are full, but many patients no longer need to be inside the building to receive hospital-level care. The challenge is operational: knowing who is stable, who is deteriorating, who has gone silent, who needs review, and who needs to come back in.</p>
              <p className="mt-5 text-base leading-7 text-muted-foreground">Hospital in the Home programs can free physical beds, but scaling them means coordinating thousands of patients, many diagnoses, devices, teams and moments where no data can be as important as abnormal data.</p>
              <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
                {["Patients wait because hospital capacity is constrained.", "Clinicians cannot safely scale home care from disconnected dashboards.", "Device data is useful only when it becomes accountable clinical work."].map((item, index) => <div key={item} className="bg-card p-5"><span className="font-mono text-sm text-primary">0{index + 1}</span><p className="mt-4 text-sm font-semibold leading-6">{item}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-20 border-b border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <p className="text-xs font-semibold uppercase text-primary">The platform</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight text-night">One command layer for the hospital-at-home network.</h2>
            <p className="mt-4 max-w-3xl text-lg leading-7 text-muted-foreground">Rātana connects command, clinical and patient workflows so the network can operate as one accountable service rather than a collection of monitoring tools.</p>
            <div className="mt-10 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-4">
              {platformFeatures.map(({ icon: Icon, title, copy }) => <article key={title} className="min-h-56 border-b border-r border-border p-5"><Icon className="size-6 text-primary" /><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p></article>)}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-b border-border py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <p className="text-xs font-semibold uppercase text-primary">One connected workflow</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-night">From admission to a safe next step.</h2>
            <div className="mt-10 grid border-l border-t border-border lg:grid-cols-5">
              {steps.map((step) => <article key={step.number} className="relative border-b border-r border-border bg-card p-5 lg:min-h-72"><div className="font-mono text-2xl text-primary">{step.number}</div><h3 className="mt-8 font-display text-2xl font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{step.copy}</p><p className="mt-6 border-t border-border pt-3 font-mono text-[11px] uppercase text-primary">{step.example}</p></article>)}
            </div>
          </div>
        </section>

        <section id="demo" className="scroll-mt-20 border-b border-border bg-night py-16 text-primary-foreground lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-[1fr_auto] lg:px-8">
            <div><p className="text-xs font-semibold uppercase text-primary-foreground/70">Interactive release</p><h2 className="mt-3 font-display text-4xl font-semibold">Take Rātana for a run.</h2><p className="mt-5 max-w-3xl text-base leading-7 text-primary-foreground/75">Explore 5,000 active monitored patients, desktop command workflows, mobile patient journeys, user onboarding, clinical queues, alert review, and emergency handover.</p><p className="mt-5 font-mono text-xs uppercase text-primary-foreground">Demonstration platform · Not for clinical use.</p></div>
            <DemoButton className="w-full bg-background text-foreground hover:bg-muted lg:w-auto" />
          </div>
        </section>

        <section className="border-b border-border py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2 lg:px-8">
            <div><p className="text-xs font-semibold uppercase text-primary">Trust and governance</p><h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-night">Designed for accountable clinical operations.</h2><p className="mt-5 text-base leading-7 text-muted-foreground">Machine-generated signals support judgement; they do not diagnose, prescribe, close clinical work or replace a clinician’s decision.</p></div>
            <div><div className="grid gap-px border border-border bg-border sm:grid-cols-2">{trustPoints.map((point) => <div key={point} className="flex min-h-14 items-center gap-3 bg-card px-4 text-sm font-medium"><FileCheck2 className="size-4 shrink-0 text-primary" />{point}</div>)}</div><p className="mt-5 text-xs leading-5 text-muted-foreground">The current release is for demonstration and workflow validation. Production use would require clinical governance, pathway validation, regulatory assessment, privacy review, cybersecurity assurance, and integration sign-off.</p></div>
          </div>
        </section>

        <section className="bg-harbour-soft py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-5 text-center lg:px-8"><UserRoundCheck className="mx-auto size-8 text-primary" /><h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-night">See what Hospital in the Home looks like at network scale.</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Launch Rātana and explore the national command view, clinical queue, patient app, onboarding, and escalation workflows.</p><DemoButton className="mt-7 w-full sm:w-auto" /></div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><Brand /><p>Rātana demonstration platform · Not for clinical use</p></div>
      </footer>
    </div>
  );
}