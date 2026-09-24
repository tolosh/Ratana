// Client-safe scribe configuration: templates, consent script, plans and labels.

export const CONSENT_SCRIPT_VERSION = "consent-v1.0";
export const CONSENT_SCRIPT =
  "I use Rātana Scribe to record our conversation so I can write accurate notes. The recording is transcribed, used to draft my note, and deleted once I sign the note. I review and sign everything myself. You can ask me to stop or pause the recording at any time. Are you happy for me to record?";

export type TemplateDef = { id: string; name: string; summary: string; sections: string[]; rules: string[] };

export const TEMPLATES: TemplateDef[] = [
  {
    id: "soap",
    name: "SOAP",
    summary: "Subjective, objective, assessment, plan.",
    sections: ["Subjective", "Objective", "Assessment", "Plan"],
    rules: [
      "Assessment records only what the clinician said. Leave it empty if the clinician gave no assessment.",
      "List medications with dose, route and frequency exactly as stated.",
    ],
  },
  {
    id: "gp_consult",
    name: "GP consult",
    summary: "Reason for visit, history, examination, management, follow-up.",
    sections: ["Reason for visit", "History", "Examination", "Management", "Follow-up"],
    rules: ["Record safety-netting advice under Follow-up when it was given."],
  },
  {
    id: "hith_home_visit",
    name: "HITH nursing home visit",
    summary: "Visit purpose, observations, patient and carer report, interventions, plan.",
    sections: ["Visit purpose", "Observations", "Patient and carer report", "Interventions", "Plan and escalation"],
    rules: ["Record observation values with units and the time stated.", "Record the escalation decision only if one was stated."],
  },
];

export const templateById = (id: string): TemplateDef => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;

export const CONTEXT_LABELS: Record<string, string> = {
  in_person: "In person",
  telehealth: "Telehealth",
  home_visit: "Home visit",
  dictation: "Dictation",
};

export const STATUS_LABELS: Record<string, string> = {
  consent_pending: "Consent pending",
  recording: "Recording",
  drafting: "Drafting",
  review: "Ready for review",
  signed: "Signed",
  draft_failed: "Draft not generated",
};

export const SPEAKER_LABELS: Record<string, string> = {
  unlabelled: "Speaker",
  clinician: "Clinician",
  patient: "Patient",
  carer: "Carer",
  other: "Other",
};

export type PlanId = "free" | "clinician" | "practice" | "enterprise";
export const PLANS: Record<PlanId, { name: string; price: string; lettersPerMonth: number | null; seats: string; summary: string }> = {
  free: { name: "Free", price: "A$0", lettersPerMonth: 10, seats: "1 clinician", summary: "Unlimited transcription, standard templates, 10 letters a month." },
  clinician: { name: "Clinician", price: "A$99 / month", lettersPerMonth: null, seats: "1 clinician", summary: "Unlimited letters, personal templates, patient summaries." },
  practice: { name: "Practice", price: "A$89 / clinician seat / month", lettersPerMonth: null, seats: "Per clinician seat, assistants free", summary: "Shared templates, practice admin, HITH module available." },
  enterprise: { name: "Enterprise", price: "Contract", lettersPerMonth: null, seats: "Contract", summary: "Health services and networks." },
};

export const CHUNK_SECONDS = 5;

/** Seconds offset → "mm:ss" */
export function offsetLabel(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Absolute 24-hour timestamp, en-AU */
export function clock(ts: string | null | undefined) {
  if (!ts) return "No data";
  const d = new Date(ts);
  return d.toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}
