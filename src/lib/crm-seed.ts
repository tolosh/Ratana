import type {
  Acuity, ClinicalStatus, CrmRecord, EpisodeStatus, Observation, OutcomeStatus,
  RiskLevel, Trajectory,
} from "./crm-data";
import { patients as queuePatients } from "./lantern-data";

/** Deterministic pseudo-random so the synthetic set never shifts between loads. */
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}

function observationSeries(seed: number, base: { spo2: number; hr: number; rr: number; systolic: number; temp: number }, hours = 72): Observation[] {
  const rand = seeded(seed);
  const out: Observation[] = [];
  for (let h = hours; h >= 0; h -= 4) {
    const drift = (rand() - 0.5) * 2;
    out.push({
      at: `${11 + Math.floor((72 - h) / 24)} Sep · ${String(((72 - h) % 24 + 6) % 24).padStart(2, "0")}:00`,
      spo2: Math.round(base.spo2 + drift * 2 - (h < 8 ? 3 : 0)),
      hr: Math.round(base.hr + drift * 6 + (h < 8 ? 8 : 0)),
      rr: Math.round(base.rr + drift * 2 + (h < 8 ? 3 : 0)),
      systolic: Math.round(base.systolic + drift * 8),
      temp: Number((base.temp + drift * 0.3).toFixed(1)),
      quality: rand() > 0.92 ? "Fair" : "Good",
    });
  }
  return out;
}

const now = "14 Sep 2026 · 08:49";

