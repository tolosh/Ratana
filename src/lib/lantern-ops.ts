import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { network as fallbackNetwork, regions as fallbackRegions, type Region } from "@/lib/lantern-data";

export interface OpsData {
  network: {
    activePatients: number;
    occupancyPercent: number;
    stable: number;
    review: number;
    rapid: number;
    nodata: number;
    admissionsPending: number;
    likelyDischarges: number;
    transfersInProgress: number;
    deviceConcerns: number;
    servicePressure: string;
    staffingHeadroom: string;
    workload: { h4: number; h8: number; h24: number };
  };
  regions: Region[];
  buckets: Record<"admissions" | "transfers" | "devices", Array<{ bucket: string; total: number }>>;
}

const fallback: OpsData = {
  network: {
    activePatients: fallbackNetwork.activePatients,
    occupancyPercent: fallbackNetwork.occupancyPercent,
    stable: 3249,
    review: 1000,
    rapid: 351,
    nodata: 400,
    admissionsPending: fallbackNetwork.admissionsPending,
    likelyDischarges: fallbackNetwork.likelyDischarges,
    transfersInProgress: fallbackNetwork.transfersInProgress,
    deviceConcerns: 425,
    servicePressure: fallbackNetwork.servicePressure,
    staffingHeadroom: fallbackNetwork.staffingHeadroom,
    workload: fallbackNetwork.workload,
  },
  regions: fallbackRegions,
  buckets: { admissions: [], transfers: [], devices: [] },
};

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

async function loadOps(): Promise<OpsData> {
  const [snapshots, summary] = await Promise.all([
    supabase.from("lantern_network_snapshots").select("*").order("region"),
    supabase.rpc("lantern_worklist_summary"),
  ]);
  if (snapshots.error) throw snapshots.error;
  if (summary.error) throw summary.error;

  const rows = snapshots.data ?? [];
  const summaryRows = summary.data ?? [];
  const pick = (kind: string) =>
    summaryRows
      .filter((row) => row.kind === kind && row.bucket)
      .map((row) => ({ bucket: row.bucket as string, total: Number(row.total) }))
      .sort((a, b) => b.total - a.total);
  const net = new Map(pick("network").map((row) => [row.bucket, row.total]));
  const sum = (key: keyof (typeof rows)[number]) => rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);

  return {
    network: {
      activePatients: net.get("active") ?? fallback.network.activePatients,
      occupancyPercent: rows[0]?.occupancy_percent ?? fallback.network.occupancyPercent,
      stable: net.get("stable") ?? fallback.network.stable,
      review: net.get("review") ?? fallback.network.review,
      rapid: net.get("rapid") ?? fallback.network.rapid,
      nodata: net.get("nodata") ?? fallback.network.nodata,
      admissionsPending: net.get("admissions_pending") ?? fallback.network.admissionsPending,
      likelyDischarges: net.get("discharge_ready") ?? fallback.network.likelyDischarges,
      transfersInProgress: net.get("transfers_in_progress") ?? fallback.network.transfersInProgress,
      deviceConcerns: net.get("device_concern") ?? fallback.network.deviceConcerns,
      servicePressure: rows.some((row) => row.service_pressure === "strained") ? "Strained" : "Steady",
      staffingHeadroom: rows.some((row) => row.staffing_headroom === "limited") ? "Limited" : "Adequate",
      workload: {
        h4: sum("workload_forecast_4h"),
        h8: sum("workload_forecast_8h"),
        h24: sum("workload_forecast_24h"),
      },
    },
    regions: rows.map((row) => ({
      name: row.region,
      active: row.active_patients,
      review: row.clinical_review,
      rapid: row.rapid_response,
      nodata: row.no_data,
      admissionsPending: row.admissions_pending,
      discharges: row.likely_discharges,
      transfers: row.transfers_in_progress,
      pressure: row.staffing_pressure_percent,
      headroom: titleCase(row.staffing_headroom),
    })),
    buckets: {
      admissions: pick("admissions"),
      transfers: pick("transfers"),
      devices: pick("devices"),
    },
  };
}

export function useOps() {
  const query = useQuery({ queryKey: ["lantern-ops"], queryFn: loadOps, staleTime: 60_000 });
  return { ops: query.data ?? fallback, isLoading: query.isLoading, isLive: !!query.data };
}

export function useAdmissionWorklist() {
  return useQuery({
    queryKey: ["lantern-worklist", "admissions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("lantern_admission_worklist");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useTransferWorklist() {
  return useQuery({
    queryKey: ["lantern-worklist", "transfers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("lantern_transfer_worklist");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useDeviceWorklist() {
  return useQuery({
    queryKey: ["lantern-worklist", "devices"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("lantern_device_worklist");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function waitingLabel(from: string | null): string {
  if (!from) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(from).getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

export function clockLabel(from: string | null): string {
  if (!from) return "—";
  return new Date(from).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
}
