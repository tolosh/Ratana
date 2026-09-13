import { useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Search, Trash2, UserPlus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignalBadge } from "./SignalBadge";
import { cn } from "@/lib/utils";
import { statusMeta } from "@/lib/lantern-data";
import {
  currentEpisode, labels, patientName, statusSignal,
  type CareEpisode, type CareTeamMember, type ClinicalNote, type ClinicalStatus,
  type CommunicationEvent, type CrmDocument, type CrmRecord, type CrmTask,
  type PatientContact, type RiskLevel, type Trajectory,
} from "@/lib/crm-data";
import { newId, stamp, useCrm, type ListKey } from "@/lib/crm-store";

type Tab = "overview" | "clinical" | "monitoring" | "timeline" | "careplan" | "notes" | "tasks" | "contacts" | "team" | "communications" | "documents" | "audit";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "clinical", label: "Clinical" },
  { id: "monitoring", label: "Monitoring" },
  { id: "timeline", label: "Timeline" },
  { id: "careplan", label: "Care plan" },
  { id: "notes", label: "Notes" },
  { id: "tasks", label: "Tasks" },
  { id: "contacts", label: "Contacts" },
  { id: "team", label: "Care team" },
  { id: "communications", label: "Communications" },
  { id: "documents", label: "Documents" },
  { id: "audit", label: "Audit" },
];

/* ---------- small building blocks ---------- */

function Card({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-border py-2 text-sm first:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="max-w-xl text-left font-medium sm:text-right">{v || "—"}</span>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nothing recorded.</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 bg-primary" />{item}</li>
      ))}
    </ul>
  );
}

function Pill({ label, tone }: { label: string; tone?: "risk" | "muted" | undefined }) {
  return <span className={cn("border px-2 py-1 text-[11px] font-semibold uppercase", tone === "risk" ? "border-rapid text-rapid" : "border-border text-muted-foreground")}>{label}</span>;
}

/* ---------- generic field driven forms ---------- */

type FieldType = "text" | "textarea" | "list" | "check" | "select" | "number";
interface FieldDef { key: string; label: string; type: FieldType; options?: Array<[string, string]>; required?: boolean; help?: string }
type Draft = Record<string, string | boolean>;

function toDraft(defs: FieldDef[], source: Record<string, unknown>): Draft {
  const draft: Draft = {};
  for (const def of defs) {
    const value = source[def.key];
    if (def.type === "check") draft[def.key] = Boolean(value);
    else if (def.type === "list") draft[def.key] = Array.isArray(value) ? (value as string[]).join("\n") : "";
    else draft[def.key] = value === undefined || value === null ? "" : String(value);
  }
  return draft;
}

function fromDraft(defs: FieldDef[], draft: Draft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    const value = draft[def.key];
    if (def.type === "check") out[def.key] = Boolean(value);
    else if (def.type === "list") out[def.key] = String(value ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
    else if (def.type === "number") out[def.key] = Number(value) || 0;
    else out[def.key] = String(value ?? "").trim();
  }
  return out;
}

function missingRequired(defs: FieldDef[], draft: Draft): string[] {
  return defs.filter((d) => d.required && String(draft[d.key] ?? "").trim() === "").map((d) => d.label);
}

function Fields({ defs, draft, onChange }: { defs: FieldDef[]; draft: Draft; onChange: (key: string, value: string | boolean) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {defs.map((def) => {
        const id = `field-${def.key}`;
        const wide = def.type === "textarea" || def.type === "list";
        return (
          <div key={def.key} className={cn(wide && "md:col-span-2")}>
            <label htmlFor={id} className="block text-[11px] font-semibold uppercase text-muted-foreground">
              {def.label}{def.required && <span className="ml-1 text-rapid">required</span>}
            </label>
            {def.type === "check" ? (
              <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
                <input id={id} type="checkbox" className="size-4 accent-primary" checked={Boolean(draft[def.key])} onChange={(e) => onChange(def.key, e.target.checked)} />
                Yes
              </label>
            ) : def.type === "select" ? (
              <select id={id} value={String(draft[def.key] ?? "")} onChange={(e) => onChange(def.key, e.target.value)} className="mt-1.5 h-11 w-full rounded-control border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {(def.options ?? []).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            ) : wide ? (
              <textarea id={id} value={String(draft[def.key] ?? "")} onChange={(e) => onChange(def.key, e.target.value)} className="mt-1.5 min-h-24 w-full rounded-control border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            ) : (
              <input id={id} value={String(draft[def.key] ?? "")} onChange={(e) => onChange(def.key, e.target.value)} className="mt-1.5 h-11 w-full rounded-control border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            )}
            {def.help && <p className="mt-1 text-[11px] text-muted-foreground">{def.help}</p>}
          </div>
        );
      })}
    </div>
  );
}

function EditableSection({
  title, description, defs, source, onSave, children,
}: {
  title: string; description?: string; defs: FieldDef[]; source: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => void; children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(defs, source));
  const [errors, setErrors] = useState<string[]>([]);

  const start = () => { setDraft(toDraft(defs, source)); setErrors([]); setEditing(true); };
  const save = () => {
    const missing = missingRequired(defs, draft);
    if (missing.length > 0) { setErrors(missing); return; }
    onSave(fromDraft(defs, draft));
    setEditing(false);
  };

  return (
    <Card
      title={title}
      {...(description ? { description } : {})}
      action={editing
        ? <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button size="sm" onClick={save}>Save section</Button></div>
        : <Button size="sm" variant="outline" onClick={start}><Pencil />Edit section</Button>}
    >
      {editing ? (
        <div className="space-y-4">
          {errors.length > 0 && <div role="alert" className="border border-rapid bg-rapid-soft p-3 text-sm text-rapid">Complete the required fields: {errors.join(", ")}.</div>}
          <Fields defs={defs} draft={draft} onChange={(key, value) => setDraft((d) => ({ ...d, [key]: value }))} />
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">Saving records who changed the section and when in the audit trail.</p>
        </div>
      ) : children}
    </Card>
  );
}

/* ---------- list entity editor ---------- */

function ItemEditor({ defs, initial, onCancel, onSubmit, submitLabel }: { defs: FieldDef[]; initial?: Record<string, unknown>; onCancel: () => void; onSubmit: (values: Record<string, unknown>) => void; submitLabel: string }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(defs, initial ?? {}));
  const [errors, setErrors] = useState<string[]>([]);
  return (
    <div className="mb-4 border border-primary bg-accent/40 p-4">
      {errors.length > 0 && <div role="alert" className="mb-3 border border-rapid bg-rapid-soft p-3 text-sm text-rapid">Complete the required fields: {errors.join(", ")}.</div>}
      <Fields defs={defs} draft={draft} onChange={(key, value) => setDraft((d) => ({ ...d, [key]: value }))} />
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => {
          const missing = missingRequired(defs, draft);
          if (missing.length > 0) { setErrors(missing); return; }
          onSubmit(fromDraft(defs, draft));
        }}>{submitLabel}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

const enumOptions = (map: Record<string, string>): Array<[string, string]> => Object.entries(map);

const contactDefs: FieldDef[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "relationship", label: "Relationship", type: "text", required: true },
  { key: "phone", label: "Phone", type: "text", required: true },
  { key: "email", label: "Email", type: "text" },
  { key: "isNextOfKin", label: "Next of kin", type: "check" },
  { key: "isEmergencyContact", label: "Emergency contact", type: "check" },
  { key: "isCaregiverProxy", label: "Caregiver proxy access", type: "check" },
  { key: "contactInstructions", label: "Contact instructions", type: "textarea" },
];

const teamDefs: FieldDef[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "role", label: "Role", type: "select", options: enumOptions(labels.careTeamRole) },
  { key: "organisation", label: "Organisation", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "primary", label: "Primary responsible clinician", type: "check" },
];