const ratna: CrmRecord = {
  id: "pat-1000", mrn: "MRN-4471902", firstName: "Ratna", lastName: "Whitmore",
  preferredName: "Ratna", dateOfBirth: "1949-04-18", age: 77,
  sex: "Female", gender: "Woman", pronouns: "she/her",
  phone: "+61 400 118 240", email: "ratna.whitmore@example.invalid",
  preferredContactMethod: "PHONE", preferredLanguage: "Tamil", interpreterRequired: true,
  address: { line1: "18 Kestrel Street", line2: "Unit 4", suburbCity: "Ashgrove", stateRegion: "Metro South", postcode: "4060", country: "Australia" },
  region: "Metro South", team: "Respiratory Blue", owner: "Dr Asha Rao",
  presentingCondition: "Infective exacerbation of COPD with hypoxaemia, referred from Metro South ED short-stay unit.",
  clinicalSummary: "77-year-old woman with severe COPD (FEV1 42% predicted) and type 2 diabetes, admitted to Hospital in the Home on 11 September for IV antibiotics, controlled oxygen and daily remote review after a 14-hour ED stay. Responded to nebulised bronchodilators in ED. Home oxygen 1 L/min via concentrator, target saturations 88–92%. Daughter provides overnight support four nights per week.",
  medicalHistory: ["COPD diagnosed 2011, three exacerbations in 12 months", "Type 2 diabetes since 2004, metformin controlled", "Hypertension", "Right total knee replacement 2019", "Ex-smoker, 32 pack-years, ceased 2013"],
  chronicConditions: ["COPD (severe)", "Type 2 diabetes", "Hypertension", "Osteoarthritis"],
  allergies: ["Penicillin — widespread rash 2016", "Adhesive dressings — local irritation"],
  medications: ["Ceftriaxone 1 g IV daily (day 4 of 5)", "Prednisolone 37.5 mg orally daily (day 4 of 5)", "Salbutamol 100 mcg 2 puffs up to four-hourly", "Tiotropium 18 mcg inhaled daily", "Metformin 1 g twice daily", "Perindopril 5 mg daily", "Paracetamol 1 g up to four times daily"],
  functionalStatus: "Independent indoors with a four-wheel walker. Breathless on exertion after 10 metres. No cognitive impairment; abbreviated mental test 10/10. Showers seated with supervision.",
  socialContext: "Lives alone in a ground-floor unit. Daughter Priya stays four nights per week and manages medicines. Community transport for appointments. Meals prepared by family. Tamil-speaking; interpreter booked for all clinical calls.",
  prognosis: "Expected recovery to baseline respiratory function within 5–7 days if oxygenation continues to improve. Ongoing exacerbation risk remains high; readmission risk moderate given social support and adherence.",
  expectedOutcome: "Complete IV antibiotic course at home, return to baseline saturations of 92% on room air by 17 September, and discharge to GP and community respiratory nursing with a reviewed action plan.",
  currentTreatment: "Day 4 of 5 IV ceftriaxone via peripheral cannula, oral prednisolone, controlled home oxygen 1 L/min, four-hourly observations, daily virtual review and alternate-day nursing home visit.",
  homeAccessNotes: "Ground-floor unit, front ramp. Key safe to the right of the door, code held by care coordinator. Small dog secured on arrival. Street parking on Kestrel Street.",
  communicationInstructions: "Call the landline first, then daughter Priya. Book a Tamil interpreter for every clinical call. Avoid calls before 08:00 or after 20:00.",
  episodes: [
    { id: "epi-2201", admissionDate: "11 Sep 2026", expectedDischargeDate: "17 Sep 2026", referralSource: "Emergency department", referringClinician: "Dr Nadia Osman", referringOrganisation: "Metro South Hospital ED", primaryDiagnosis: "Infective exacerbation of COPD", secondaryDiagnoses: ["Type 2 diabetes", "Hypertension"], admissionReason: "IV antibiotics, controlled oxygen and daily review for an infective COPD exacerbation", homeCareRationale: "Physiologically stable after ED treatment, suitable home environment, family support and reliable monitoring", acuity: "HIGH", status: "ACTIVE", pathway: "Respiratory virtual ward", dayOf: 4, plannedDays: 6 },
    { id: "epi-2118", admissionDate: "02 Mar 2026", actualDischargeDate: "08 Mar 2026", referralSource: "General practice", referringClinician: "Dr Helen Byrne", referringOrganisation: "Ashgrove Family Practice", primaryDiagnosis: "COPD exacerbation", secondaryDiagnoses: ["Type 2 diabetes"], admissionReason: "Oral steroids and monitoring after a moderate exacerbation", acuity: "MODERATE", status: "CLOSED", pathway: "Respiratory virtual ward", dayOf: 6, plannedDays: 6 },
  ],
  state: {
    clinicalStatus: "WATCH", trajectory: "IMPROVING", riskLevel: "HIGH", outcomeStatus: "ON_TRACK",
    activeAlertCount: 1, lastObservationAt: "14 Sep · 08:42", lastClinicalReviewAt: "14 Sep · 07:30",
    nextAction: "Virtual respiratory review with Dr Asha Rao", nextActionAt: "14 Sep · 10:30",
    deviceConcern: false, noData: false, dischargeLikely: false,
  },
  contacts: [
    { id: "con-01", name: "Priya Whitmore", relationship: "Daughter", phone: "+61 411 220 118", email: "priya.w@example.invalid", isNextOfKin: true, isEmergencyContact: true, isCaregiverProxy: true, contactInstructions: "Primary decision support. Works until 17:00; text before calling during work hours." },
    { id: "con-02", name: "Suresh Whitmore", relationship: "Son", phone: "+61 422 771 903", isNextOfKin: false, isEmergencyContact: true, isCaregiverProxy: false, contactInstructions: "Lives interstate. Call only if Priya is unreachable." },
    { id: "con-03", name: "Ashgrove Family Practice", relationship: "General practice", phone: "+61 7 3355 0100", email: "reception@ashgrovefp.example.invalid", isNextOfKin: false, isEmergencyContact: false, isCaregiverProxy: false, contactInstructions: "Dr Helen Byrne is the usual GP. Fax-free; send secure messages." },
  ],
  careTeam: [
    { id: "ct-01", name: "Dr Asha Rao", role: "CONSULTANT", organisation: "Metro South Respiratory", phone: "+61 7 3346 1180", primary: true },
    { id: "ct-02", name: "Mia Chen", role: "NURSE", organisation: "Respiratory Blue home team", phone: "+61 401 553 210", primary: false },
    { id: "ct-03", name: "Luca Patel", role: "CARE_COORDINATOR", organisation: "Hospital in the Home hub", phone: "+61 7 3346 1195", primary: false },
    { id: "ct-04", name: "Dr Helen Byrne", role: "GP", organisation: "Ashgrove Family Practice", phone: "+61 7 3355 0100", primary: false },
    { id: "ct-05", name: "Dr Nadia Osman", role: "REFERRER", organisation: "Metro South Hospital ED", primary: false },
    { id: "ct-06", name: "Jamie Fox", role: "PHARMACIST", organisation: "Metro South Hub pharmacy", phone: "+61 7 3346 1120", primary: false },
  ],
  carePlan: {
    goals: ["Complete a five-day IV antibiotic course at home without readmission", "Return to baseline oxygen saturations of 92% on room air", "Maintain independent mobility indoors with the walker", "Revised written COPD action plan understood by Ratna and Priya before discharge"],
    medicationPlan: ["IV ceftriaxone 1 g daily until 15 September, administered on nursing visits", "Prednisolone 37.5 mg daily until 15 September, then stop", "Continue regular inhalers; review technique at each visit", "Blood glucose four times daily while on steroids"],
    monitoringRequirements: ["Oxygen saturation, respiratory rate, heart rate, blood pressure and temperature four-hourly while awake", "Symptom check twice daily in the patient app", "Blood glucose four times daily", "Weight each morning"],
    plannedHomeVisits: ["14 Sep · 13:00 · Mia Chen · IV dose and cannula check", "15 Sep · 13:00 · Mia Chen · final IV dose and cannula removal", "17 Sep · 11:00 · Mia Chen · discharge review and equipment collection"],
    plannedVirtualReviews: ["14 Sep · 10:30 · Dr Asha Rao", "15 Sep · 10:30 · Dr Asha Rao", "16 Sep · 10:30 · registrar review"],
    investigations: ["Repeat full blood count and CRP on 15 September", "Chest radiograph only if fever persists beyond 15 September"],
    alliedHealth: ["Physiotherapy breathing technique review 15 September", "Dietitian phone review for steroid-related glucose control"],
    escalationCriteria: ["Oxygen saturation below 88% on prescribed oxygen for more than 10 minutes", "Respiratory rate above 26 per minute at rest", "New confusion, chest pain or inability to speak in full sentences", "Temperature above 38.5 °C after 15 September", "Two consecutive missed observation windows"],
    emergencyInstructions: "Press \"I need help now\" in the patient app or call the 24-hour Hospital in the Home line. For severe breathlessness, chest pain or collapse, call 000 first and state that the patient is enrolled in Hospital in the Home under Metro South.",
    dischargeCriteria: [
      { text: "IV antibiotic course completed", met: false },
      { text: "Saturations 92% or above on room air for 24 hours", met: false },
      { text: "Afebrile for 48 hours", met: true },
      { text: "Independent with inhaler technique", met: true },
      { text: "Written action plan reviewed with patient and carer", met: false },
      { text: "Equipment return arranged", met: false },
    ],
  },
  monitoring: {
    parameters: ["Oxygen saturation", "Respiratory rate", "Heart rate", "Blood pressure", "Temperature", "Blood glucose", "Weight"],
    frequency: "Four-hourly while awake, plus patient-initiated readings",
    devices: ["Pulse oximeter LN-SP02-0418 (paired 10 Sep)", "Blood pressure cuff LN-BP-1174", "Tympanic thermometer LN-TMP-0092", "Oxygen concentrator OC-5521"],
    thresholds: [
      { parameter: "Oxygen saturation", lower: "88 %", upper: "94 %" },
      { parameter: "Respiratory rate", lower: "12 /min", upper: "24 /min" },
      { parameter: "Heart rate", lower: "55 bpm", upper: "110 bpm" },
      { parameter: "Systolic blood pressure", lower: "100 mmHg", upper: "165 mmHg" },
      { parameter: "Temperature", lower: "35.5 °C", upper: "38.0 °C" },
    ],
    missingDataRule: "No observation received within 2 hours of a scheduled window raises an explicit No data safety state; it is never treated as stable.",
    deviceQualityNote: "Two low-perfusion readings on 12 September were marked fair quality and repeated rather than escalated.",
  },
  observations: observationSeries(7, { spo2: 92, hr: 88, rr: 20, systolic: 132, temp: 36.9 }),
  notes: [
    { id: "note-01", episodeId: "epi-2201", type: "DOCTOR_REVIEW", body: "Virtual review with interpreter. Less breathless than yesterday, sputum volume reduced and now mucoid. Saturations 92% on 1 L/min. Continue current plan; expect to stop IV after tomorrow's dose. Steroid-related glucose rise discussed, dietitian to call.", author: "Dr Asha Rao", authorRole: "Consultant", createdAt: "14 Sep · 07:30" },
    { id: "note-02", episodeId: "epi-2201", type: "NURSING", body: "Cannula site clean and dry, no phlebitis. IV ceftriaxone given at 13:10. Inhaler technique reviewed with daughter present; good coordination. Glucose 11.2 mmol/L post lunch, recorded for medical review.", author: "Mia Chen", authorRole: "Visiting nurse", createdAt: "13 Sep · 13:40" },
    { id: "note-03", episodeId: "epi-2201", type: "ESCALATION", body: "Saturation fell to 86% for 12 minutes at 21:05. Patient contacted, seated upright and oxygen checked — concentrator tubing was kinked. Repeat saturation 91%. Consultant informed; no transfer required. Device support notified.", author: "Sam Webb", authorRole: "Night nurse", createdAt: "12 Sep · 21:25", linkedAlertId: "ALT-20355" },
    { id: "note-04", episodeId: "epi-2201", type: "FAMILY_COMMUNICATION", body: "Spoke with Priya via interpreter. Explained the expected discharge date and the plan for the final IV dose. She will be present for the 15 September visit.", author: "Luca Patel", authorRole: "Care coordinator", createdAt: "12 Sep · 16:05" },
    { id: "note-05", episodeId: "epi-2201", type: "CLINICAL_ASSESSMENT", body: "Admission assessment. Home environment suitable, ground-floor access, working smoke alarms. Oxygen safety discussed. Baseline observations recorded, monitoring plan and escalation criteria explained through an interpreter.", author: "Mia Chen", authorRole: "Visiting nurse", createdAt: "11 Sep · 14:20" },
  ],
  tasks: [
    { id: "task-01", episodeId: "epi-2201", title: "Virtual respiratory review with interpreter", type: "CLINICAL_REVIEW", status: "OPEN", priority: "HIGH", owner: "Dr Asha Rao", dueAt: "14 Sep · 10:30", createdAt: "13 Sep · 10:40" },
    { id: "task-02", episodeId: "epi-2201", title: "Home visit for IV dose and cannula check", type: "HOME_VISIT", status: "OPEN", priority: "HIGH", owner: "Mia Chen", dueAt: "14 Sep · 13:00", createdAt: "13 Sep · 13:45" },
    { id: "task-03", episodeId: "epi-2201", title: "Dietitian phone review for steroid glucose control", type: "PHONE_CALL", status: "IN_PROGRESS", priority: "MEDIUM", owner: "Luca Patel", dueAt: "14 Sep · 15:00", createdAt: "13 Sep · 14:10" },
    { id: "task-04", episodeId: "epi-2201", title: "Confirm concentrator tubing replaced", type: "DEVICE_SUPPORT", status: "DONE", priority: "HIGH", owner: "Amir Haddad", dueAt: "13 Sep · 09:00", createdAt: "12 Sep · 21:30" },
    { id: "task-05", episodeId: "epi-2201", title: "Prepare written COPD action plan for discharge", type: "DISCHARGE", status: "OPEN", priority: "MEDIUM", owner: "Luca Patel", dueAt: "16 Sep · 12:00", createdAt: "12 Sep · 16:20" },
  ],
  communications: [
    { id: "comm-01", direction: "OUTBOUND", channel: "VIDEO", participants: "Ratna Whitmore, Priya Whitmore, Tamil interpreter", summary: "Daily virtual review; symptoms and oxygen use discussed.", outcome: "Plan unchanged; review again tomorrow", createdBy: "Dr Asha Rao", createdAt: "14 Sep · 07:30" },
    { id: "comm-02", direction: "INBOUND", channel: "PHONE", participants: "Priya Whitmore", summary: "Daughter asked whether the oxygen concentrator can be moved to the bedroom overnight.", outcome: "Advised safe placement; device support to confirm cable length", createdBy: "Luca Patel", createdAt: "13 Sep · 18:40" },
    { id: "comm-03", direction: "OUTBOUND", channel: "PHONE", participants: "Ratna Whitmore", summary: "Night call after the low saturation alert; tubing kink identified and corrected.", outcome: "Repeat observation requested and received", createdBy: "Sam Webb", createdAt: "12 Sep · 21:12" },
    { id: "comm-04", direction: "OUTBOUND", channel: "SMS", participants: "Ratna Whitmore", summary: "Reminder for the morning observation window.", outcome: "Observation received 14 minutes later", createdBy: "Rātana reminder service", createdAt: "12 Sep · 08:05" },
  ],
  documents: [
    { id: "doc-01", title: "Emergency department referral", type: "REFERRAL", episodeId: "epi-2201", addedBy: "Dr Nadia Osman", createdAt: "11 Sep · 11:40", note: "Synthetic document placeholder" },
    { id: "doc-02", title: "Hospital in the Home care plan v3", type: "CARE_PLAN", episodeId: "epi-2201", addedBy: "Luca Patel", createdAt: "13 Sep · 09:15", note: "Synthetic document placeholder" },
    { id: "doc-03", title: "Reconciled medication list", type: "MEDICATION_LIST", episodeId: "epi-2201", addedBy: "Jamie Fox", createdAt: "11 Sep · 16:02", note: "Synthetic document placeholder" },
    { id: "doc-04", title: "Full blood count and CRP", type: "PATHOLOGY", episodeId: "epi-2201", addedBy: "Metro South pathology", createdAt: "12 Sep · 07:55", note: "Synthetic result placeholder" },
    { id: "doc-05", title: "Consent to home monitoring", type: "CONSENT", episodeId: "epi-2201", addedBy: "Mia Chen", createdAt: "11 Sep · 14:30", note: "Synthetic document placeholder" },
    { id: "doc-06", title: "March 2026 discharge summary", type: "DISCHARGE_SUMMARY", episodeId: "epi-2118", addedBy: "Dr Asha Rao", createdAt: "08 Mar · 15:10", note: "Synthetic document placeholder" },
  ],
  timeline: [
    { id: "tl-01", type: "OBSERVATION", at: "14 Sep · 08:42", title: "Observation set received", detail: "SpO₂ 92% · RR 20 · HR 88 · 36.9 °C", author: "LN-SP02-0418", episodeId: "epi-2201" },
    { id: "tl-02", type: "REMOTE_REVIEW", at: "14 Sep · 07:30", title: "Virtual respiratory review", detail: "Improving; plan unchanged", author: "Dr Asha Rao", episodeId: "epi-2201" },
    { id: "tl-03", type: "TREATMENT", at: "13 Sep · 13:10", title: "IV ceftriaxone 1 g administered", detail: "Day 3 of 5, cannula site clear", author: "Mia Chen", episodeId: "epi-2201" },
    { id: "tl-04", type: "ALERT", at: "12 Sep · 21:05", title: "Rapid response alert opened", detail: "SpO₂ 86% for 12 minutes", author: "Rātana rules v0.8.3", episodeId: "epi-2201" },
    { id: "tl-05", type: "ESCALATION", at: "12 Sep · 21:25", title: "Alert resolved without transfer", detail: "Concentrator tubing kink corrected", author: "Sam Webb", episodeId: "epi-2201" },
    { id: "tl-06", type: "MEDICATION", at: "11 Sep · 16:02", title: "Medicines reconciled", detail: "Steroid and IV antibiotic course confirmed", author: "Jamie Fox", episodeId: "epi-2201" },
    { id: "tl-07", type: "HOME_VISIT", at: "11 Sep · 14:20", title: "Admission home visit", detail: "Environment suitable; monitoring explained", author: "Mia Chen", episodeId: "epi-2201" },
    { id: "tl-08", type: "DOCUMENT", at: "11 Sep · 11:40", title: "Referral received", detail: "Metro South ED", author: "Dr Nadia Osman", episodeId: "epi-2201" },
  ],
  audit: [
    { id: "aud-01", at: "14 Sep · 07:34", userName: "Dr Asha Rao", action: "UPDATE", entityType: "Expected outcome", entityId: "epi-2201", field: "expectedOutcome", summary: "Expected discharge date confirmed as 17 September" },
    { id: "aud-02", at: "14 Sep · 07:31", userName: "Dr Asha Rao", action: "CREATE", entityType: "Clinical note", entityId: "note-01", summary: "Doctor review note added" },
    { id: "aud-03", at: "13 Sep · 13:41", userName: "Mia Chen", action: "CREATE", entityType: "Clinical note", entityId: "note-02", summary: "Nursing note added" },
    { id: "aud-04", at: "12 Sep · 21:31", userName: "Sam Webb", action: "UPDATE", entityType: "Monitoring plan", entityId: "epi-2201", field: "thresholds", summary: "Oxygen saturation lower threshold reviewed after device fault" },
    { id: "aud-05", at: "11 Sep · 14:22", userName: "Mia Chen", action: "CREATE", entityType: "Care episode", entityId: "epi-2201", summary: "Hospital in the Home episode opened" },
  ],
  createdAt: "02 Mar 2026 · 09:10", updatedAt: now,
};

