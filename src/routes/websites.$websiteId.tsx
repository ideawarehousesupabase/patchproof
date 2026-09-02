import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ExternalLink, Loader2, Search } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/websites/$websiteId")({
  head: () => ({
    meta: [
      { title: "Website details — PatchProof AI" },
      {
        name: "description",
        content:
          "Website assurance overview: baseline, protected business journeys, recent changes and active issues.",
      },
      { property: "og:title", content: "Website details — PatchProof AI" },
      {
        property: "og:description",
        content:
          "Website assurance overview: baseline, protected business journeys, recent changes and active issues.",
      },
    ],
  }),
  component: WebsiteDetailPage,
});

function WebsiteDetailPage() {
  const { websiteId } = useParams({ from: "/websites/$websiteId" });
  const navigate = useNavigate();
  const { websites, issues, journeys, websiteRecords, backendAvailable, scanWebsite, deleteWebsite } = useApp();
  const website = websites.find((w) => w.id === websiteId);
  const websiteRecord = websiteRecords.find((w) => w.id === websiteId);
  const [scanning, setScanning] = useState(false);

  if (!website) {
    return (
      <AppLayout title="Website not found">
        <p className="surface px-5 py-12 text-center text-sm text-muted-foreground">
          This website is no longer available.
        </p>
      </AppLayout>
    );
  }

  const siteIssues = issues.filter((i) => i.websiteId === website.id);
  const activeIssues = siteIssues.filter(
    (i) => i.status !== "Resolved" && i.status !== "Rejected",
  );
  const siteJourneys = journeys.filter((j) => j.websiteId === website.id);
  const pendingRepairs = activeIssues.filter((i) =>
    ["Repair Proposed", "Awaiting Approval", "Validation Required"].includes(i.status),
  ).length;

  const metrics = [
    { label: "Assurance Status", value: website.status },
    { label: "Open Issues", value: String(activeIssues.length) },
    { label: "Critical Journeys", value: String(siteJourneys.filter((j) => j.type === "Transactional" || j.type === "Booking").length) },
    { label: "Pending Repairs", value: String(pendingRepairs) },
  ];

  const baseline = [
    { label: "Platform", value: website.platform },
    { label: "SSL", value: website.baseline.ssl },
    { label: "DNS", value: website.baseline.dns },
    { label: "CMS Components", value: website.baseline.components },
    { label: "Third-Party Services", value: website.baseline.thirdParty },
    { label: "Business Functions", value: website.baseline.businessFunctions },
    { label: "Last Baseline", value: website.baseline.lastBaseline },
  ];

  return (
    <AppLayout
      title={website.name}
      breadcrumb={
        <Link to="/websites" className="hover:underline">
          Websites
        </Link>
      }
    >
      <div className="surface flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{website.name}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {website.url} <ExternalLink className="size-3.5" />
            </span>
            <span>{website.platform}</span>
            <span>{website.client}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={website.status} />
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-soft hover:text-danger"
            onClick={async () => {
              if (
                confirm(
                  "Are you sure you want to delete this website? All issues, changes, and journeys will be permanently erased.",
                )
              ) {
                await deleteWebsite(websiteId);
                navigate({ to: "/websites" });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Scan Now button — only shown when backend is configured and site is WordPress */}
      {backendAvailable && websiteRecord?.wpUsername && (
        <div className="surface mt-4 flex items-center justify-between gap-4 px-5 py-3">
          <div>
            <p className="text-sm font-medium">Live Vulnerability Scan</p>
            <p className="text-xs text-muted-foreground">
              Scan this WordPress site for outdated or vulnerable plugins.
            </p>
          </div>
          <Button
            size="sm"
            disabled={scanning}
            onClick={async () => {
              setScanning(true);
              try {
                const result = await scanWebsite(websiteId);
                if (result.ok) {
                  const d = result.data;
                  if (d.issuesFound > 0) {
                    toast.warning(`Scan complete: ${d.issuesFound} issue${d.issuesFound > 1 ? "s" : ""} found across ${d.pluginsScanned} plugins.`);
                  } else {
                    toast.success(`Scan complete: ${d.pluginsScanned} plugins checked — no vulnerabilities found.`);
                  }
                } else {
                  toast.error(result.error);
                }
              } catch {
                toast.error("Scan failed. Please try again.");
              } finally {
                setScanning(false);
              }
            }}
          >
            {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {scanning ? "Scanning…" : "Scan Now"}
          </Button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="surface p-4">
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className="mt-2 text-lg font-semibold tracking-tight">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="surface lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Active Issues</h3>
          </div>
          {activeIssues.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No active issues detected on this website.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {activeIssues.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{i.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={i.severity} />
                      <span>Business Impact: {i.businessImpact}</span>
                    </div>
                  </div>
                  <StatusBadge status={i.status} />
                  <Button asChild size="sm" variant="outline">
                    <Link to="/issues/$issueId" params={{ issueId: i.id }}>
                      View Issue
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Website Baseline</h3>
          </div>
          <dl className="divide-y divide-border">
            {baseline.map((b) => (
              <div key={b.label} className="flex items-start justify-between gap-3 px-5 py-3">
                <dt className="text-xs text-muted-foreground">{b.label}</dt>
                <dd className="text-right text-xs font-medium">{b.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Protected Journeys</h3>
          </div>
          {siteJourneys.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No journeys configured yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {siteJourneys.map((j) => (
                <li key={j.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/journeys/$journeyId"
                      params={{ journeyId: j.id }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {j.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{j.type}</div>
                  </div>
                  <StatusBadge status={j.status} />
                  <ArrowRight className="size-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Recent Website Changes</h3>
          </div>
          {website.recentChanges.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No changes recorded since the baseline was captured.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {website.recentChanges.map((c) => (
                <li key={c.change + c.when} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{c.change}</div>
                    <div className="text-xs text-muted-foreground">{c.when}</div>
                  </div>
                  <StatusBadge status={c.risk} />
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    {c.outcome}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
