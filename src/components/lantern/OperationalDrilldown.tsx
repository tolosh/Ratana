import { useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Clock3, Filter, Radio, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { network, regions } from "@/lib/lantern-data";
import { cn } from "@/lib/utils";

export type MetricView = "admissions" | "transfers" | "devices" | "pressure" | "forecast";

type Audit = (event: string, detail: string) => void;

const specs = {
  admissions: { title: "Admissions pending", summary: "Move referred patients into active home-hospital episodes.", total: String(network.admissionsPending), unit: "Total pending", stats: [["Eligibility review","12"],["Onboarding incomplete","19"],["Kit not assigned","18"],["First observation","23"]], filters: ["All pending","First observation","Blocked"], primary: "Assign intake owner" },
  transfers: { title: "Transfers in progress", summary: "Track time-critical handover from home care to receiving services.", total: String(network.transfersInProgress), unit: "Active transfers", stats: [["Preparing handover","5"],["Awaiting transport","7"],["En route","6"],["Arrival confirmation","3"]], filters: ["Transfer board","Handover analytics","Overdue"], primary: "Open structured handover" },
  devices: { title: "Device concerns", summary: "Separate device work from clinical deterioration while preserving patient safety context.", total: String(network.deviceConcerns), unit: "Open concerns", stats: [["Contact required","16"],["No data > 2 h","31"],["Low quality","146"],["Replacement","22"]], filters: ["Patient safety","Contact required","Fleet view"], primary: "Assign device owner" },
  pressure: { title: "Service pressure", summary: "See why the current shift is strained and where operational action is needed.", total: network.servicePressure, unit: "Network state", stats: [["Staffing headroom","Limited"],["Clinical reviews","1,000"],["Rapid response","402"],["Transfers","21"]], filters: ["Regional pressure","Strained regions","Staffing"], primary: "Create shift huddle note" },
  forecast: { title: "Workload forecast", summary: "Anticipate reviews, observations, device tasks, admissions, transfers and discharges.", total: network.workload.h4.toLocaleString(), unit: "Next 4 hours", stats: [["Clinical reviews","318"],["Observations","612"],["Device tasks","184"],["Episode changes","156"]], filters: ["Next 4 hours","Next 8 hours","Next 24 hours"], primary: "Create staffing request" },
} as const;

const admissionRows = [
  ["Eleanor Price","Metro North","Respiratory","08:06","First observation","Mia Chen","24 min"],
  ["William Hart","Metro South","Cardiac","07:58","Kit assignment","Luca Patel","32 min"],
  ["Sofia Martin","Regional Coastal","IV antibiotics","07:41","Eligibility review","Unassigned","49 min"],
  ["George Liu","Western Region","Post-operative","07:22","App onboarding","Mia Chen","1 h 08"],
];
const transferRows = [
  ["Mara Ellis","Rapid response","COPD deterioration","Metro South ED","En route","8 min","Dr Asha Rao"],
  ["Arthur King","Clinical review","Chest pain","Metro North ED","Transport requested","14 min","Dr Lee Wong"],
  ["Nina Gupta","Rapid response","Sepsis concern","Western Acute","Preparing handover","Now","RN Kara Jones"],
  ["Peter Shaw","Clinical review","Fall at home","Regional Base","Arrived","Confirmation due","Dr Ana Cruz"],
];
const deviceRows = [
  ["David Okafor","No data","Pulse oximeter","No feed","2 h 32","Contact required","Amir Haddad"],
  ["Mei Tan","Stable","Pulse oximeter","Poor signal","18 min","Repeat reading","Jo Reed"],
  ["John Bell","Clinical review","Scale","Low battery","6 h","Replace battery","Amir Haddad"],
  ["Ana Santos","Clinical review","Thermometer","Unpaired","42 min","Pair device","Unassigned"],
];

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="border border-border bg-card p-4"><div className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</div><div className="mt-2 font-mono text-2xl font-medium tabular-nums">{value}</div></div>;
}