const lightweight: Array<[string, string, string, string, string, ClinicalStatus, Trajectory, RiskLevel, OutcomeStatus, string, string, string, boolean, boolean, boolean]> = [
  ["pat-1006", "Beatrice", "Nowak", "1951-02-11", "Cellulitis of the lower leg", "STABLE", "IMPROVING", "MEDIUM", "ON_TRACK", "Metro North", "Surgical North", "RN Leo Morgan", false, false, true],
  ["pat-1007", "Tomas", "Iversen", "1943-11-02", "Community-acquired pneumonia", "WATCH", "STABLE", "HIGH", "CONCERN", "Western Region", "Respiratory West", "Dr Kim Larsen", true, false, false],
  ["pat-1008", "Grace", "Adeyemi", "1968-06-24", "Post-operative wound care", "STABLE", "IMPROVING", "LOW", "ON_TRACK", "Metro South", "Surgical South", "RN Nina Cole", false, false, true],
  ["pat-1009", "Hamid", "Rahimi", "1957-09-30", "Heart failure decompensation", "DETERIORATING", "DETERIORATING", "HIGH", "OFF_TRACK", "Metro North", "Cardiac West", "Dr Ivy Chan", false, false, false],
  ["pat-1010", "Elsie", "Bramwell", "1936-01-15", "Urinary tract infection", "WATCH", "UNKNOWN", "MEDIUM", "CONCERN", "Regional Coastal", "Regional Acute", "RN Sam Webb", true, true, false],
  ["pat-1011", "Ngaire", "Paora", "1962-04-08", "Cellulitis with IV antibiotics", "STABLE", "STABLE", "LOW", "ON_TRACK", "Regional Inland", "Regional Acute", "RN Priya Nair", false, false, false],
  ["pat-1012", "Victor", "Kowalczyk", "1949-12-19", "COPD exacerbation", "WATCH", "IMPROVING", "HIGH", "ON_TRACK", "Metro South", "Respiratory Blue", "Dr Asha Rao", false, false, false],
  ["pat-1013", "Adaeze", "Obi", "1974-07-21", "Pyelonephritis", "STABLE", "IMPROVING", "MEDIUM", "ON_TRACK", "Metro North", "Regional Acute", "RN Mia Chen", false, false, true],
  ["pat-1014", "Rowan", "Fitzgerald", "1955-03-05", "Diabetic foot infection", "WATCH", "STABLE", "HIGH", "CONCERN", "Western Region", "Surgical West", "Dr Owen Reid", true, false, false],
  ["pat-1015", "Sunila", "Perera", "1946-08-27", "Heart failure monitoring", "STABLE", "STABLE", "MEDIUM", "ON_TRACK", "Hospital Partner Network", "Cardiac East", "RN Jo Baker", false, true, false],
  ["pat-1016", "Angus", "MacLeod", "1939-05-14", "Post-operative recovery", "STABLE", "IMPROVING", "LOW", "ACHIEVED", "Regional Coastal", "Surgical Coast", "RN Tia Brooks", false, false, true],
  ["pat-1017", "Fatima", "Al-Hassan", "1971-10-09", "Cellulitis of the forearm", "STABLE", "IMPROVING", "LOW", "ON_TRACK", "Metro North", "Regional Acute", "RN Leo Morgan", false, false, false],
  ["pat-1018", "Dermot", "Keane", "1952-02-28", "COPD with home oxygen", "CRITICAL", "DETERIORATING", "CRITICAL", "OFF_TRACK", "Metro South", "Respiratory Blue", "Dr Asha Rao", true, false, false],
  ["pat-1019", "Wiremu", "Tane", "1965-11-16", "Pneumonia recovery", "STABLE", "IMPROVING", "MEDIUM", "ON_TRACK", "Regional Inland", "Respiratory Inland", "RN Priya Nair", false, true, false],
  ["pat-1020", "Odette", "Laurent", "1958-06-03", "Post-operative infection", "WATCH", "STABLE", "MEDIUM", "CONCERN", "Western Region", "Surgical West", "RN Nina Cole", false, true, false],
  ["pat-1021", "Hector", "Villanueva", "1944-09-12", "Heart failure decompensation", "WATCH", "IMPROVING", "HIGH", "ON_TRACK", "Hospital Partner Network", "Cardiac East", "Dr Ivy Chan", false, false, false],
  ["pat-1022", "Marama", "Hemi", "1980-01-25", "Complex wound management", "STABLE", "STABLE", "LOW", "ON_TRACK", "Regional Coastal", "Surgical Coast", "RN Tia Brooks", false, false, true],
  ["pat-1023", "Stefan", "Novotny", "1948-04-30", "COPD exacerbation", "WATCH", "UNKNOWN", "HIGH", "CONCERN", "Metro North", "Respiratory North", "Dr Kim Larsen", true, true, false],
  ["pat-1024", "Yolanda", "Mercado", "1953-12-07", "Cellulitis with IV antibiotics", "STABLE", "IMPROVING", "MEDIUM", "ON_TRACK", "Metro South", "Regional Acute", "RN Jo Baker", false, false, false],
  ["pat-1025", "Callum", "Ferris", "1960-07-18", "Pneumonia with hypoxaemia", "DETERIORATING", "DETERIORATING", "HIGH", "OFF_TRACK", "Western Region", "Respiratory West", "Dr Owen Reid", false, false, false],
];

