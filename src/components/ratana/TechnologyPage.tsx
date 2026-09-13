import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BellRing,
  Braces,
  CheckCircle2,
  ClipboardList,
  Database,
  Gauge,
  HeartPulse,
  KeyRound,
  Network,
  Radio,
  Scale,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const layers = [
  { icon: Radio, number: "01", title: "Connect", copy: "Bring together observations, symptoms, device status, pathway schedules, staff actions and hospital context.", items: ["Patient and caregiver app", "Connected and manual observations", "Hospital and staff workflow events"] },
  { icon: Activity, number: "02", title: "Understand", copy: "Turn raw events into a live patient state with trends, freshness, pathway context and visible reasons.", items: ["Patient state and baseline", "Trend and deterioration priority", "Missing-data and device-quality risk"] },
  { icon: ClipboardList, number: "03", title: "Coordinate", copy: "Route accountable work to clinical, operational, home-visiting, device and escalation teams.", items: ["Prioritised clinical queues", "Named owner and due time", "Escalation, handover and discharge"] },
  { icon: ShieldCheck, number: "04", title: "Govern", copy: "Make important access, state changes, decisions, overrides and handovers attributable and reviewable.", items: ["Role and care-context access", "Policy and pathway versions", "Complete action history"] },
];

const flow = [
  { label: "Observe", copy: "A reading, symptom, task or hospital event arrives." },
  { label: "Validate", copy: "Identity, time, source and signal quality are checked." },
  { label: "State", copy: "Acuity, freshness, device status and pathway progress update." },
  { label: "Prioritise", copy: "Rules produce a work priority with visible reasons." },
  { label: "Queue", copy: "The right team receives an owner, timer and next action." },
  { label: "Act", copy: "A clinician reviews, responds, escalates or hands over." },
  { label: "Audit", copy: "The decision, reasoning and outcome are recorded." },
];

