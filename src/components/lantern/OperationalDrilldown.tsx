import { useMemo, useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Filter, Radio, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmissionWorklist, useDeviceWorklist, useOps, useTransferWorklist, waitingLabel, clockLabel, type OpsData } from "@/lib/lantern-ops";
import { cn } from "@/lib/utils";

export type MetricView = "admissions" | "transfers" | "devices" | "pressure" | "forecast";

type Audit = (event: string, detail: string) => void;
type Row = { key: string; cells: string[]; owner: string; bucket: string };

const PAGE = 25;

const meta: Record<MetricView, { title: string; summary: string; unit: string; filters: string[]; primary: string }> = {
  admissions: { title: "Admissions pending", summary: "Move referred patients into active home-hospital episodes.", unit: "Total pending", filters: ["All pending", "First observation", "Blocked"], primary: "Assign intake owner" },
  transfers: { title: "Transfers in progress", summary: "Track time-critical handover from home care to receiving services.", unit: "Active transfers", filters: ["Transfer board", "Handover analytics", "Overdue"], primary: "Open structured handover" },
  devices: { title: "Device concerns", summary: "Separate device work from clinical deterioration while preserving patient safety context.", unit: "Open concerns", filters: ["All concerns", "Contact required", "No data > 2 h"], primary: "Assign device owner" },
  pressure: { title: "Service pressure", summary: "See why the current shift is strained and where operational action is needed.", unit: "Network state", filters: ["Regional pressure", "Strained regions", "Staffing"], primary: "Create shift huddle note" },
  forecast: { title: "Workload forecast", summary: "Anticipate reviews, observations, device tasks, admissions, transfers and discharges.", unit: "Next 4 hours", filters: ["Next 4 hours", "Next 8 hours", "Next 24 hours"], primary: "Create staffing request" },
};

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="border border-border bg-card p-4"><div className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</div><div className="mt-2 font-mono text-2xl font-medium tabular-nums">{value}</div></div>;
}

function total(ops: OpsData, metric: MetricView): string {
  const n = ops.network;
  if (metric === "admissions") return String(n.admissionsPending);
  if (metric === "transfers") return String(n.transfersInProgress);
  if (metric === "devices") return String(n.deviceConcerns);
  if (metric === "pressure") return n.servicePressure;
  return n.workload.h4.toLocaleString();
}

export function OperationalDrilldown({ metric, onBack, notify, audit }: { metric: MetricView; onBack: () => void; notify: (message: string) => void; audit: Audit }) {
  const spec = meta[metric];
  const { ops } = useOps();
  const admissions = useAdmissionWorklist();
  const transfers = useTransferWorklist();
  const devices = useDeviceWorklist();
  const [filter, setFilter] = useState<string>(spec.filters[0] ?? "");
  const [selected, setSelected] = useState(0);
  const [shown, setShown] = useState(PAGE);
  const setActiveFilter = (value: string) => { setFilter(value); setSelected(0); setShown(PAGE); audit("dashboard_metric_filter_applied", `${metric} · ${value}`); };
  const action = (label: string) => { notify(`${label} opened`); audit("dashboard_metric_cta_clicked", `${metric} · ${label}`); };

  const rows = useMemo<Row[]>(() => {
    if (metric === "admissions") return (admissions.data ?? []).map((r) => ({ key: r.id, bucket: r.stage ?? "", owner: r.owner, cells: [r.name, r.region, r.pathway, clockLabel(r.referred_at), r.stage ?? "—", r.owner, waitingLabel(r.referred_at)] }));
    if (metric === "transfers") return (transfers.data ?? []).map((r) => ({ key: r.id, bucket: r.stage ?? "", owner: r.owner, cells: [r.name, r.status, r.reason, r.destination ?? "—", r.stage ?? "—", r.eta ?? "—", r.owner] }));
    if (metric === "devices") return (devices.data ?? []).map((r) => ({ key: r.id, bucket: r.issue ?? "", owner: r.owner ?? "Unassigned", cells: [r.name, r.status, r.device_type ?? "—", r.issue ?? "—", `${r.data_age_minutes ?? 0} min`, r.next_action ?? "—", r.owner ?? "Unassigned"] }));
    return [];
  }, [metric, admissions.data, transfers.data, devices.data]);

  const filtered = useMemo(() => {
    if (metric === "admissions" && filter === "First observation") return rows.filter((r) => r.bucket === "First observation");
    if (metric === "admissions" && filter === "Blocked") return rows.filter((r) => r.bucket === "Eligibility review" || r.bucket === "Kit not assigned");
    if (metric === "transfers" && filter === "Overdue") return rows.filter((r) => r.cells[5] === "Confirmation due" || r.cells[5] === "Now");
    if (metric === "devices" && filter === "Contact required") return rows.filter((r) => r.bucket === "Contact required");
    if (metric === "devices" && filter === "No data > 2 h") return rows.filter((r) => r.bucket === "No data > 2 h");
    return rows;
  }, [rows, filter, metric]);

  const buckets = metric === "admissions" ? ops.buckets.admissions : metric === "transfers" ? ops.buckets.transfers : metric === "devices" ? ops.buckets.devices : [];
  const stats: Array<[string, string]> = metric === "pressure"
    ? [["Staffing headroom", ops.network.staffingHeadroom], ["Clinical reviews", ops.network.review.toLocaleString()], ["Rapid response", ops.network.rapid.toLocaleString()], ["Transfers", String(ops.network.transfersInProgress)]]
    : metric === "forecast"
      ? [["Next 8 hours", ops.network.workload.h8.toLocaleString()], ["Next 24 hours", ops.network.workload.h24.toLocaleString()], ["Clinical reviews", ops.network.review.toLocaleString()], ["No data follow-up", ops.network.nodata.toLocaleString()]]
      : buckets.slice(0, 4).map((b) => [b.bucket, String(b.total)] as [string, string]);

  return <>
    <div className="border-b border-border bg-card px-5 py-5 lg:px-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 px-0"><ChevronLeft />Network command</Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-1 text-[11px] font-semibold uppercase text-primary">Network command / {spec.title}</div><h1 className="font-display text-3xl font-semibold">{spec.title}</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{spec.summary} · Morning shift · figures from the live record set</p></div><Button onClick={() => action(spec.primary)}>{spec.primary}<ChevronRight /></Button></div>
    </div>
    <div className="min-w-0 space-y-5 overflow-hidden p-5 lg:p-8">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label={`${spec.title} summary`}><Summary label={spec.unit} value={total(ops, metric)} />{stats.map(([label, value]) => <Summary key={label} label={label} value={value} />)}</section>
      <div className="flex flex-wrap items-center gap-2"><Filter className="size-4 text-muted-foreground" />{spec.filters.map((item) => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => setActiveFilter(item)}>{item}</Button>)}</div>
      {metric === "pressure" ? <PressureView ops={ops} filter={filter} action={action} />
        : metric === "forecast" ? <ForecastView ops={ops} filter={filter} action={action} />
          : <Worklist metric={metric} rows={filtered} shown={shown} onShowMore={() => setShown((value) => value + PAGE)} selected={selected} setSelected={setSelected} action={action} />}
    </div>
  </>;
}

