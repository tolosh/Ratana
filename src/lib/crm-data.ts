/** Clinical CRM prototype model. All records are synthetic. */

export type ClinicalStatus = "STABLE" | "WATCH" | "DETERIORATING" | "CRITICAL";
export type Trajectory = "IMPROVING" | "STABLE" | "DETERIORATING" | "UNKNOWN";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type OutcomeStatus = "ON_TRACK" | "CONCERN" | "OFF_TRACK" | "ACHIEVED";
export type EpisodeStatus =
  | "PROPOSED" | "ADMITTED" | "ACTIVE" | "ESCALATED"
  | "RETURNED_TO_HOSPITAL" | "DISCHARGED" | "CLOSED";
export type Acuity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface Address {
  line1: string; line2?: string; suburbCity: string;
  stateRegion?: string; postcode?: string; country: string;
}

export interface PatientContact {
  id: string; name: string; relationship: string; phone: string;
  alternatePhone?: string; email?: string;
  isNextOfKin: boolean; isEmergencyContact: boolean;
  isCaregiverProxy: boolean; contactInstructions?: string;
}

export type CareTeamRole =
  | "CONSULTANT" | "DOCTOR" | "NURSE" | "CARE_COORDINATOR"
  | "PHARMACIST" | "ALLIED_HEALTH" | "GP" | "REFERRER" | "DEVICE_SUPPORT" | "OTHER";

export interface CareTeamMember {
  id: string; name: string; role: CareTeamRole; organisation?: string;
  phone?: string; email?: string; primary: boolean;
}

export interface CareEpisode {
  id: string; admissionDate: string; expectedDischargeDate?: string;
  actualDischargeDate?: string; referralSource?: string;
  referringClinician?: string; referringOrganisation?: string;
  primaryDiagnosis: string; secondaryDiagnoses: string[];
  admissionReason: string; homeCareRationale?: string;
  acuity: Acuity; status: EpisodeStatus; pathway: string;
  dayOf: number; plannedDays: number;
}

export type NoteType =
  | "CLINICAL_ASSESSMENT" | "NURSING" | "DOCTOR_REVIEW" | "PHONE_CONTACT"
  | "HOME_VISIT" | "FAMILY_COMMUNICATION" | "MEDICATION_CHANGE"
  | "ESCALATION" | "DISCHARGE" | "GENERAL";

export interface ClinicalNote {
  id: string; episodeId: string; type: NoteType; body: string;
  author: string; authorRole: string; createdAt: string; linkedAlertId?: string;
}

export type TaskType =
  | "CLINICAL_REVIEW" | "HOME_VISIT" | "PHONE_CALL" | "DEVICE_SUPPORT"
  | "OBSERVATION" | "DOCUMENT" | "CARE_PLAN" | "DISCHARGE" | "GENERAL";

export interface CrmTask {
  id: string; episodeId?: string; title: string; type: TaskType;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  owner: string; dueAt: string; createdAt: string;
}

export interface CommunicationEvent {
  id: string; direction: "INBOUND" | "OUTBOUND";
  channel: "PHONE" | "SMS" | "EMAIL" | "APP" | "VIDEO" | "IN_PERSON" | "OTHER";
  participants: string; summary: string; outcome?: string;
  createdBy: string; createdAt: string;
}

export type DocumentType =
  | "REFERRAL" | "DISCHARGE_SUMMARY" | "CARE_PLAN" | "MEDICATION_LIST"
  | "PATHOLOGY" | "IMAGING" | "CONSENT" | "ADVANCE_CARE" | "WOUND_IMAGE" | "OTHER";

export interface CrmDocument {
  id: string; title: string; type: DocumentType; episodeId?: string;
  addedBy: string; createdAt: string; note?: string;
}

export interface CarePlan {
  goals: string[]; medicationPlan: string[]; monitoringRequirements: string[];
  plannedHomeVisits: string[]; plannedVirtualReviews: string[];
  investigations: string[]; alliedHealth: string[];
  escalationCriteria: string[]; emergencyInstructions: string;
  dischargeCriteria: Array<{ text: string; met: boolean }>;
}

export interface MonitoringPlan {
  parameters: string[]; frequency: string; devices: string[];
  thresholds: Array<{ parameter: string; lower: string; upper: string }>;
  missingDataRule: string; deviceQualityNote: string;
}

export interface PatientState {
  clinicalStatus: ClinicalStatus; trajectory: Trajectory; riskLevel: RiskLevel;
  outcomeStatus: OutcomeStatus; activeAlertCount: number;
  lastObservationAt: string; lastClinicalReviewAt: string;
  nextAction: string; nextActionAt: string;
  deviceConcern: boolean; noData: boolean; dischargeLikely: boolean;
}

export type TimelineType =
  | "TREATMENT" | "HOME_VISIT" | "REMOTE_REVIEW" | "ALERT" | "CLINICAL_REVIEW"
  | "MEDICATION" | "OBSERVATION" | "ESCALATION" | "DOCUMENT" | "NOTE"
  | "COMMUNICATION" | "TASK";

export interface TimelineEvent {
  id: string; type: TimelineType; at: string; title: string;
  detail?: string; author: string; episodeId?: string;
}

