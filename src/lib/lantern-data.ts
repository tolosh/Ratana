export type Signal = "stable" | "review" | "rapid" | "nodata";

export interface Patient {
  id: string; name: string; age: number; pronouns: string; diagnosis: string; pathway: string;
  status: Signal; score: number; region: string; team: string; owner: string; observed: string;
  reason: string; hr?: number; spo2?: number; rr?: number; bp?: number; temp?: number;
}

export const primaryPatient: Patient = { id:"pat-1001", name:"Mara Ellis", age:72, pronouns:"she/her", diagnosis:"COPD exacerbation", pathway:"Respiratory virtual ward", status:"rapid", score:82, region:"South Metro", team:"Respiratory Blue", owner:"Dr Asha Rao", observed:"08:42 AEST", reason:"SpO₂ fell 6 points in 45 min; work of breathing increased", hr:112, spo2:88, rr:28, bp:104, temp:37.8 };

export const patients: Patient[] = [
  primaryPatient,
  { id:"pat-1002", name:"John Bell", age:81, pronouns:"he/him", diagnosis:"Heart failure", pathway:"Cardiac virtual ward", status:"review", score:61, region:"Central", team:"Cardiac West", owner:"RN Mia Chen", observed:"08:36 AEST", reason:"Weight +1.8 kg in 48 h with increasing breathlessness", hr:96, spo2:93, rr:22, bp:146, temp:36.7 },
  { id:"pat-1003", name:"Ana Santos", age:58, pronouns:"she/her", diagnosis:"Post-operative recovery", pathway:"Surgical step-down", status:"review", score:54, region:"North Metro", team:"Surgical North", owner:"RN Leo Morgan", observed:"08:31 AEST", reason:"Temperature trend and wound pain need review", hr:102, spo2:96, rr:20, bp:118, temp:38.1 },
  { id:"pat-1004", name:"David Okafor", age:67, pronouns:"he/him", diagnosis:"Cellulitis", pathway:"IV antibiotics at home", status:"nodata", score:47, region:"Regional", team:"Regional Acute", owner:"RN Priya Nair", observed:"06:10 AEST", reason:"No observations received for 2 h 32 min" },
  { id:"pat-1005", name:"Mei Tan", age:76, pronouns:"she/her", diagnosis:"Community-acquired pneumonia", pathway:"Respiratory virtual ward", status:"stable", score:24, region:"Coastal", team:"Respiratory Coast", owner:"RN Sam Webb", observed:"08:39 AEST", reason:"Observations within pathway range", hr:82, spo2:96, rr:18, bp:126, temp:36.8 },
];

export const regions = [
  {name:"North Metro",capacity:920,occupied:836,review:89,rapid:12,nodata:24,load:82},
  {name:"South Metro",capacity:1080,occupied:987,review:105,rapid:14,nodata:24,load:91},
  {name:"Coastal",capacity:760,occupied:672,review:71,rapid:9,nodata:21,load:74},
  {name:"Central",capacity:980,occupied:901,review:101,rapid:15,nodata:24,load:88},
  {name:"Western",capacity:680,occupied:601,review:60,rapid:7,nodata:18,load:69},
  {name:"Regional",capacity:580,occupied:503,review:57,rapid:6,nodata:15,load:77},
];

export const scenarios = [
  ["Respiratory deterioration","Mara Ellis","Falling oxygen saturation progresses through review, escalation and transfer.","12 min"],
  ["Heart-failure drift","John Bell","Weight and symptom trend creates a clinical review task.","8 min"],
  ["Post-operative infection","Ana Santos","Temperature and wound symptoms prompt pathway review.","7 min"],
  ["Missing data + device failure","David Okafor","Silence becomes an explicit No data safety state.","6 min"],
  ["False low SpO₂ artifact","Mei Tan","Low-quality signal requests repeat measurement instead of transfer.","5 min"],
  ["Patient help request","Mei Tan","Patient requests help and receives a named callback commitment.","4 min"],
  ["Discharge readiness","Mei Tan","Advisory readiness is reviewed and confirmed by a clinician.","6 min"],
];

export const roles = ["Network controller","Visiting nurse","Consultant","Operations manager","Governance lead","Workforce administrator","Device support","Emergency services","Patient / carer"];

export const statusMeta: Record<Signal,{label:string;glyph:string;classes:string}> = {
  stable:{label:"Stable",glyph:"●",classes:"text-stable bg-stable-soft border-stable"},
  review:{label:"Clinical review",glyph:"▲",classes:"text-review bg-review-soft border-review"},
  rapid:{label:"Rapid response",glyph:"⬢",classes:"text-rapid bg-rapid-soft border-rapid"},
  nodata:{label:"No data",glyph:"◌",classes:"text-nodata bg-nodata-soft border-nodata signal-hatch"},
};