export function OperationalDrilldown({ metric, onBack, notify, audit }: { metric: MetricView; onBack: () => void; notify: (message: string) => void; audit: Audit }) {
  const spec = specs[metric];
  const [filter, setFilter] = useState<string>(spec.filters[0]);
  const [selected, setSelected] = useState(0);
  const setActiveFilter = (value: string) => { setFilter(value); audit("dashboard_metric_filter_applied", `${metric} · ${value}`); };
  const action = (label: string) => { notify(`${label} opened`); audit("dashboard_metric_cta_clicked", `${metric} · ${label}`); };
  const rows = metric === "admissions" ? admissionRows : metric === "transfers" ? transferRows : deviceRows;

  return <>
    <div className="border-b border-border bg-card px-5 py-5 lg:px-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 px-0"><ChevronLeft />Network command</Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-1 text-[11px] font-semibold uppercase text-primary">Network command / {spec.title}</div><h1 className="font-display text-3xl font-semibold">{spec.title}</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{spec.summary} · Sunday 13 September 2026 · 08:49 AEST · Morning shift</p></div><Button onClick={() => action(spec.primary)}>{spec.primary}<ChevronRight /></Button></div>
    </div>
    <div className="space-y-5 p-5 lg:p-8">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label={`${spec.title} summary`}><Summary label={spec.unit} value={spec.total}/>{spec.stats.map(([label,value])=><Summary key={label} label={label} value={value}/>)}</section>
      <div className="flex flex-wrap items-center gap-2"><Filter className="size-4 text-muted-foreground"/>{spec.filters.map(item=><Button key={item} size="sm" variant={filter===item?"default":"outline"} onClick={()=>setActiveFilter(item)}>{item}</Button>)}</div>
      {metric === "pressure" ? <PressureView filter={filter} action={action}/> : metric === "forecast" ? <ForecastView filter={filter} setFilter={setActiveFilter} action={action}/> : <Worklist metric={metric} rows={rows} selected={selected} setSelected={setSelected} action={action}/>} 
    </div>
  </>;
}

function Worklist({metric,rows,selected,setSelected,action}:{metric:"admissions"|"transfers"|"devices";rows:string[][];selected:number;setSelected:(value:number)=>void;action:(label:string)=>void}) {
  const headers = metric==="admissions"?["Patient","Region","Pathway","Referral","Next action","Owner","Waiting"]:metric==="transfers"?["Patient","State","Reason","Destination","Status","ETA","Owner"]:["Patient","Patient state","Device","Issue","Data age","Next action","Owner"];
  const detailTitle = metric==="admissions"?"Intake detail":metric==="transfers"?"Transfer detail":"Device concern detail";
  const actions = metric==="admissions"?["Complete eligibility checklist","Assign device kit","Activate home admission"]:metric==="transfers"?["Update transport status","Grant emergency access","Confirm arrival"]:["Request repeat observation","Contact patient/caregiver","Dispatch replacement"];
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="overflow-x-auto border border-border bg-card"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-muted text-[11px] uppercase text-muted-foreground"><tr>{headers.map((header,i)=><th key={header} className={cn("py-3",i===0&&"px-4")}>{header}</th>)}<th><span className="sr-only">Open</span></th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.join()} className={cn("h-16 border-t border-border hover:bg-accent",selected===index&&"bg-accent")}><td className="px-4 font-semibold">{row[0]}</td>{row.slice(1).map(cell=><td key={cell} className="text-xs">{cell}</td>)}<td><Button variant="ghost" size="icon" aria-label={`Open ${row[0]}`} onClick={()=>setSelected(index)}><ChevronRight/></Button></td></tr>)}</tbody></table></div><aside className="border border-border bg-card p-4"><h2 className="font-semibold">{detailTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{rows[selected][0]} · selected from current worklist</p><div className="my-4 border-y border-border py-3 text-sm"><div className="flex justify-between py-1"><span className="text-muted-foreground">Owner</span><strong>{rows[selected][6]}</strong></div><div className="flex justify-between py-1"><span className="text-muted-foreground">Audit history</span><strong>4 events</strong></div><div className="flex justify-between py-1"><span className="text-muted-foreground">Last updated</span><strong className="font-mono">08:48</strong></div></div>{actions.map((label,i)=><Button key={label} variant={i===0?"default":"outline"} className="mb-2 w-full" onClick={()=>action(label)}>{label}</Button>)}{metric==="devices"&&<p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Resolving this device concern will not close any linked clinical alert.</p>}</aside></div>;
}

