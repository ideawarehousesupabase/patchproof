import { Activity, GitBranch, ShieldCheck, FileCheck2 } from "lucide-react";

const steps = [
  { icon: Activity, title: "Detect", copy: "Website changes and issues are surfaced continuously." },
  {
    icon: GitBranch,
    title: "Understand impact",
    copy: "Affected components are mapped to the business journeys that depend on them.",
  },
  {
    icon: ShieldCheck,
    title: "Repair safely",
    copy: "Structured repair proposals are assessed for risk before approval.",
  },
  {
    icon: FileCheck2,
    title: "Prove the outcome",
    copy: "Validated journeys produce a Proof-of-Repair evidence record.",
  },
];

export function AuthAside() {
  return (
    <div className="hidden bg-navy px-12 py-14 text-navy-foreground lg:flex lg:flex-col lg:justify-center">
      <p className="text-xs font-medium tracking-[0.18em] uppercase opacity-70">
        Web Change Assurance
      </p>
      <h2 className="mt-4 max-w-md text-2xl leading-snug font-semibold tracking-tight">
        Know what changed, why it matters, and prove it was fixed.
      </h2>
      <p className="mt-3 max-w-md text-sm opacity-75">
        PatchProof AI connects website change detection to business impact, safe repair and
        validated evidence — across every client site your agency manages.
      </p>

      <ul className="mt-10 max-w-md space-y-5">
        {steps.map(({ icon: Icon, title, copy }) => (
          <li key={title} className="flex gap-3.5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
              <Icon className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-medium">{title}</span>
              <span className="block text-sm opacity-70">{copy}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