function ageFrom(dob: string) { return 2026 - Number(dob.slice(0, 4)); }

function lightRecord(row: (typeof lightweight)[number], index: number): CrmRecord {
  const [id, firstName, lastName, dob, diagnosis, clinicalStatus, trajectory, riskLevel, outcomeStatus, region, team, owner, deviceConcern, noData, dischargeLikely] = row;
  const acuity: Acuity = riskLevel === "CRITICAL" ? "CRITICAL" : riskLevel === "HIGH" ? "HIGH" : riskLevel === "MEDIUM" ? "MODERATE" : "LOW";
  const status: EpisodeStatus = index > 16 ? (index === 19 ? "DISCHARGED" : "ACTIVE") : "ACTIVE";
  return {
    id, mrn: `MRN-44${71000 + index * 37}`, firstName, lastName, dateOfBirth: dob, age: ageFrom(dob),
    sex: index % 2 === 0 ? "Female" : "Male", gender: index % 2 === 0 ? "Woman" : "Man",
    pronouns: index % 2 === 0 ? "she/her" : "he/him",
    phone: `+61 4${String(10 + index).padStart(2, "0")} ${String(100 + index)} ${String(200 + index)}`,
    preferredContactMethod: index % 3 === 0 ? "SMS" : "PHONE",
    preferredLanguage: "English", interpreterRequired: false,
    address: { line1: `${12 + index} Meridian Street`, suburbCity: region, stateRegion: region, postcode: String(4000 + index), country: "Australia" },
    region, team, owner,
    presentingCondition: `${diagnosis} referred for hospital-level care at home.`,
    clinicalSummary: `${ageFrom(dob)}-year-old receiving ${diagnosis.toLowerCase()} treatment at home under ${team}. Synthetic lightweight record for list and filter testing.`,
    medicalHistory: ["Synthetic history entry"], chronicConditions: ["Synthetic chronic condition"],
    allergies: index % 4 === 0 ? ["Penicillin — rash"] : ["None recorded"],
    medications: ["Synthetic medication A", "Synthetic medication B"],
    functionalStatus: "Independent with supervision", socialContext: index % 4 === 0 ? "Lives with a family caregiver who holds proxy access." : "Lives with partner",
    prognosis: "Expected recovery within the planned episode length.",
    expectedOutcome: "Complete treatment at home and discharge to primary care.",
    currentTreatment: `Active treatment for ${diagnosis.toLowerCase()} with scheduled monitoring.`,
    homeAccessNotes: "Front door access; carer present at visits.",
    communicationInstructions: "Call the mobile number first.",
    episodes: [{
      id: `epi-3${100 + index}`, admissionDate: "10 Sep 2026", expectedDischargeDate: "18 Sep 2026",
      referralSource: index % 3 === 0 ? "General practice" : "Emergency department",
      referringClinician: "Dr Synthetic Referrer", referringOrganisation: `${region} Hospital`,
      primaryDiagnosis: diagnosis, secondaryDiagnoses: ["Hypertension"],
      admissionReason: `Hospital-level treatment for ${diagnosis.toLowerCase()}`,
      acuity, status, pathway: `${team} pathway`, dayOf: 3 + (index % 4), plannedDays: 8,
    }],
    state: {
      clinicalStatus, trajectory, riskLevel, outcomeStatus,
      activeAlertCount: clinicalStatus === "STABLE" ? 0 : 1,
      lastObservationAt: noData ? "14 Sep · 05:10" : "14 Sep · 08:30",
      lastClinicalReviewAt: "13 Sep · 16:00",
      nextAction: clinicalStatus === "STABLE" ? "Routine virtual review" : "Clinical review of observation trend",
      nextActionAt: "14 Sep · 11:00", deviceConcern, noData, dischargeLikely,
    },
    contacts: [{ id: `${id}-con-1`, name: `${firstName === "Beatrice" ? "Anna" : "Chris"} ${lastName}`, relationship: index % 4 === 0 ? "Daughter" : "Partner", phone: "+61 400 000 000", isNextOfKin: true, isEmergencyContact: true, isCaregiverProxy: index % 4 === 0, contactInstructions: "Synthetic contact instructions." }],
    careTeam: [
      { id: `${id}-ct-1`, name: owner, role: owner.startsWith("Dr") ? "CONSULTANT" : "NURSE", organisation: team, primary: true },
      { id: `${id}-ct-2`, name: "Dr Synthetic GP", role: "GP", organisation: "Community practice", primary: false },
    ],
    carePlan: {
      goals: ["Complete treatment at home", "Avoid readmission"],
      medicationPlan: ["Continue prescribed course"], monitoringRequirements: ["Observations four-hourly"],
      plannedHomeVisits: ["15 Sep · 11:00 · nursing visit"], plannedVirtualReviews: ["14 Sep · 11:00 · virtual review"],
      investigations: ["Repeat bloods if fever persists"], alliedHealth: ["None required"],
      escalationCriteria: ["Observations outside pathway range", "Two missed observation windows"],
      emergencyInstructions: "Use the patient app help action or call the 24-hour line.",
      dischargeCriteria: [{ text: "Treatment course complete", met: false }, { text: "Observations stable 24 hours", met: dischargeLikely }],
    },
    monitoring: {
      parameters: ["Oxygen saturation", "Heart rate", "Temperature"], frequency: "Four-hourly while awake",
      devices: [`Pulse oximeter LN-SP02-${1000 + index}`],
      thresholds: [
        { parameter: "Oxygen saturation", lower: "90 %", upper: "100 %" },
        { parameter: "Heart rate", lower: "50 bpm", upper: "110 bpm" },
        { parameter: "Temperature", lower: "35.5 °C", upper: "38.0 °C" },
      ],
      missingDataRule: "Missing observations raise an explicit No data state.",
      deviceQualityNote: deviceConcern ? "Device concern open; readings intermittent." : "No device quality issues recorded.",
    },
    observations: observationSeries(index + 11, { spo2: 95, hr: 84, rr: 18, systolic: 128, temp: 36.8 }, 24),
    notes: index % 3 === 0 ? [{ id: `${id}-note-1`, episodeId: `epi-3${100 + index}`, type: "NURSING", body: "Routine nursing review; observations within pathway range and treatment tolerated.", author: owner, authorRole: "Clinician", createdAt: "13 Sep · 15:20" }] : [],
    tasks: [{ id: `${id}-task-1`, episodeId: `epi-3${100 + index}`, title: "Virtual review", type: "CLINICAL_REVIEW", status: "OPEN", priority: clinicalStatus === "STABLE" ? "MEDIUM" : "HIGH", owner, dueAt: "14 Sep · 11:00", createdAt: "13 Sep · 16:00" }],
    communications: [{ id: `${id}-comm-1`, direction: "OUTBOUND", channel: "PHONE", participants: `${firstName} ${lastName}`, summary: "Daily check-in call.", outcome: "No new concerns", createdBy: owner, createdAt: "13 Sep · 09:15" }],
    documents: [{ id: `${id}-doc-1`, title: "Referral", type: "REFERRAL", episodeId: `epi-3${100 + index}`, addedBy: "Dr Synthetic Referrer", createdAt: "10 Sep · 10:00", note: "Synthetic document placeholder" }],
    timeline: [
      { id: `${id}-tl-1`, type: "OBSERVATION", at: "14 Sep · 08:30", title: "Observation set received", author: `LN-SP02-${1000 + index}` },
      { id: `${id}-tl-2`, type: "CLINICAL_REVIEW", at: "13 Sep · 16:00", title: "Clinical review completed", author: owner },
    ],
    audit: [{ id: `${id}-aud-1`, at: "10 Sep · 10:05", userName: owner, action: "CREATE", entityType: "Care episode", entityId: `epi-3${100 + index}`, summary: "Hospital in the Home episode opened" }],
    createdAt: "10 Sep 2026 · 10:00", updatedAt: "14 Sep 2026 · 08:30",
  };
}