function PressureView({filter,action}:{filter:string;action:(label:string)=>void}) {
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="overflow-x-auto border border-border bg-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted text-[11px] uppercase text-muted-foreground"><tr><th className="px-4 py-3">Region</th><th>Active</th><th>Review</th><th>Rapid</th><th>No data</th><th>Admissions</th><th>Pressure</th></tr></thead><tbody>{regions.map(region=><tr key={region.name} className="h-14 border-t border-border"><td className="px-4 font-semibold">{region.name}</td><td className="font-mono">{region.active.toLocaleString()}</td><td className="font-mono">{region.review}</td><td className="font-mono">{region.rapid}</td><td className="font-mono">{region.nodata}</td><td className="font-mono">{region.admissionsPending}</td><td><span className={cn("border px-2 py-1 font-mono text-xs",region.pressure>=85?"border-review bg-review-soft text-review":"border-border")}>{region.pressure}%</span></td></tr>)}</tbody></table></div><aside className="space-y-4"><div className="border border-border bg-card p-4"><div className="flex items-center gap-2"><Users className="size-4 text-primary"/><h2 className="font-semibold">{filter==="Staffing"?"Staffing headroom":"Current bottlenecks"}</h2></div>{[["Visiting nurses","Limited"],["Physicians","Adequate"],["Device support","Strained"],["Intake coordinators","Limited"]].map(([k,v])=><div key={k} className="flex justify-between border-t border-border py-2 text-sm first:mt-3"><span>{k}</span><strong>{v}</strong></div>)}</div>{["Open affected team queue","Prioritise likely discharges","Trigger surge protocol"].map(label=><Button key={label} variant="outline" className="w-full" onClick={()=>action(label)}>{label}</Button>)}</aside></div>;
}

function ForecastView({filter,setFilter,action}:{filter:string;setFilter:(value:string)=>void;action:(label:string)=>void}) {
  const total=filter==="Next 24 hours"?network.workload.h24:filter==="Next 8 hours"?network.workload.h8:network.workload.h4;
  const bars=[68,82,59,91,76,63,88,71];
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><section className="border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Demand and staffed capacity</h2><p className="text-xs text-muted-foreground">{filter} · {total.toLocaleString()} forecast work items</p></div><Activity className="size-5 text-primary"/></div><div className="mt-8 flex h-56 items-end gap-3 border-b border-l-border px-2">{bars.map((height,index)=><div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="relative flex h-44 w-full items-end bg-muted"><div className="w-full bg-primary" style={{height:`${height}%`}}/><div className="absolute inset-x-0 border-t-2 border-review" style={{bottom:"72%"}}/></div><span className="font-mono text-[10px]">{9+index}:00</span></div>)}</div><div className="mt-4 flex gap-5 text-xs"><span className="flex items-center gap-2"><span className="size-2 bg-primary"/>Forecast demand</span><span className="flex items-center gap-2"><span className="h-0.5 w-3 bg-review"/>Staffed capacity</span></div></section><aside className="space-y-4"><div className="border border-machine bg-machine-soft p-4"><div className="flex items-center gap-2 text-machine"><Radio className="size-4"/><span className="text-xs font-semibold uppercase">Forecast · moderate confidence</span></div><h2 className="mt-3 font-semibold">Main workload drivers</h2>{[["Respiratory pathways","28%"],["Scheduled observations","24%"],["No-data follow-up","16%"],["Admission activation","12%"]].map(([k,v])=><div key={k} className="flex justify-between border-t border-machine/30 py-2 text-sm first:mt-3"><span>{k}</span><strong>{v}</strong></div>)}</div>{["Open forecasted high-risk cohort","Compare surge scenario","Create staffing request"].map(label=><Button key={label} variant="outline" className="w-full" onClick={()=>action(label)}>{label}</Button>)}</aside></div>;
}