const noteDefs: FieldDef[] = [
  { key: "type", label: "Note type", type: "select", options: enumOptions(labels.noteType) },
  { key: "author", label: "Author", type: "text", required: true },
  { key: "authorRole", label: "Author role", type: "text", required: true },
  { key: "body", label: "Note", type: "textarea", required: true, help: "Notes are append-only in this prototype and cannot be edited or deleted." },
];

const taskDefs: FieldDef[] = [
  { key: "title", label: "Task", type: "text", required: true },
  { key: "type", label: "Type", type: "select", options: enumOptions(labels.taskType) },
  { key: "status", label: "Status", type: "select", options: [["OPEN", "Open"], ["IN_PROGRESS", "In progress"], ["DONE", "Done"], ["CANCELLED", "Cancelled"]] },
  { key: "priority", label: "Priority", type: "select", options: [["LOW", "Low"], ["MEDIUM", "Medium"], ["HIGH", "High"], ["URGENT", "Urgent"]] },
  { key: "owner", label: "Owner", type: "text", required: true },
  { key: "dueAt", label: "Due", type: "text", required: true },
];

const commDefs: FieldDef[] = [
  { key: "direction", label: "Direction", type: "select", options: [["OUTBOUND", "Outbound"], ["INBOUND", "Inbound"]] },
  { key: "channel", label: "Channel", type: "select", options: [["PHONE", "Phone"], ["SMS", "SMS"], ["EMAIL", "Email"], ["APP", "App"], ["VIDEO", "Video"], ["IN_PERSON", "In person"], ["OTHER", "Other"]] },
  { key: "participants", label: "Participants", type: "text", required: true },
  { key: "summary", label: "Summary", type: "textarea", required: true },
  { key: "outcome", label: "Outcome", type: "text" },
  { key: "createdBy", label: "Recorded by", type: "text", required: true },
];

const documentDefs: FieldDef[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "type", label: "Type", type: "select", options: enumOptions(labels.documentType) },
  { key: "addedBy", label: "Added by", type: "text", required: true },
  { key: "note", label: "Note", type: "text", help: "Documents in this prototype are placeholders; no file is stored." },
];

const episodeDefs: FieldDef[] = [
  { key: "primaryDiagnosis", label: "Primary diagnosis", type: "text", required: true },
  { key: "status", label: "Episode status", type: "select", options: enumOptions(labels.episodeStatus) },
  { key: "acuity", label: "Acuity", type: "select", options: enumOptions(labels.acuity) },
  { key: "pathway", label: "Pathway", type: "text", required: true },
  { key: "admissionDate", label: "Admission date", type: "text", required: true },
  { key: "expectedDischargeDate", label: "Expected discharge", type: "text" },
  { key: "actualDischargeDate", label: "Actual discharge", type: "text" },
  { key: "dayOf", label: "Day of episode", type: "number" },
  { key: "plannedDays", label: "Planned days", type: "number" },
  { key: "referralSource", label: "Referral source", type: "text" },
  { key: "referringClinician", label: "Referring clinician", type: "text" },
  { key: "referringOrganisation", label: "Referring organisation", type: "text" },
  { key: "secondaryDiagnoses", label: "Secondary diagnoses (one per line)", type: "list" },
  { key: "admissionReason", label: "Admission reason", type: "textarea", required: true },
  { key: "homeCareRationale", label: "Home care rationale", type: "textarea" },
];

/* ---------- patient list ---------- */

const ALL = "all";

export function PatientCrm({ notify }: { notify: (message: string) => void }) {
  const { records, resetData } = useCrm();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId ? records.find((r) => r.id === selectedId) : undefined;
  if (selected) return <PatientRecord record={selected} onBack={() => setSelectedId(null)} notify={notify} />;
  return <PatientList records={records} onOpen={setSelectedId} notify={notify} onReset={resetData} />;
}