function Worklist({ metric, rows, shown, onShowMore, selected, setSelected, action }: { metric: "admissions" | "transfers" | "devices"; rows: Row[]; shown: number; onShowMore: () => void; selected: number; setSelected: (value: number) => void; action: (label: string) => void }) {
  const headers = metric === "admissions" ? ["Patient", "Region", "Pathway", "Referral", "Next action", "Owner", "Waiting"] : metric === "transfers" ? ["Patient", "State", "Reason", "Destination", "Status", "ETA", "Owner"] : ["Patient", "Patient state", "Device", "Issue", "Data age", "Next action", "Owner"];
  const detailTitle = metric === "admissions" ? "Intake detail" : metric === "transfers" ? "Transfer detail" : "Device concern detail";
  const actions = metric === "admissions" ? ["Complete eligibility checklist", "Assign device kit", "Activate home admission"] : metric === "transfers" ? ["Update transport status", "Grant emergency access", "Confirm arrival"] : ["Request repeat observation", "Contact patient/caregiver", "Dispatch replacement"];
  const visible = rows.slice(0, shown);
  const selectedRow = rows[selected] ?? visible[0];
  if (!selectedRow) return <p className="border border-border bg-card p-6 text-sm text-muted-foreground">No records match this filter.</p>;
  return <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
    <div className="w-[calc(100vw-2.5rem)] min-w-0 xl:w-auto">
      <div className="overflow-x-auto border border-border bg-card"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-muted text-[11px] uppercase text-muted-foreground"><tr>{headers.map((header, i) => <th key={header} className={cn("py-3", i === 0 && "px-4")}>{header}</th>)}<th><span className="sr-only">Open</span></th></tr></thead><tbody>{visible.map((row, index) => <tr key={row.key} className={cn("h-16 border-t border-border hover:bg-accent", selected === index && "bg-accent")}><td className="px-4 font-semibold">{row.cells[0]}</td>{row.cells.slice(1).map((cell, i) => <td key={`${row.key}-${i}`} className="text-xs">{cell}</td>)}<td><Button variant="ghost" size="icon" aria-label={`Open ${row.cells[0]}`} onClick={() => setSelected(index)}><ChevronRight /></Button></td></tr>)}</tbody></table></div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="font-mono">Showing {visible.length} of {rows.length}</span>{visible.length < rows.length && <Button size="sm" variant="outline" onClick={onShowMore}>Show 25 more</Button>}</div>
    </div>
    <aside className="border border-border bg-card p-4"><h2 className="font-semibold">{detailTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedRow.cells[0]} · {selectedRow.key}</p><div className="my-4 border-y border-border py-3 text-sm"><div className="flex justify-between py-1"><span className="text-muted-foreground">Owner</span><strong>{selectedRow.owner}</strong></div><div className="flex justify-between py-1"><span className="text-muted-foreground">Current step</span><strong>{selectedRow.bucket || "—"}</strong></div></div>{actions.map((label, i) => <Button key={label} variant={i === 0 ? "default" : "outline"} className="mb-2 w-full" onClick={() => action(label)}>{label}</Button>)}{metric === "devices" && <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Resolving this device concern will not close any linked clinical alert.</p>}</aside>
  </div>;
}