/** Existing queue patients get CRM records so the dashboard and CRM stay consistent. */
function fromQueue(index: number): CrmRecord {
  const p = queuePatients[index]!;
  const [firstName, ...rest] = p.name.split(" ");
  const clinicalStatus: ClinicalStatus = p.status === "rapid" ? "DETERIORATING" : p.status === "review" ? "WATCH" : "STABLE";
  const base = lightRecord(
    [p.id, firstName!, rest.join(" "), `${2026 - p.age}-05-12`, p.diagnosis, clinicalStatus,
      p.status === "rapid" ? "DETERIORATING" : "STABLE",
      p.status === "rapid" ? "HIGH" : p.status === "review" ? "MEDIUM" : "LOW",
      p.status === "rapid" ? "OFF_TRACK" : "ON_TRACK",
      p.region, p.team, p.owner, p.status === "nodata", p.status === "nodata", p.status === "stable",
    ], 30 + index,
  );
  return {
    ...base,
    pronouns: p.pronouns,
    episodes: [{ ...base.episodes[0]!, pathway: p.pathway, primaryDiagnosis: p.diagnosis }],
    state: { ...base.state, lastObservationAt: `14 Sep · ${p.observed.slice(0, 5)}`, nextAction: p.reason },
    observations: observationSeries(index + 3, { spo2: p.spo2 ?? 95, hr: p.hr ?? 84, rr: p.rr ?? 18, systolic: p.bp ?? 126, temp: p.temp ?? 36.8 }, 48),
    clinicalSummary: `${p.age}-year-old receiving hospital-level care at home for ${p.diagnosis.toLowerCase()} under ${p.team}. ${p.reason}.`,
  };
}

export function seedRecords(): CrmRecord[] {
  return [
    ratna,
    ...queuePatients.map((_, i) => fromQueue(i)),
    ...lightweight.map(lightRecord),
  ];
}