const states = ["Stable", "Clinical review", "Rapid response", "No data", "Device concern", "Likely discharge", "Transfer in progress"];
const resources = ["Patient", "Encounter", "Observation", "CarePlan", "Task", "Device", "DocumentReference", "Provenance", "AuditEvent"];
const comparisons = [
  ["Data", "Generated patient and event data", "Governed patient data, consent, retention and local privacy compliance"],
  ["Devices", "Simulated feeds and interface events", "Validated fleet, provisioning, maintenance and clinical engineering controls"],
  ["Hospital record", "FHIR-shaped integration facade", "Signed-off interfaces, monitoring and governed writeback"],
  ["Prioritisation", "Configurable rules and prototype scoring", "Clinical validation, safety case and ongoing performance review"],
  ["Access", "Seeded roles and simulated onboarding", "Identity integration, least-privilege policy and formal access review"],
  ["Operations", "Cloud-backed demonstration release", "Resilience, security, support, monitoring and service commitments"],
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

function SectionHead({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="max-w-3xl"><p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p><h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-night">{title}</h2>{copy && <p className="mt-4 text-lg leading-7 text-muted-foreground">{copy}</p>}</div>;
}

export function TechnologyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand />
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden min-h-11 items-center gap-2 text-sm font-medium hover:text-primary sm:inline-flex"><ArrowLeft className="size-4" />Overview</Link>
            <Button asChild><Link to="/demo">Take it for a run<ArrowRight /></Link></Button>
          </div>
        </div>
      </header>

      <main id="content">
        <section className="border-b border-border bg-card py-14 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Technology platform</p>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.06] text-night lg:text-6xl">How the distributed hospital works.</h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">Rātana connects observations from patients, devices, apps, staff workflows and hospital systems; converts them into live patient state; and routes the right work to the right team with full auditability.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg"><Link to="/demo">Take it for a run<ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><Link to="/research">See the research</Link></Button></div>
              <p className="mt-6 font-mono text-xs uppercase leading-5 text-muted-foreground">Current release · 5,000 active monitored patients · 100% virtual-bed occupancy</p>
            </div>
            <div className="border border-border bg-background p-3 sm:p-5" aria-label="Rātana platform architecture">
              {layers.map((layer, index) => <div key={layer.title} className="grid min-h-20 grid-cols-[44px_1fr] items-center gap-3 border-b border-border px-2 py-4 last:border-b-0 sm:grid-cols-[44px_110px_1fr]"><div className="flex size-10 items-center justify-center border border-primary bg-harbour-soft text-primary"><layer.icon className="size-5" /></div><p className="font-display text-xl font-semibold text-night">{layer.title}</p><p className="col-span-2 text-sm leading-6 text-muted-foreground sm:col-span-1">{layer.copy}</p>{index < layers.length - 1 && <span className="sr-only">then</span>}</div>)}
            </div>
          </div>
        </section>

        <section className="border-b border-border py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHead eyebrow="Architecture" title="Four layers, one operating picture." copy="The platform does not simply collect remote-monitoring data. It turns events from the home and hospital into prioritised, explainable and accountable clinical work." />
            <div className="mt-10 grid border-l border-t border-border lg:grid-cols-4">
              {layers.map(({ icon: Icon, number, title, copy, items }) => <article key={title} className="border-b border-r border-border bg-card p-5"><div className="flex items-center justify-between"><Icon className="size-6 text-primary" /><span className="font-mono text-sm text-primary">{number}</span></div><h3 className="mt-8 font-display text-2xl font-semibold text-night">{title}</h3><p className="mt-3 min-h-24 text-sm leading-6 text-muted-foreground">{copy}</p><ul className="mt-5 space-y-3 border-t border-border pt-4">{items.map(item => <li key={item} className="flex gap-2 text-sm leading-5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article>)}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHead eyebrow="Signal to action" title="A home observation is only useful if it becomes work." copy="Abnormal physiology, missing observations and device failure are handled differently because they require different responses." />
            <ol className="mt-10 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-7">
              {flow.map((step, index) => <li key={step.label} className="relative border-b border-r border-border bg-background p-4 lg:min-h-52"><span className="font-mono text-xs text-primary">0{index + 1}</span><h3 className="mt-6 font-semibold">{step.label}</h3><p className="mt-3 text-sm leading-5 text-muted-foreground">{step.copy}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="border-b border-border py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8">
            <div><SectionHead eyebrow="Patient state" title="The journey, not an isolated reading." copy="Each active episode combines observations, trends, pathway expectations, symptoms, device reliability, care ownership, open work, escalation context and discharge readiness." /><div className="mt-8 flex flex-wrap gap-2">{states.map((state, index) => <span key={state} className={`border px-3 py-2 text-xs font-semibold ${index === 0 ? "border-stable bg-stable-soft text-stable" : index === 1 ? "border-review bg-review-soft text-review" : index === 2 ? "border-rapid bg-rapid-soft text-rapid" : index === 3 ? "signal-hatch border-nodata text-foreground" : "border-border bg-card"}`}>{state}</span>)}</div></div>
            <div className="border border-border bg-card p-6"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="font-mono text-xs text-muted-foreground">ACTIVE EPISODE</p><h3 className="mt-1 font-display text-2xl font-semibold">Patient state</h3></div><Gauge className="size-7 text-primary" /></div><dl className="mt-5 grid gap-px bg-border sm:grid-cols-2">{[["Pathway", "Respiratory"],["Latest state", "Clinical review"],["Data freshness", "4 minutes"],["Owner", "Respiratory team"],["Open work", "Review within 20 min"],["Device quality", "Signal verified"]].map(([term,value]) => <div key={term} className="bg-background p-4"><dt className="text-xs text-muted-foreground">{term}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl><div className="mt-5 border-l-2 border-machine bg-machine-soft p-4"><p className="text-xs font-semibold uppercase text-machine">Explainable priority</p><p className="mt-2 text-sm leading-6">Rising respiratory rate, falling oxygen saturation and increased breathlessness since the last review.</p></div></div>
          </div>
        </section>

        <section className="border-b border-border bg-night py-16 text-primary-foreground lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <p className="text-xs font-semibold uppercase text-primary-foreground/70">Clinical analytics</p><h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight">Explainable analytics, not autonomous medicine.</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-primary-foreground/75">Thresholds, trend changes, diagnosis-specific rules, missing-data risk and device quality create a transparent work priority. Clinicians remain responsible for decisions and escalation.</p>
            <div className="mt-10 grid gap-px bg-primary-foreground/20 sm:grid-cols-2 lg:grid-cols-4">{[[HeartPulse,"Show why a priority changed"],[Radio,"Separate clinical and signal-quality risk"],[Stethoscope,"Keep clinicians in control"],[ClipboardList,"Record overrides and reasoning"]].map(([Icon,label]) => { const ItemIcon = Icon as typeof Activity; return <div key={label as string} className="min-h-36 bg-night p-5"><ItemIcon className="size-5" /><p className="mt-8 text-sm font-semibold leading-6">{label as string}</p></div>; })}</div>
          </div>
        </section>

        <section className="border-b border-border py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8">
            <div><SectionHead eyebrow="Connected care" title="Tolerant of messy home data." copy="Home devices lose signal, batteries run low and observations are missed. Rātana treats signal quality and missing data as patient-safety conditions, never as reassurance." /><div className="mt-8 grid grid-cols-2 gap-px bg-border border border-border">{["Connected","Low battery","Poor signal","Stale data","Missing observation","Suspected faulty reading"].map(item => <div key={item} className="bg-card p-4 text-sm font-medium">{item}</div>)}</div></div>
            <div><SectionHead eyebrow="Interoperability" title="FHIR-shaped by design." copy="A mock integration facade lets hospital teams evaluate workflows and data contracts before production hospital-record integration begins." /><div className="mt-8 flex flex-wrap gap-2">{resources.map(item => <span key={item} className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2 font-mono text-xs"><Braces className="size-3 text-primary" />{item}</span>)}</div><p className="mt-6 text-sm leading-6 text-muted-foreground">Production patterns may include FHIR R4, SMART on FHIR, AU Core, US Core and local terminology mapping. Any writeback requires governance and integration sign-off.</p></div>
          </div>
        </section>

        <section className="border-b border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionHead eyebrow="Access and accountability" title="Designed around least privilege." copy="A distributed hospital needs carefully bounded access for patients, caregivers, clinical teams, operations, device support and emergency handover users." /><div className="mt-10 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-4">{[[KeyRound,"Access follows role and care context"],[Users,"Proxy access is explicit and approved"],[BellRing,"Emergency access is time-bound"],[Database,"Sensitive actions are attributable"]].map(([Icon,label]) => { const ItemIcon = Icon as typeof Activity; return <div key={label as string} className="border-b border-r border-border bg-background p-5"><ItemIcon className="size-6 text-primary" /><p className="mt-8 text-sm font-semibold leading-6">{label as string}</p></div>; })}</div></div>
        </section>

        <section className="border-b border-border py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionHead eyebrow="Current and future state" title="A working model today. Production assurance next." copy="The current platform validates the operating model at network scale. Clinical deployment would add formal validation, governed integrations and service assurance." /><div className="mt-10 overflow-x-auto border border-border"><table className="w-full min-w-[720px] border-collapse text-left text-sm"><thead><tr className="border-b border-border bg-card"><th className="px-4 py-3 font-semibold">Area</th><th className="px-4 py-3 font-semibold">Current release</th><th className="px-4 py-3 font-semibold">Production requirement</th></tr></thead><tbody>{comparisons.map(([area,current,production]) => <tr key={area} className="border-b border-border last:border-0"><th className="px-4 py-4 align-top font-semibold">{area}</th><td className="px-4 py-4 align-top text-muted-foreground">{current}</td><td className="px-4 py-4 align-top text-muted-foreground">{production}</td></tr>)}</tbody></table></div></div>
        </section>

        <section className="bg-harbour-soft py-16 lg:py-20"><div className="mx-auto max-w-4xl px-5 text-center lg:px-8"><Scale className="mx-auto size-8 text-primary" /><h2 className="mt-5 font-display text-4xl font-semibold leading-tight text-night">See the platform operating at network scale.</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Follow a patient signal from home observation through prioritisation, clinical review, escalation, handover and governance.</p><Button asChild size="lg" className="mt-7 w-full sm:w-auto"><Link to="/demo">Take it for a run<ArrowRight /></Link></Button></div></section>
      </main>

      <footer className="border-t border-border bg-card"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><Brand /><p className="font-mono text-xs uppercase">Sydney · Dresden · Pune</p></div></footer>
    </div>
  );
}