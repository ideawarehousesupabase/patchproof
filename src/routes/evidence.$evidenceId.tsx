import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, FileCheck2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/evidence/$evidenceId")({
  head: () => ({
    meta: [
      { title: "Proof-of-Repair — PatchProof AI evidence record" },
      {
        name: "description",
        content:
          "Chronological proof-of-repair evidence: original issue, business impact, dependency analysis, approval, validation outcome and final result.",
      },
      { property: "og:title", content: "Proof-of-Repair — PatchProof AI evidence record" },
      {
        property: "og:description",
        content:
          "Chronological proof-of-repair evidence: original issue, business impact, dependency analysis, approval, validation outcome and final result.",
      },
    ],
  }),
  component: ProofOfRepairPage,
});

function ProofOfRepairPage() {
  const { evidenceId } = useParams({ from: "/evidence/$evidenceId" });
  const { evidence, websites } = useApp();
  const record = evidence.find((e) => e.id === evidenceId);

  if (!record) {
    return (
      <AppLayout title="Evidence not found">
        <p className="surface px-5 py-12 text-center text-sm text-muted-foreground">
          This evidence record is not available yet.
        </p>
      </AppLayout>
    );
  }

  const openScreenshot = (url: string) => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <body style="margin:0; background:#0e0e10; display:flex; justify-content:center;">
          <img src="${url}" style="max-width:100%; height:auto;" />
        </body>
      `);
    }
  };

  const website = websites.find((w) => w.id === record.websiteId);

  // Standalone journey checks (login/search/blog — no vulnerability-driven issue
  // linked to them) never had a repair applied, so labelling their screenshots
  // "Before/After Repair" is misleading — the "after" shot is just whatever the
  // last validation step happened to capture (e.g. a legitimately-empty search
  // results page), not evidence that anything was fixed.
  const isStandaloneCheck = !record.issueId;
  const beforeLabel = isStandaloneCheck ? "Validation Start" : "Before Repair";
  const afterLabel = isStandaloneCheck ? "Validation Result" : "After Repair";

  // The "after" panel was always styled green regardless of outcome, so a
  // Failed record's screenshot/badges were shown inside a success-tinted box —
  // tie the styling to the real outcome instead.
  const afterFailed = record.outcome === "Failed";
  const afterImageClass = afterFailed
    ? "border-danger/30 bg-danger-soft/50"
    : "border-success/30 bg-success-soft/50";

  const rows = [
    { label: "Evidence ID", value: record.id },
    { label: "Website", value: website?.name ?? record.websiteId },
    { label: "Original Issue", value: record.issue },
    { label: "Original Risk", value: record.risk },
    { label: "Business Impact", value: record.businessImpact },
    { label: "Dependency Analysis", value: record.dependencyChain },
    { label: "Proposed Repair", value: record.proposedRepair },
    { label: "Safety Assessment", value: record.safety },
    { label: "Approval", value: record.approval },
    { label: "Patch Preview", value: record.patchPreview },
    { label: "Repair Status", value: record.repairStatus },
    { label: "Validation Performed", value: record.validationPerformed },
    { label: "Validation Outcome", value: record.validationOutcome },
    { label: "Rollback", value: record.rollback },
    { label: "Final Outcome", value: record.outcome },
    { label: "Evidence Status", value: record.status },
  ];

  return (
    <AppLayout
      title="Proof-of-Repair"
      breadcrumb={
        <span>
          <Link to="/evidence" className="hover:underline">
            Evidence
          </Link>
          {" / "}
          {record.id}
        </span>
      }
    >
      <div className="surface flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-info-soft text-primary">
            <FileCheck2 className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Proof-of-Repair</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {record.id} · {website?.name} · {record.date}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={record.outcome} />
          <StatusBadge status={record.status} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="surface lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Evidence Record</h3>
          </div>
          <dl className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.label} className="grid gap-1 px-5 py-3 sm:grid-cols-3">
                <dt className="text-xs text-muted-foreground">{r.label}</dt>
                <dd className="text-sm sm:col-span-2">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Assurance Timeline</h3>
          </div>
          <ol className="space-y-4 px-5 py-4">
            {record.timeline.map((t) => (
              <li key={t.stage} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <div>
                  <div className="text-sm font-medium">{t.stage}</div>
                  <div className="text-xs text-muted-foreground">{t.time}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="surface p-5">
          <h3 className="text-sm font-semibold">{beforeLabel}</h3>
          {record.screenshots?.[0] ? (
            <div onClick={() => openScreenshot(record.screenshots![0].url)} className="cursor-pointer group relative mt-3">
              <img src={record.screenshots[0].url} alt={record.screenshots[0].step}
                   className="aspect-video h-auto w-full rounded-md border border-border object-cover object-top transition-opacity group-hover:opacity-90" />
            </div>
          ) : (
            <div className="mt-3 aspect-video rounded-md border border-dashed border-border bg-muted/50" />
          )}
          <dl className="mt-4 space-y-2">
            {record.before.map((b) => (
              <div key={b.label} className="flex items-center justify-between gap-3">
                <dt className="text-xs text-muted-foreground">{b.label}</dt>
                <dd>
                  <StatusBadge status={b.value} tone="danger" />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="surface p-5">
          <h3 className="text-sm font-semibold">{afterLabel}</h3>
          {record.screenshots && record.screenshots.length > 0 ? (
            <div onClick={() => openScreenshot(record.screenshots![record.screenshots!.length - 1].url)} className="cursor-pointer group relative mt-3">
              <img src={record.screenshots[record.screenshots.length - 1].url} alt={record.screenshots[record.screenshots.length - 1].step}
                   className={`aspect-video h-auto w-full rounded-md border border-dashed ${afterImageClass} object-cover object-top transition-opacity group-hover:opacity-90`} />
            </div>
          ) : (
            <div className={`mt-3 aspect-video rounded-md border border-dashed ${afterImageClass}`} />
          )}
          <dl className="mt-4 space-y-2">
            {record.after.map((a) => (
              <div key={a.label} className="flex items-center justify-between gap-3">
                <dt className="text-xs text-muted-foreground">{a.label}</dt>
                <dd>
                  <StatusBadge status={a.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </AppLayout>
  );
}