function PatientList({ records, onOpen, notify, onReset }: { records: CrmRecord[]; onOpen: (id: string) => void; notify: (m: string) => void; onReset: () => void }) {
  const { addRecord } = useCrm();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(ALL);
  const [team, setTeam] = useState(ALL);
  const [diagnosis, setDiagnosis] = useState(ALL);
  const [episodeStatus, setEpisodeStatus] = useState(ALL);
  const [clinicalStatus, setClinicalStatus] = useState(ALL);
  const [trajectory, setTrajectory] = useState(ALL);
  const [risk, setRisk] = useState(ALL);
  const [flag, setFlag] = useState(ALL);
  const [creating, setCreating] = useState(false);

  const regionOptions = useMemo(() => [...new Set(records.map((r) => r.region))].sort(), [records]);
  const teamOptions = useMemo(() => [...new Set(records.map((r) => r.team))].sort(), [records]);
  const diagnosisOptions = useMemo(() => [...new Set(records.map((r) => currentEpisode(r)?.primaryDiagnosis ?? ""))].filter(Boolean).sort(), [records]);

  const filtered = records.filter((r) => {
    const episode = currentEpisode(r);
    const haystack = `${patientName(r)} ${r.firstName} ${r.lastName} ${r.mrn} ${r.id} ${episode?.primaryDiagnosis ?? ""}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (region !== ALL && r.region !== region) return false;
    if (team !== ALL && r.team !== team) return false;
    if (diagnosis !== ALL && episode?.primaryDiagnosis !== diagnosis) return false;
    if (episodeStatus !== ALL && episode?.status !== episodeStatus) return false;
    if (clinicalStatus !== ALL && r.state.clinicalStatus !== clinicalStatus) return false;
    if (trajectory !== ALL && r.state.trajectory !== trajectory) return false;
    if (risk !== ALL && r.state.riskLevel !== risk) return false;
    if (flag === "nodata" && !r.state.noData) return false;
    if (flag === "device" && !r.state.deviceConcern) return false;
    if (flag === "discharge" && !r.state.dischargeLikely) return false;
    return true;
  });

  const createDefs: FieldDef[] = [
    { key: "firstName", label: "First name", type: "text", required: true },
    { key: "lastName", label: "Last name", type: "text", required: true },
    { key: "dateOfBirth", label: "Date of birth (YYYY-MM-DD)", type: "text", required: true },
    { key: "phone", label: "Phone", type: "text", required: true },
    { key: "region", label: "Region", type: "text", required: true },
    { key: "team", label: "Team", type: "text", required: true },
    { key: "owner", label: "Responsible clinician", type: "text", required: true },
    { key: "primaryDiagnosis", label: "Primary diagnosis", type: "text", required: true },
    { key: "pathway", label: "Pathway", type: "text", required: true },
    { key: "presentingCondition", label: "Presenting condition", type: "textarea", required: true },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-border bg-card px-5 py-5 sm:flex-row sm:items-end sm:justify-between lg:px-8">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase text-primary">Clinical CRM</div>
          <h1 className="font-display text-3xl font-semibold leading-tight">Patient records</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{filtered.length} of {records.length} records. Search, filter and open a record to view or change clinical detail.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => { onReset(); notify("Records restored to their starting state"); }}><RotateCcw />Restore records</Button>
          <Button onClick={() => setCreating((c) => !c)}><UserPlus />New record</Button>
        </div>
      </div>

      <div className="space-y-4 p-5 lg:p-8">
        {creating && (
          <Card title="Create a patient record" description="A new record opens a first care episode and writes an audit entry.">
            <ItemEditor
              defs={createDefs}
              submitLabel="Create record"
              onCancel={() => setCreating(false)}
              onSubmit={(values) => {
                const record = blankRecord(values as Record<string, string>);
                addRecord(record);
                setCreating(false);
                notify(`${patientName(record)} added to the patient list`);
                onOpen(record.id);
              }}
            />
          </Card>
        )}

        <div className="border border-border bg-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label htmlFor="crm-search" className="block text-[11px] font-semibold uppercase text-muted-foreground">Search</label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
                <input id="crm-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, patient ID or diagnosis" className="h-11 w-full rounded-control border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <Filter label="Region" value={region} onChange={setRegion} options={regionOptions.map((o) => [o, o])} />
            <Filter label="Team" value={team} onChange={setTeam} options={teamOptions.map((o) => [o, o])} />
            <Filter label="Diagnosis" value={diagnosis} onChange={setDiagnosis} options={diagnosisOptions.map((o) => [o, o])} />
            <Filter label="Episode" value={episodeStatus} onChange={setEpisodeStatus} options={enumOptions(labels.episodeStatus)} />
            <Filter label="Clinical status" value={clinicalStatus} onChange={setClinicalStatus} options={enumOptions(labels.clinicalStatus)} />
            <Filter label="Trajectory" value={trajectory} onChange={setTrajectory} options={enumOptions(labels.trajectory)} />
            <Filter label="Risk" value={risk} onChange={setRisk} options={enumOptions(labels.riskLevel)} />
            <Filter label="Flag" value={flag} onChange={setFlag} options={[["nodata", "No data"], ["device", "Device concern"], ["discharge", "Discharge likely"]]} />
          </div>
        </div>

        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-muted text-[11px] uppercase text-muted-foreground">
              <tr><th className="px-4 py-3">Patient</th><th>Clinical status</th><th>Trajectory</th><th>Risk</th><th>Episode</th><th>Region · team</th><th>Responsible</th><th>Last observation</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const episode = currentEpisode(r);
                return (
                  <tr key={r.id} className={cn("h-14 border-t border-border border-l-2 hover:bg-accent", statusMeta[statusSignal(r.state.clinicalStatus)].classes)}>
                    <td className="px-4">
                      <button className="text-left font-semibold hover:underline" onClick={() => onOpen(r.id)}>{patientName(r)}</button>
                      <div className="font-mono text-[11px] text-muted-foreground">{r.mrn} · {r.age} yrs · {episode?.primaryDiagnosis}</div>
                    </td>
                    <td><SignalBadge signal={statusSignal(r.state.clinicalStatus)} compact /><div className="mt-1 text-[11px] text-muted-foreground">{labels.clinicalStatus[r.state.clinicalStatus]}</div></td>
                    <td className="text-xs">{labels.trajectory[r.state.trajectory]}</td>
                    <td className="text-xs">{labels.riskLevel[r.state.riskLevel]}</td>
                    <td className="text-xs">{episode ? `${labels.episodeStatus[episode.status]} · day ${episode.dayOf} of ${episode.plannedDays}` : "—"}</td>
                    <td className="text-xs text-muted-foreground">{r.region}<div>{r.team}</div></td>
                    <td className="text-xs">{r.owner}</td>
                    <td className="font-mono text-xs">{r.state.lastObservationAt}
                      <div className="flex gap-1 pt-1">
                        {r.state.noData && <Pill label="No data" tone="risk" />}
                        {r.state.deviceConcern && <Pill label="Device" />}
                        {r.state.dischargeLikely && <Pill label="Discharge" />}
                      </div>
                    </td>
                    <td><Button variant="ghost" size="icon" onClick={() => onOpen(r.id)} aria-label={`Open ${patientName(r)}`}><ChevronRight /></Button></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">No records match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  const id = `filter-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase text-muted-foreground">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-11 rounded-control border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
        <option value={ALL}>All</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function blankRecord(values: Record<string, string>): CrmRecord {
  const id = newId("pat");
  const birthYear = Number(values["dateOfBirth"]?.slice(0, 4)) || 1960;
  const episodeId = newId("epi");
  return {
    id, mrn: `MRN-${Math.floor(1000000 + Math.random() * 8999999)}`,
    firstName: values["firstName"] ?? "", lastName: values["lastName"] ?? "",
    dateOfBirth: values["dateOfBirth"] ?? "", age: 2026 - birthYear,
    sex: "Not recorded", gender: "Not recorded", pronouns: "Not recorded",
    phone: values["phone"] ?? "", preferredContactMethod: "PHONE",
    preferredLanguage: "English", interpreterRequired: false,
    address: { line1: "", suburbCity: values["region"] ?? "", country: "Australia" },
    region: values["region"] ?? "", team: values["team"] ?? "", owner: values["owner"] ?? "",
    presentingCondition: values["presentingCondition"] ?? "", clinicalSummary: "",
    medicalHistory: [], chronicConditions: [], allergies: [], medications: [],
    functionalStatus: "", socialContext: "", prognosis: "", expectedOutcome: "", currentTreatment: "",
    homeAccessNotes: "", communicationInstructions: "",
    episodes: [{
      id: episodeId, admissionDate: stamp(), primaryDiagnosis: values["primaryDiagnosis"] ?? "",
      secondaryDiagnoses: [], admissionReason: values["presentingCondition"] ?? "",
      acuity: "MODERATE", status: "PROPOSED", pathway: values["pathway"] ?? "", dayOf: 1, plannedDays: 7,
    }],
    state: {
      clinicalStatus: "STABLE", trajectory: "UNKNOWN", riskLevel: "MEDIUM", outcomeStatus: "ON_TRACK",
      activeAlertCount: 0, lastObservationAt: "No observation yet", lastClinicalReviewAt: "Not yet reviewed",
      nextAction: "Complete admission assessment", nextActionAt: stamp(),
      deviceConcern: false, noData: true, dischargeLikely: false,
    },
    contacts: [], careTeam: [{ id: newId("ct"), name: values["owner"] ?? "", role: "CONSULTANT", primary: true }],
    carePlan: { goals: [], medicationPlan: [], monitoringRequirements: [], plannedHomeVisits: [], plannedVirtualReviews: [], investigations: [], alliedHealth: [], escalationCriteria: [], emergencyInstructions: "", dischargeCriteria: [] },
    monitoring: { parameters: [], frequency: "", devices: [], thresholds: [], missingDataRule: "Missing observations raise an explicit No data safety state.", deviceQualityNote: "" },
    observations: [], notes: [], tasks: [], communications: [], documents: [],
    timeline: [{ id: newId("tl"), type: "NOTE", at: stamp(), title: "Record created", author: values["owner"] ?? "" }],
    audit: [{ id: newId("aud"), at: stamp(), userName: values["owner"] ?? "", action: "CREATE", entityType: "Patient record", entityId: id, summary: "Patient record created" }],
    createdAt: stamp(), updatedAt: stamp(),
  };
}

/* ---------- patient record ---------- */

function PatientRecord({ record, onBack, notify }: { record: CrmRecord; onBack: () => void; notify: (m: string) => void }) {
  const { patchRecord, addItem, updateItem, removeItem, removeRecord } = useCrm();
  const [tab, setTab] = useState<Tab>("overview");
  const episode = currentEpisode(record);
  const signal = statusSignal(record.state.clinicalStatus);

  const quickNote = (type: ClinicalNote["type"], body: string) => {
    const note: ClinicalNote = {
      id: newId("note"), episodeId: episode?.id ?? "", type, body,
      author: record.owner, authorRole: "Clinician", createdAt: stamp(),
    };
    addItem(record.id, "notes", note, `${labels.noteType[type]} note added`, { type: "NOTE", title: `${labels.noteType[type]} note added` });
  };

  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 lg:px-8">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={onBack}><ChevronLeft />Patient records</Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold leading-tight">{patientName(record)}</h1>
              <SignalBadge signal={signal} />
              <Pill label={`Trajectory ${labels.trajectory[record.state.trajectory].toLowerCase()}`} />
              <Pill label={`Risk ${labels.riskLevel[record.state.riskLevel].toLowerCase()}`} tone={record.state.riskLevel === "HIGH" || record.state.riskLevel === "CRITICAL" ? "risk" : undefined} />
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {record.mrn} · {record.dateOfBirth} · {record.age} yrs · {record.pronouns} · {record.region} · {record.team}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {episode ? `${episode.primaryDiagnosis} · ${labels.episodeStatus[episode.status]} · day ${episode.dayOf} of ${episode.plannedDays}` : "No episode recorded"} · Responsible clinician {record.owner}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { setTab("notes"); notify("Add a note in the Notes tab"); }}><Plus />Add note</Button>
            <Button size="sm" variant="outline" onClick={() => setTab("tasks")}><Plus />Create task</Button>
            <Button size="sm" variant="outline" onClick={() => { quickNote("PHONE_CONTACT", `Contact attempted with ${patientName(record)}.`); notify("Contact attempt recorded in notes"); }}>Contact patient</Button>
            <Button size="sm" variant="destructive" onClick={() => { quickNote("ESCALATION", `Escalation raised for review by ${record.owner}. Clinical decision and disposition still required.`); patchRecord(record.id, { state: { ...record.state, clinicalStatus: "DETERIORATING", outcomeStatus: "CONCERN" } }, "Escalation raised from the patient record", "clinicalStatus"); notify("Escalation raised; clinical disposition still required"); }}>Escalate</Button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-border px-3 lg:px-6" role="tablist" aria-label="Patient record sections">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={cn("h-11 shrink-0 border-b-2 px-3 text-sm", tab === t.id ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-5 lg:p-8">
        {tab === "overview" && <OverviewTab record={record} onSave={patchRecord} onSaveEpisode={(values) => episode && updateItem(record.id, "episodes", episode.id, values, "Care episode updated")} onDelete={() => { removeRecord(record.id); notify(`${patientName(record)} removed from the patient list`); onBack(); }} />}
        {tab === "clinical" && <ClinicalTab record={record} onSave={patchRecord} />}
        {tab === "monitoring" && <MonitoringTab record={record} onSave={patchRecord} />}
        {tab === "timeline" && <TimelineTab record={record} />}
        {tab === "careplan" && <CarePlanTab record={record} onSave={patchRecord} notify={notify} />}
        {tab === "notes" && <NotesTab record={record} episodeId={episode?.id ?? ""} onAdd={addItem} notify={notify} />}
        {tab === "tasks" && <ListTab record={record} listKey="tasks" title="Tasks" defs={taskDefs} notify={notify} onAdd={addItem} onUpdate={updateItem} onRemove={removeItem} render={(item) => {
          const task = item as CrmTask;
          return <><div className="font-semibold">{task.title}</div><div className="text-xs text-muted-foreground">{labels.taskType[task.type]} · {task.priority.toLowerCase()} priority · {task.owner} · due {task.dueAt}</div><div className="mt-1 text-xs">{task.status.replace("_", " ").toLowerCase()}</div></>;
        }} defaults={{ status: "OPEN", priority: "MEDIUM", type: "CLINICAL_REVIEW" }} />}
        {tab === "contacts" && <ListTab record={record} listKey="contacts" title="Patient contacts" defs={contactDefs} notify={notify} onAdd={addItem} onUpdate={updateItem} onRemove={removeItem} render={(item) => {
          const c = item as PatientContact;
          return <><div className="font-semibold">{c.name} <span className="text-xs font-normal text-muted-foreground">{c.relationship}</span></div><div className="font-mono text-xs text-muted-foreground">{c.phone}{c.email ? ` · ${c.email}` : ""}</div><div className="mt-1 flex flex-wrap gap-1">{c.isNextOfKin && <Pill label="Next of kin" />}{c.isEmergencyContact && <Pill label="Emergency" />}{c.isCaregiverProxy && <Pill label="Proxy access" tone="risk" />}</div>{c.contactInstructions && <p className="mt-2 text-xs">{c.contactInstructions}</p>}</>;
        }} />}
        {tab === "team" && <ListTab record={record} listKey="careTeam" title="Care team" defs={teamDefs} notify={notify} onAdd={addItem} onUpdate={updateItem} onRemove={removeItem} render={(item) => {
          const m = item as CareTeamMember;
          return <><div className="font-semibold">{m.name} {m.primary && <Pill label="Primary" />}</div><div className="text-xs text-muted-foreground">{labels.careTeamRole[m.role]}{m.organisation ? ` · ${m.organisation}` : ""}{m.phone ? ` · ${m.phone}` : ""}</div></>;
        }} defaults={{ role: "NURSE" }} />}
        {tab === "communications" && <ListTab record={record} listKey="communications" title="Communications" defs={commDefs} notify={notify} onAdd={addItem} onUpdate={updateItem} onRemove={removeItem} render={(item) => {
          const c = item as CommunicationEvent;
          return <><div className="font-semibold">{c.direction === "INBOUND" ? "Inbound" : "Outbound"} {c.channel.toLowerCase().replace("_", " ")} · {c.participants}</div><div className="font-mono text-[11px] text-muted-foreground">{c.createdAt} · {c.createdBy}</div><p className="mt-1 text-sm">{c.summary}</p>{c.outcome && <p className="mt-1 text-xs text-muted-foreground">Outcome: {c.outcome}</p>}</>;
        }} defaults={{ direction: "OUTBOUND", channel: "PHONE" }} />}
        {tab === "documents" && <ListTab record={record} listKey="documents" title="Documents" description="Document records are placeholders in this prototype; no files are stored." defs={documentDefs} notify={notify} onAdd={addItem} onUpdate={updateItem} onRemove={removeItem} render={(item) => {
          const d = item as CrmDocument;
          return <><div className="font-semibold">{d.title}</div><div className="text-xs text-muted-foreground">{labels.documentType[d.type]} · {d.addedBy} · {d.createdAt}</div>{d.note && <p className="mt-1 text-xs">{d.note}</p>}</>;
        }} defaults={{ type: "REFERRAL" }} />}
        {tab === "audit" && <AuditTab record={record} />}
      </div>
    </>
  );
}

/* ---------- tabs ---------- */

const identityDefs: FieldDef[] = [
  { key: "firstName", label: "First name", type: "text", required: true },
  { key: "lastName", label: "Last name", type: "text", required: true },
  { key: "preferredName", label: "Preferred name", type: "text" },
  { key: "dateOfBirth", label: "Date of birth", type: "text", required: true },
  { key: "age", label: "Age", type: "number" },
  { key: "sex", label: "Sex", type: "text" },
  { key: "gender", label: "Gender", type: "text" },
  { key: "pronouns", label: "Pronouns", type: "text" },
  { key: "phone", label: "Phone", type: "text", required: true },
  { key: "email", label: "Email", type: "text" },
  { key: "preferredContactMethod", label: "Preferred contact", type: "select", options: [["PHONE", "Phone"], ["SMS", "SMS"], ["EMAIL", "Email"]] },
  { key: "preferredLanguage", label: "Preferred language", type: "text" },
  { key: "interpreterRequired", label: "Interpreter required", type: "check" },
  { key: "region", label: "Region", type: "text", required: true },
  { key: "team", label: "Team", type: "text", required: true },
  { key: "owner", label: "Responsible clinician", type: "text", required: true },
  { key: "communicationInstructions", label: "Communication instructions", type: "textarea" },
  { key: "homeAccessNotes", label: "Home access notes", type: "textarea" },
];

const addressDefs: FieldDef[] = [
  { key: "line1", label: "Address line 1", type: "text", required: true },
  { key: "line2", label: "Address line 2", type: "text" },
  { key: "suburbCity", label: "Suburb or city", type: "text", required: true },
  { key: "stateRegion", label: "State or region", type: "text" },
  { key: "postcode", label: "Postcode", type: "text" },
  { key: "country", label: "Country", type: "text", required: true },
];

const stateDefs: FieldDef[] = [
  { key: "clinicalStatus", label: "Clinical status", type: "select", options: enumOptions(labels.clinicalStatus) },
  { key: "trajectory", label: "Trajectory", type: "select", options: enumOptions(labels.trajectory) },
  { key: "riskLevel", label: "Risk level", type: "select", options: enumOptions(labels.riskLevel) },
  { key: "outcomeStatus", label: "Outcome status", type: "select", options: enumOptions(labels.outcomeStatus) },
  { key: "activeAlertCount", label: "Active alerts", type: "number" },
  { key: "lastObservationAt", label: "Last observation", type: "text" },
  { key: "lastClinicalReviewAt", label: "Last clinical review", type: "text" },
  { key: "nextAction", label: "Next action", type: "text" },
  { key: "nextActionAt", label: "Next action due", type: "text" },
  { key: "deviceConcern", label: "Device concern open", type: "check" },
  { key: "noData", label: "No data safety state", type: "check" },
  { key: "dischargeLikely", label: "Discharge likely", type: "check" },
];

type SaveRecord = (id: string, patch: Partial<CrmRecord>, summary: string, field?: string) => void;

function OverviewTab({ record, onSave, onSaveEpisode, onDelete }: { record: CrmRecord; onSave: SaveRecord; onSaveEpisode: (values: Record<string, unknown>) => void; onDelete: () => void }) {
  const episode = currentEpisode(record);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <EditableSection title="Identity and contact" defs={identityDefs} source={record as unknown as Record<string, unknown>} onSave={(values) => onSave(record.id, values as Partial<CrmRecord>, "Identity and contact detail updated")}>
        <Row k="Preferred name" v={record.preferredName ?? record.firstName} />
        <Row k="Date of birth" v={`${record.dateOfBirth} · ${record.age} yrs`} />
        <Row k="Sex / gender" v={`${record.sex} · ${record.gender}`} />
        <Row k="Pronouns" v={record.pronouns} />
        <Row k="Phone" v={record.phone} />
        <Row k="Email" v={record.email ?? ""} />
        <Row k="Preferred contact" v={record.preferredContactMethod.toLowerCase()} />
        <Row k="Language" v={`${record.preferredLanguage}${record.interpreterRequired ? " · interpreter required" : ""}`} />
        <Row k="Region and team" v={`${record.region} · ${record.team}`} />
        <Row k="Responsible clinician" v={record.owner} />
        <Row k="Communication instructions" v={record.communicationInstructions} />
        <Row k="Home access" v={record.homeAccessNotes} />
      </EditableSection>

      <EditableSection title="Address" defs={addressDefs} source={record.address as unknown as Record<string, unknown>} onSave={(values) => onSave(record.id, { address: values as unknown as CrmRecord["address"] }, "Address updated", "address")}>
        <Row k="Address" v={[record.address.line1, record.address.line2, record.address.suburbCity, record.address.stateRegion, record.address.postcode, record.address.country].filter(Boolean).join(", ")} />
      </EditableSection>

      <EditableSection title="Patient state" description="Clinical status, trajectory and safety flags shown across the console." defs={stateDefs} source={record.state as unknown as Record<string, unknown>} onSave={(values) => onSave(record.id, { state: values as unknown as CrmRecord["state"] }, "Patient state updated", "state")}>
        <Row k="Clinical status" v={labels.clinicalStatus[record.state.clinicalStatus]} />
        <Row k="Trajectory" v={labels.trajectory[record.state.trajectory]} />
        <Row k="Risk" v={labels.riskLevel[record.state.riskLevel]} />
        <Row k="Outcome" v={labels.outcomeStatus[record.state.outcomeStatus]} />
        <Row k="Active alerts" v={String(record.state.activeAlertCount)} />
        <Row k="Last observation" v={record.state.lastObservationAt} />
        <Row k="Last clinical review" v={record.state.lastClinicalReviewAt} />
        <Row k="Next action" v={`${record.state.nextAction} · ${record.state.nextActionAt}`} />
        <Row k="Safety flags" v={[record.state.noData && "No data", record.state.deviceConcern && "Device concern", record.state.dischargeLikely && "Discharge likely"].filter(Boolean).join(" · ") || "None"} />
      </EditableSection>

      {episode && (
        <EditableSection title="Current care episode" description={`Episode ${episode.id}`} defs={episodeDefs} source={episode as unknown as Record<string, unknown>} onSave={onSaveEpisode}>
          <Row k="Status" v={labels.episodeStatus[episode.status]} />
          <Row k="Primary diagnosis" v={episode.primaryDiagnosis} />
          <Row k="Secondary diagnoses" v={episode.secondaryDiagnoses.join(", ")} />
          <Row k="Pathway" v={episode.pathway} />
          <Row k="Acuity" v={labels.acuity[episode.acuity]} />
          <Row k="Admitted" v={episode.admissionDate} />
          <Row k="Expected discharge" v={episode.expectedDischargeDate ?? ""} />
          <Row k="Day of episode" v={`${episode.dayOf} of ${episode.plannedDays}`} />
          <Row k="Referral" v={[episode.referralSource, episode.referringClinician, episode.referringOrganisation].filter(Boolean).join(" · ")} />
          <Row k="Admission reason" v={episode.admissionReason} />
          <Row k="Home care rationale" v={episode.homeCareRationale ?? ""} />
        </EditableSection>
      )}

      {record.episodes.length > 1 && (
        <Card title="Previous episodes">
          {record.episodes.slice(1).map((e) => (
            <div key={e.id} className="border-t border-border py-3 first:border-0 first:pt-0">
              <div className="font-semibold">{e.primaryDiagnosis}</div>
              <div className="text-xs text-muted-foreground">{labels.episodeStatus[e.status]} · {e.admissionDate}{e.actualDischargeDate ? ` to ${e.actualDischargeDate}` : ""} · {e.pathway}</div>
            </div>
          ))}
        </Card>
      )}

      <Card title="Remove record" description="Deleting removes the record from this prototype only.">
        {confirming ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 />Confirm removal</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)}><X />Keep record</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setConfirming(true)}><Trash2 />Remove this record</Button>
        )}
      </Card>
    </div>
  );
}

