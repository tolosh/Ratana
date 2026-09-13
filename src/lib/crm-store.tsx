import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  AuditEvent, ClinicalNote, CommunicationEvent, CrmDocument, CrmRecord, CrmTask,
  PatientContact, CareTeamMember, CareEpisode, TimelineEvent, TimelineType,
} from "./crm-data";
import { seedRecords } from "./crm-seed";

const STORAGE_KEY = "ratana_crm_v1";

export type ListKey = "contacts" | "careTeam" | "tasks" | "communications" | "documents" | "notes" | "episodes";

type ListItem = PatientContact | CareTeamMember | CrmTask | CommunicationEvent | CrmDocument | ClinicalNote | CareEpisode;

export function stamp(): string {
  const d = new Date();
  const month = d.toLocaleString("en-AU", { month: "short" });
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${month} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

interface CrmContextValue {
  records: CrmRecord[];
  actor: string;
  setActor: (name: string) => void;
  getRecord: (id: string) => CrmRecord | undefined;
  addRecord: (record: CrmRecord) => void;
  removeRecord: (id: string) => void;
  patchRecord: (id: string, patch: Partial<CrmRecord>, summary: string, field?: string) => void;
  addItem: (id: string, key: ListKey, item: ListItem, summary: string, timeline?: { type: TimelineType; title: string; detail?: string }) => void;
  updateItem: (id: string, key: ListKey, itemId: string, patch: Record<string, unknown>, summary: string) => void;
  removeItem: (id: string, key: ListKey, itemId: string, summary: string) => void;
  resetData: () => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

function load(): CrmRecord[] {
  if (typeof window === "undefined") return seedRecords();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedRecords();
    const parsed = JSON.parse(raw) as CrmRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedRecords();
  } catch {
    return seedRecords();
  }
}

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<CrmRecord[]>(() => seedRecords());
  const [actor, setActor] = useState("Dr Asha Rao");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      /* storage unavailable in this session */
    }
  }, [records, hydrated]);

  const write = useCallback(
    (id: string, mutate: (record: CrmRecord) => CrmRecord, audit: Omit<AuditEvent, "id" | "at" | "userName">) => {
      setRecords((prev) =>
        prev.map((record) => {
          if (record.id !== id) return record;
          const next = mutate(record);
          const entry: AuditEvent = { id: newId("aud"), at: stamp(), userName: actor, ...audit };
          return { ...next, audit: [entry, ...next.audit], updatedAt: stamp() };
        }),
      );
    },
    [actor],
  );

  const patchRecord = useCallback<CrmContextValue["patchRecord"]>(
    (id, patch, summary, field) => {
      write(id, (record) => ({ ...record, ...patch }), {
        action: "UPDATE", entityType: "Patient record", entityId: id, summary, ...(field ? { field } : {}),
      });
    },
    [write],
  );

  const addItem = useCallback<CrmContextValue["addItem"]>(
    (id, key, item, summary, timeline) => {
      write(
        id,
        (record) => {
          const list = [item, ...(record[key] as ListItem[])];
          const next = { ...record, [key]: list } as CrmRecord;
          if (!timeline) return next;
          const event: TimelineEvent = {
            id: newId("tl"), type: timeline.type, at: stamp(), title: timeline.title,
            author: actor, ...(timeline.detail ? { detail: timeline.detail } : {}),
          };
          return { ...next, timeline: [event, ...next.timeline] };
        },
        { action: "CREATE", entityType: entityLabel(key), entityId: (item as { id: string }).id, summary },
      );
    },
    [write, actor],
  );

  const updateItem = useCallback<CrmContextValue["updateItem"]>(
    (id, key, itemId, patch, summary) => {
      write(
        id,
        (record) => ({
          ...record,
          [key]: (record[key] as ListItem[]).map((item) =>
            (item as { id: string }).id === itemId ? { ...item, ...patch } : item,
          ),
        }) as CrmRecord,
        { action: "UPDATE", entityType: entityLabel(key), entityId: itemId, summary },
      );
    },
    [write],
  );

  const removeItem = useCallback<CrmContextValue["removeItem"]>(
    (id, key, itemId, summary) => {
      write(
        id,
        (record) => ({
          ...record,
          [key]: (record[key] as ListItem[]).filter((item) => (item as { id: string }).id !== itemId),
        }) as CrmRecord,
        { action: "DELETE", entityType: entityLabel(key), entityId: itemId, summary },
      );
    },
    [write],
  );

  const resetData = useCallback(() => setRecords(seedRecords()), []);

  const addRecord = useCallback<CrmContextValue["addRecord"]>((record) => {
    setRecords((prev) => [record, ...prev]);
  }, []);

  const removeRecord = useCallback<CrmContextValue["removeRecord"]>((id) => {
    setRecords((prev) => prev.filter((record) => record.id !== id));
  }, []);

  const getRecord = useCallback((id: string) => records.find((r) => r.id === id), [records]);

  const value = useMemo<CrmContextValue>(
    () => ({ records, actor, setActor, getRecord, addRecord, removeRecord, patchRecord, addItem, updateItem, removeItem, resetData }),
    [records, actor, getRecord, addRecord, removeRecord, patchRecord, addItem, updateItem, removeItem, resetData],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

function entityLabel(key: ListKey): string {
  switch (key) {
    case "contacts": return "Patient contact";
    case "careTeam": return "Care team member";
    case "tasks": return "Task";
    case "communications": return "Communication";
    case "documents": return "Document";
    case "notes": return "Clinical note";
    case "episodes": return "Care episode";
  }
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}