export interface AuditEvent {
  id: string; at: string; userName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  entityType: string; entityId: string; field?: string; summary: string;
}

export interface Observation {
  at: string; spo2?: number; hr?: number; rr?: number;
  systolic?: number; temp?: number; quality: "Good" | "Fair" | "Poor" | "Missing";
}

export interface CrmRecord {
  id: string; mrn: string; firstName: string; lastName: string;
  preferredName?: string; dateOfBirth: string; age: number;
  sex: string; gender: string; pronouns: string;
  phone: string; email?: string;
  preferredContactMethod: "PHONE" | "SMS" | "EMAIL";
  preferredLanguage: string; interpreterRequired: boolean;
  address: Address;
  region: string; team: string; owner: string;
  presentingCondition: string; clinicalSummary: string;
  medicalHistory: string[]; chronicConditions: string[];
  allergies: string[]; medications: string[];
  functionalStatus: string; socialContext: string;
  prognosis: string; expectedOutcome: string; currentTreatment: string;
  homeAccessNotes: string; communicationInstructions: string;
  episodes: CareEpisode[]; state: PatientState;
  contacts: PatientContact[]; careTeam: CareTeamMember[];
  carePlan: CarePlan; monitoring: MonitoringPlan;
  observations: Observation[]; notes: ClinicalNote[];
  tasks: CrmTask[]; communications: CommunicationEvent[];
  documents: CrmDocument[]; timeline: TimelineEvent[]; audit: AuditEvent[];
  createdAt: string; updatedAt: string;
}

export const patientName = (r: CrmRecord) =>
  `${r.preferredName ?? r.firstName} ${r.lastName}`;

export const currentEpisode = (r: CrmRecord) =>
  r.episodes.find((e) => e.status === "ACTIVE" || e.status === "ESCALATED" || e.status === "ADMITTED") ?? r.episodes[0];

export const labels = {
  clinicalStatus: { STABLE: "Stable", WATCH: "Watch", DETERIORATING: "Deteriorating", CRITICAL: "Critical" },
  trajectory: { IMPROVING: "Improving", STABLE: "Stable", DETERIORATING: "Deteriorating", UNKNOWN: "Unknown" },
  riskLevel: { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" },
  outcomeStatus: { ON_TRACK: "On track", CONCERN: "Concern", OFF_TRACK: "Off track", ACHIEVED: "Achieved" },
  episodeStatus: {
    PROPOSED: "Proposed", ADMITTED: "Admitted", ACTIVE: "Active", ESCALATED: "Escalated",
    RETURNED_TO_HOSPITAL: "Returned to hospital", DISCHARGED: "Discharged", CLOSED: "Closed",
  },
  acuity: { LOW: "Low", MODERATE: "Moderate", HIGH: "High", CRITICAL: "Critical" },
  noteType: {
    CLINICAL_ASSESSMENT: "Clinical assessment", NURSING: "Nursing", DOCTOR_REVIEW: "Doctor review",
    PHONE_CONTACT: "Phone contact", HOME_VISIT: "Home visit", FAMILY_COMMUNICATION: "Family communication",
    MEDICATION_CHANGE: "Medication change", ESCALATION: "Escalation", DISCHARGE: "Discharge", GENERAL: "General",
  },
  taskType: {
    CLINICAL_REVIEW: "Clinical review", HOME_VISIT: "Home visit", PHONE_CALL: "Phone call",
    DEVICE_SUPPORT: "Device support", OBSERVATION: "Observation", DOCUMENT: "Document",
    CARE_PLAN: "Care plan", DISCHARGE: "Discharge", GENERAL: "General",
  },
  careTeamRole: {
    CONSULTANT: "Consultant", DOCTOR: "Doctor", NURSE: "Nurse", CARE_COORDINATOR: "Care coordinator",
    PHARMACIST: "Pharmacist", ALLIED_HEALTH: "Allied health", GP: "GP / primary care",
    REFERRER: "Referring clinician", DEVICE_SUPPORT: "Device support", OTHER: "Other",
  },
  documentType: {
    REFERRAL: "Referral", DISCHARGE_SUMMARY: "Discharge summary", CARE_PLAN: "Care plan",
    MEDICATION_LIST: "Medication list", PATHOLOGY: "Pathology", IMAGING: "Imaging",
    CONSENT: "Consent", ADVANCE_CARE: "Advance care", WOUND_IMAGE: "Wound image", OTHER: "Other",
  },
  timelineType: {
    TREATMENT: "Treatment", HOME_VISIT: "Home visit", REMOTE_REVIEW: "Remote review", ALERT: "Alert",
    CLINICAL_REVIEW: "Clinical review", MEDICATION: "Medication", OBSERVATION: "Observation",
    ESCALATION: "Escalation", DOCUMENT: "Document", NOTE: "Note", COMMUNICATION: "Communication", TASK: "Task",
  },
} as const;

export const statusSignal = (s: ClinicalStatus) =>
  s === "CRITICAL" ? "rapid" : s === "DETERIORATING" ? "rapid" : s === "WATCH" ? "review" : "stable";