const clinicalDefs: FieldDef[] = [
  { key: "presentingCondition", label: "Presenting condition", type: "textarea", required: true },
  { key: "clinicalSummary", label: "Clinical summary", type: "textarea", required: true },
  { key: "currentTreatment", label: "Current treatment", type: "textarea" },
  { key: "prognosis", label: "Prognosis", type: "textarea" },
  { key: "expectedOutcome", label: "Expected outcome", type: "textarea" },
  { key: "functionalStatus", label: "Functional status", type: "textarea" },
  { key: "socialContext", label: "Social context", type: "textarea" },
  { key: "medicalHistory", label: "Medical history (one per line)", type: "list" },
  { key: "chronicConditions", label: "Chronic conditions (one per line)", type: "list" },
  { key: "allergies", label: "Allergies (one per line)", type: "list" },
  { key: "medications", label: "Medications (one per line)", type: "list" },
];

function ClinicalTab({ record, onSave }: { record: CrmRecord; onSave: SaveRecord }) {
  return (
    <EditableSection title="Clinical detail" description="Condition, history, medicines and context for this patient." defs={clinicalDefs} source={record as unknown as Record<string, unknown>} onSave={(values) => onSave(record.id, values as Partial<CrmRecord>, "Clinical detail updated")}>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-4">
          <div><h4 className="text-xs font-semibold uppercase text-primary">Presenting condition</h4><p className="mt-1 text-sm leading-relaxed">{record.presentingCondition}</p></div>
          <div><h4 className="text-xs font-semibold uppercase text-primary">Clinical summary</h4><p className="mt-1 text-sm leading-relaxed">{record.clinicalSummary}</p></div>
          <div><h4 className="text-xs font-semibold uppercase text-primary">Current treatment</h4><p className="mt-1 text-sm leading-relaxed">{record.currentTreatment}</p></div>
          <div><h4 className="text-xs font-semibold uppercase text-primary">Prognosis</h4><p className="mt-1 text-sm leading-relaxed">{record.prognosis}</p></div>
          <div><h4 className="text-xs font-semibold uppercase text-primary">Expected outcome</h4><p className="mt-1 text-sm leading-relaxed">{record.expectedOutcome}</p></div>
        </div>
        <div className="space-y-4">
          <div><h4 className="text-xs font-semibold uppercase text-primary">Allergies</h4><div className="mt-1"><Bullets items={record.allergies} /></div></div>
          <div><h4 className="text-xs font-semibold uppercase text-primary">Medications</h4><div className="mt-1"><Bullets items={record.medications} /></div></div>
          <div><h4 className="text-xs font-semibold uppercase text-primary">Chronic conditions</h4><div className="mt-1"><Bullets items={record.chronicConditions} /></div></div>
          <div><h4 className="text-xs font-semibold uppercase text-primary">Medical history</h4><div className="mt-1"><Bullets items={record.medicalHistory} /></div></div>
          <div><h4 className="text-xs font-semibold uppercase text-primary">Function and social context</h4><p className="mt-1 text-sm leading-relaxed">{record.functionalStatus}</p><p className="mt-2 text-sm leading-relaxed">{record.socialContext}</p></div>
        </div>
      </div>
    </EditableSection>
  );
}

