import type { Signal } from "@/lib/lantern-data";
import { statusMeta } from "@/lib/lantern-data";
import { cn } from "@/lib/utils";

export function SignalBadge({ signal, compact=false }: { signal: Signal; compact?: boolean }) {
  const meta = statusMeta[signal];
  return <span className={cn("inline-flex items-center gap-2 border-l-2 px-2 py-1 text-xs font-semibold", meta.classes)}><span aria-hidden>{meta.glyph}</span>{compact ? meta.label.split(" ")[0] : meta.label}</span>;
}

export function MachineMark({ verb="Detected", confidence="High" }: { verb?: string; confidence?: "High"|"Moderate"|"Low" }) {
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-machine" title={`${confidence} confidence`}><span className="inline-grid size-4 place-items-center rounded-t-full border border-machine" aria-hidden>◒</span>{verb} · {confidence}</span>;
}