function PressureView({ ops, filter, action }: { ops: OpsData; filter: string; action: (label: string) => void }) {
  const regions = filter === "Strained regions" ? ops.regions.filter((region) => region.pressure >= 85) : ops.regions;
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="overflow-x-auto border border-border bg-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted text-[11px] uppercase text-muted-foreground"><tr><th className="px-4 py-3">Region</th><th>Active</th><th>Review</th><th>Rapid</th><th>No data</th><th>Admissions</th><th>Pressure</th></tr></thead><tbody>{regions.map((region) => <tr key={region.name} className="h-14 border-t border-border"><td className="px-4 font-semibold">{region.name}</td><td className="font-mono">{region.active.toLocaleString()}</td><td className="font-mono">{region.review}</td><td className="font-mono">{region.rapid}</td><td className="font-mono">{region.nodata}</td><td className="font-mono">{region.admissionsPending}</td><td><span className={cn("border px-2 py-1 font-mono text-xs", region.pressure >= 85 ? "border-review bg-review-soft text-review" : "border-border")}>{region.pressure}%</span></td></tr>)}</tbody></table></div><aside className="space-y-4"><div className="border border-border bg-card p-4"><div className="flex items-center gap-2"><Users className="size-4 text-primary" /><h2 className="font-semibold">Regional staffing headroom</h2></div>{ops.regions.map((region) => <div key={region.name} className="flex justify-between border-t border-border py-2 text-sm first:mt-3"><span>{region.name}</span><strong>{region.headroom}</strong></div>)}</div>{["Open affected team queue", "Prioritise likely discharges", "Trigger surge protocol"].map((label) => <Button key={label} variant="outline" className="w-full" onClick={() => action(label)}>{label}</Button>)}</aside></div>;
}

function ForecastView({ ops, filter, action }: { ops: OpsData; filter: string; action: (label: string) => void }) {
  const hours = filter === "Next 24 hours" ? 24 : filter === "Next 8 hours" ? 8 : 4;
  const forecast = hours === 24 ? ops.network.workload.h24 : hours === 8 ? ops.network.workload.h8 : ops.network.workload.h4;
  const perHour = Math.round(forecast / hours);
  const bars = Array.from({ length: 8 }, (_, index) => 55 + ((index * 13 + forecast) % 40));
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><section className="border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Demand and staffed capacity</h2><p className="text-xs text-muted-foreground">{filter} · {forecast.toLocaleString()} forecast work items · ~{perHour.toLocaleString()} per hour</p></div><Activity className="size-5 text-primary" /></div><div className="mt-8 flex h-56 items-end gap-3 border-b border-l-border px-2">{bars.map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="relative flex h-44 w-full items-end bg-muted"><div className="w-full bg-primary" style={{ height: `${height}%` }} /><div className="absolute inset-x-0 border-t-2 border-review" style={{ bottom: "72%" }} /></div><span className="font-mono text-[10px]">{9 + index}:00</span></div>)}</div><div className="mt-4 flex gap-5 text-xs"><span className="flex items-center gap-2"><span className="size-2 bg-primary" />Forecast demand</span><span className="flex items-center gap-2"><span className="h-0.5 w-3 bg-review" />Staffed capacity</span></div></section><aside className="space-y-4"><div className="border border-machine bg-machine-soft p-4"><div className="flex items-center gap-2 text-machine"><Radio className="size-4" /><span className="text-xs font-semibold uppercase">Forecast · moderate confidence</span></div><h2 className="mt-3 font-semibold">Regional share of forecast work</h2>{ops.regions.map((region) => <div key={region.name} className="flex justify-between border-t border-machine/30 py-2 text-sm first:mt-3"><span>{region.name}</span><strong className="font-mono">{Math.round((region.active / Math.max(1, ops.network.activePatients)) * 100)}%</strong></div>)}</div>{["Open forecasted high-risk cohort", "Compare surge scenario", "Create staffing request"].map((label) => <Button key={label} variant="outline" className="w-full" onClick={() => action(label)}>{label}</Button>)}</aside></div>;
}