const monitoringDefs: FieldDef[] = [
  { key: "frequency", label: "Monitoring frequency", type: "text", required: true },
  { key: "missingDataRule", label: "Missing data rule", type: "textarea", required: true },
  { key: "deviceQualityNote", label: "Device quality note", type: "textarea" },
  { key: "parameters", label: "Parameters (one per line)", type: "list" },
  { key: "devices", label: "Devices (one per line)", type: "list" },
];

function MonitoringTab({ record, onSave }: { record: CrmRecord; onSave: SaveRecord }) {
  const m = record.monitoring;
  const [editingThresholds, setEditingThresholds] = useState(false);
  const [rows, setRows] = useState(m.thresholds);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <EditableSection title="Monitoring plan" defs={monitoringDefs} source={m as unknown as Record<string, unknown>} onSave={(values) => onSave(record.id, { monitoring: { ...m, ...(values as Partial<typeof m>) } }, "Monitoring plan updated", "monitoring")}>
        <Row k="Frequency" v={m.frequency} />
        <Row k="Parameters" v={m.parameters.join(", ")} />
        <Row k="Devices" v={m.devices.join(", ")} />
        <Row k="Missing data rule" v={m.missingDataRule} />
        <Row k="Device quality" v={m.deviceQualityNote} />
      </EditableSection>

      <Card title="Thresholds" description="Values outside these ranges raise clinical review or rapid response." action={editingThresholds
        ? <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setRows(m.thresholds); setEditingThresholds(false); }}>Cancel</Button><Button size="sm" onClick={() => { onSave(record.id, { monitoring: { ...m, thresholds: rows } }, "Monitoring thresholds updated", "thresholds"); setEditingThresholds(false); }}>Save thresholds</Button></div>
        : <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setRows(m.thresholds); setEditingThresholds(true); }}><Pencil />Edit</Button></div>}>
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground"><tr><th className="pb-2">Parameter</th><th>Lower</th><th>Upper</th>{editingThresholds && <th></th>}</tr></thead>
          <tbody>
            {(editingThresholds ? rows : m.thresholds).map((t, i) => (
              <tr key={`${t.parameter}-${i}`} className="h-11 border-t border-border">
                {editingThresholds ? (
                  <>
                    <td className="pr-2"><input aria-label="Parameter" value={t.parameter} onChange={(e) => setRows(rows.map((r, ri) => ri === i ? { ...r, parameter: e.target.value } : r))} className="h-9 w-full rounded-control border border-input bg-background px-2 text-sm" /></td>
                    <td className="pr-2"><input aria-label="Lower limit" value={t.lower} onChange={(e) => setRows(rows.map((r, ri) => ri === i ? { ...r, lower: e.target.value } : r))} className="h-9 w-full rounded-control border border-input bg-background px-2 text-sm" /></td>
                    <td className="pr-2"><input aria-label="Upper limit" value={t.upper} onChange={(e) => setRows(rows.map((r, ri) => ri === i ? { ...r, upper: e.target.value } : r))} className="h-9 w-full rounded-control border border-input bg-background px-2 text-sm" /></td>
                    <td><Button size="icon" variant="ghost" aria-label={`Remove ${t.parameter}`} onClick={() => setRows(rows.filter((_, ri) => ri !== i))}><Trash2 /></Button></td>
                  </>
                ) : (
                  <><td>{t.parameter}</td><td className="font-mono">{t.lower}</td><td className="font-mono">{t.upper}</td></>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {editingThresholds && <Button size="sm" variant="outline" className="mt-3" onClick={() => setRows([...rows, { parameter: "", lower: "", upper: "" }])}><Plus />Add threshold</Button>}
      </Card>

      <Card title="Recent observations" description={`${record.observations.length} readings received`}>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-[11px] uppercase text-muted-foreground"><tr><th className="px-2 py-2">Time</th><th>SpO₂</th><th>HR</th><th>RR</th><th>Systolic</th><th>Temp</th><th>Quality</th></tr></thead>
            <tbody>
              {[...record.observations].reverse().map((o, i) => (
                <tr key={`${o.at}-${i}`} className="h-10 border-t border-border font-mono text-xs">
                  <td className="px-2">{o.at}</td><td>{o.spo2 ?? "—"}</td><td>{o.hr ?? "—"}</td><td>{o.rr ?? "—"}</td><td>{o.systolic ?? "—"}</td><td>{o.temp ?? "—"}</td><td>{o.quality}</td>
                </tr>
              ))}
              {record.observations.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No observations recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TimelineTab({ record }: { record: CrmRecord }) {
  return (
    <Card title="Care timeline" description="Treatments, visits, reviews, alerts and record activity in time order.">
      {record.timeline.map((e) => (
        <div key={e.id} className="flex gap-4 border-t border-border py-3 first:border-0 first:pt-0">
          <span className="mt-1.5 size-2 shrink-0 bg-primary" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{e.title}</span>
              <Pill label={labels.timelineType[e.type]} />
            </div>
            {e.detail && <p className="mt-1 text-sm">{e.detail}</p>}
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{e.at} · {e.author}</p>
          </div>
        </div>
      ))}
      {record.timeline.length === 0 && <p className="text-sm text-muted-foreground">No timeline events recorded.</p>}
    </Card>
  );
}

const carePlanDefs: FieldDef[] = [
  { key: "goals", label: "Goals (one per line)", type: "list" },
  { key: "medicationPlan", label: "Medication plan (one per line)", type: "list" },
  { key: "monitoringRequirements", label: "Monitoring requirements (one per line)", type: "list" },
  { key: "plannedHomeVisits", label: "Planned home visits (one per line)", type: "list" },
  { key: "plannedVirtualReviews", label: "Planned virtual reviews (one per line)", type: "list" },
  { key: "investigations", label: "Investigations (one per line)", type: "list" },
  { key: "alliedHealth", label: "Allied health (one per line)", type: "list" },
  { key: "escalationCriteria", label: "Escalation criteria (one per line)", type: "list" },
  { key: "emergencyInstructions", label: "Emergency instructions", type: "textarea", required: true },
];

function CarePlanTab({ record, onSave, notify }: { record: CrmRecord; onSave: SaveRecord; notify: (m: string) => void }) {
  const plan = record.carePlan;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <EditableSection title="Care plan" defs={carePlanDefs} source={plan as unknown as Record<string, unknown>} onSave={(values) => onSave(record.id, { carePlan: { ...plan, ...(values as Partial<typeof plan>) } }, "Care plan updated", "carePlan")}>
        <div className="space-y-4">
          {([["Goals", plan.goals], ["Medication plan", plan.medicationPlan], ["Monitoring requirements", plan.monitoringRequirements], ["Planned home visits", plan.plannedHomeVisits], ["Planned virtual reviews", plan.plannedVirtualReviews], ["Investigations", plan.investigations], ["Allied health", plan.alliedHealth], ["Escalation criteria", plan.escalationCriteria]] as Array<[string, string[]]>).map(([heading, items]) => (
            <div key={heading}><h4 className="text-xs font-semibold uppercase text-primary">{heading}</h4><div className="mt-1"><Bullets items={items} /></div></div>
          ))}
          <div className="border border-rapid bg-rapid-soft p-3 text-sm"><strong>Emergency instructions</strong><p className="mt-1">{plan.emergencyInstructions}</p></div>
        </div>
      </EditableSection>

      <Card title="Discharge criteria" description="A clinician confirms readiness; the checklist alone never discharges a patient.">
        {plan.dischargeCriteria.map((c, i) => (
          <label key={c.text} className="flex min-h-11 items-center gap-3 border-t border-border text-sm first:border-0">
            <input type="checkbox" className="size-4 accent-primary" checked={c.met} onChange={(e) => {
              const next = plan.dischargeCriteria.map((item, index) => index === i ? { ...item, met: e.target.checked } : item);
              onSave(record.id, { carePlan: { ...plan, dischargeCriteria: next } }, `Discharge criterion ${e.target.checked ? "met" : "cleared"}: ${c.text}`, "dischargeCriteria");
              notify(`Discharge criterion updated: ${c.text}`);
            }} />
            <span className="flex-1">{c.text}</span>
          </label>
        ))}
        {plan.dischargeCriteria.length === 0 && <p className="text-sm text-muted-foreground">No discharge criteria recorded.</p>}
      </Card>
    </div>
  );
}

function NotesTab({ record, episodeId, onAdd, notify }: { record: CrmRecord; episodeId: string; onAdd: ReturnType<typeof useCrm>["addItem"]; notify: (m: string) => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <Card title="Clinical notes" description="Notes are append-only: they can be added but never edited or removed." action={<Button size="sm" onClick={() => setAdding((a) => !a)}><Plus />Add note</Button>}>
      {adding && (
        <ItemEditor
          defs={noteDefs}
          initial={{ type: "NURSING", author: record.owner, authorRole: "Clinician" }}
          submitLabel="Save note"
          onCancel={() => setAdding(false)}
          onSubmit={(values) => {
            const note = { id: newId("note"), episodeId, createdAt: stamp(), ...values } as ClinicalNote;
            onAdd(record.id, "notes", note, `${labels.noteType[note.type]} note added`, { type: "NOTE", title: `${labels.noteType[note.type]} note added` });
            setAdding(false);
            notify("Clinical note added to the record");
          }}
        />
      )}
      {record.notes.map((n) => (
        <article key={n.id} className="border-t border-border py-4 first:border-0 first:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pill label={labels.noteType[n.type]} />
            <span className="text-sm font-semibold">{n.author}</span>
            <span className="text-xs text-muted-foreground">{n.authorRole}</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">{n.createdAt}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{n.body}</p>
          {n.linkedAlertId && <p className="mt-1 font-mono text-[11px] text-muted-foreground">Linked alert {n.linkedAlertId}</p>}
        </article>
      ))}
      {record.notes.length === 0 && !adding && <p className="text-sm text-muted-foreground">No notes recorded yet.</p>}
    </Card>
  );
}

function ListTab({
  record, listKey, title, description, defs, defaults, render, notify, onAdd, onUpdate, onRemove,
}: {
  record: CrmRecord; listKey: ListKey; title: string; description?: string; defs: FieldDef[];
  defaults?: Record<string, unknown>; render: (item: unknown) => React.ReactNode; notify: (m: string) => void;
  onAdd: ReturnType<typeof useCrm>["addItem"];
  onUpdate: ReturnType<typeof useCrm>["updateItem"];
  onRemove: ReturnType<typeof useCrm>["removeItem"];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const items = record[listKey] as unknown as Array<Record<string, unknown> & { id: string }>;
  const singular = title.replace(/s$/, "").toLowerCase();

  return (
    <Card title={title} {...(description ? { description } : {})} action={<Button size="sm" onClick={() => { setAdding((a) => !a); setEditingId(null); }}><Plus />Add</Button>}>
      {adding && (
        <ItemEditor
          defs={defs}
          {...(defaults ? { initial: defaults } : {})}
          submitLabel={`Save ${singular}`}
          onCancel={() => setAdding(false)}
          onSubmit={(values) => {
            const item = { id: newId(listKey.slice(0, 3)), createdAt: stamp(), ...values } as never;
            onAdd(record.id, listKey, item, `${title} entry added`);
            setAdding(false);
            notify(`${title} updated`);
          }}
        />
      )}
      {items.map((item) => (
        <div key={item.id} className="border-t border-border py-3 first:border-0 first:pt-0">
          {editingId === item.id ? (
            <ItemEditor
              defs={defs}
              initial={item}
              submitLabel="Save changes"
              onCancel={() => setEditingId(null)}
              onSubmit={(values) => {
                onUpdate(record.id, listKey, item.id, values, `${title} entry updated`);
                setEditingId(null);
                notify(`${title} updated`);
              }}
            />
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{render(item)}</div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label={`Edit ${singular}`} onClick={() => { setEditingId(item.id); setAdding(false); }}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label={`Remove ${singular}`} onClick={() => { onRemove(record.id, listKey, item.id, `${title} entry removed`); notify(`${title} updated`); }}><Trash2 /></Button>
              </div>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && !adding && <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>}
    </Card>
  );
}

function AuditTab({ record }: { record: CrmRecord }) {
  return (
    <Card title="Audit trail" description="Every change to this record, with who made it and when.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted text-[11px] uppercase text-muted-foreground"><tr><th className="px-3 py-2">Time</th><th>Person</th><th>Action</th><th>Entity</th><th>Field</th><th>Detail</th></tr></thead>
          <tbody>
            {record.audit.map((a) => (
              <tr key={a.id} className="h-11 border-t border-border">
                <td className="px-3 font-mono text-xs">{a.at}</td>
                <td>{a.userName}</td>
                <td className="text-xs">{a.action.toLowerCase()}</td>
                <td className="text-xs">{a.entityType}<div className="font-mono text-[11px] text-muted-foreground">{a.entityId}</div></td>
                <td className="font-mono text-[11px]">{a.field ?? "—"}</td>
                <td className="text-xs">{a.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export type { Tab as PatientCrmTab, ClinicalStatus, Trajectory, RiskLevel };
