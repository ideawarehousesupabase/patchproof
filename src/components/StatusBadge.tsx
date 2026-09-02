import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneMap: Record<string, Tone> = {
  Healthy: "success",
  Passed: "success",
  Resolved: "success",
  Validated: "success",
  Verified: "success",
  Approved: "success",
  Active: "success",
  Low: "success",
  "Attention Required": "warning",
  "At Risk": "warning",
  Medium: "warning",
  "Awaiting Approval": "warning",
  "Validation Required": "warning",
  Pending: "neutral",
  "Not Present": "neutral",
  Critical: "danger",
  Failed: "danger",
  High: "danger",
  Rejected: "danger",
  Detected: "info",
  Analysed: "info",
  "Repair Proposed": "info",
};

const toneClass: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  info: "bg-info-soft text-info border-info/25",
  neutral: "bg-neutral-soft text-muted-foreground border-border",
};

export function StatusBadge({
  status,
  tone,
  className,
}: {
  status: string;
  tone?: Tone;
  className?: string;
}) {
  const resolved = tone ?? toneMap[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[resolved],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
