import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  ShieldAlert,
  ShieldCheck,
  Route as RouteIcon,
  ArrowRight,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/lib/app-state";
import { relativeTime } from "@/lib/engine";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Overview — PatchProof AI assurance dashboard" },
      {
        name: "description",
        content:
          "Portfolio overview of monitored client websites, detected issues, repairs awaiting review and protected business journeys.",
      },
      { property: "og:title", content: "Overview — PatchProof AI assurance dashboard" },
      {
        property: "og:description",
        content:
          "Portfolio overview of monitored client websites, detected issues, repairs awaiting review and protected business journeys.",
      },
    ],
  }),
  component: OverviewPage,
});

const toneDot: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

function OverviewPage() {
  const { user, websites, issues, journeys, evidence, loading } = useApp();
  const firstName = user?.fullName.split(" ")[0] ?? "there";

  const healthy = websites.filter((w) => w.status === "Healthy").length;
  const attention = websites.filter((w) => w.status !== "Healthy").length;
  const critical = issues.filter(
    (i) => i.severity === "Critical" && i.status !== "Resolved" && i.status !== "Rejected",
  ).length;
  const awaitingReview = issues.filter(
    (i) => i.status === "Repair Proposed" || i.status === "Awaiting Approval",
  ).length;

  const recentActivity = [
    ...issues.map((i) => ({
      event: `${i.title} — ${i.status}`,
      website: websites.find((w) => w.id === i.websiteId)?.name ?? "Unknown website",
      at: i.detectedAt,
      tone: i.severity === "Critical" || i.severity === "High" ? "danger" : "warning",
    })),
    ...evidence.map((e) => ({
      event: `Proof-of-Repair produced — ${e.issue}`,
      website: websites.find((w) => w.id === e.websiteId)?.name ?? "Unknown website",
      at: e.createdAt,
      tone: "success",
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  const metrics = [
    { label: "Websites Monitored", value: websites.length, icon: Globe },
    { label: "Healthy Websites", value: healthy, icon: ShieldCheck },
    { label: "Requiring Attention", value: attention, icon: AlertTriangle },
    { label: "Critical Issues", value: critical, icon: ShieldAlert },
    { label: "Repairs Awaiting Review", value: awaitingReview, icon: CheckCircle2 },
    { label: "Journeys Protected", value: journeys.length, icon: RouteIcon },
  ];

  const attentionRows = websites
    .filter((w) => w.status !== "Healthy")
    .map((w) => ({
      website: w,
      issue: issues.find(
        (i) => i.websiteId === w.id && i.status !== "Resolved" && i.status !== "Rejected",
      ),
    }))
    .filter((row) => row.issue);

  return (
    <AppLayout title="Overview" breadcrumb={user?.agencyName}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Good morning, {firstName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor changes, review repairs and protect critical website journeys.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface p-4">
            <Icon className="size-4 text-muted-foreground" />
            <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <section className="surface mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Websites Requiring Attention</h3>
          <Link
            to="/websites"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            All websites <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {attentionRows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            {websites.length === 0
              ? "No websites yet — add your first client website to begin."
              : "All monitored websites are currently healthy."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Website</th>
                  <th className="px-5 py-2.5 font-medium">Issue</th>
                  <th className="px-5 py-2.5 font-medium">Business Impact</th>
                  <th className="px-5 py-2.5 font-medium">Risk</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {attentionRows.map(({ website, issue }) => (
                  <tr key={website.id} className="border-t border-border">
                    <td className="px-5 py-3.5">
                      <Link
                        to="/websites/$websiteId"
                        params={{ websiteId: website.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {website.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{website.url}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to="/issues/$issueId"
                        params={{ issueId: issue!.id }}
                        className="hover:underline"
                      >
                        {issue!.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{issue!.businessImpact}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={issue!.severity} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={issue!.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface mt-6">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
        </div>
        {recentActivity.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            {loading ? "Loading your workspace…" : "No activity yet. Add a website and record a detected change to get started."}
          </p>
        ) : (
        <ul className="divide-y divide-border">
          {recentActivity.map((a) => (
            <li key={a.event + a.at} className="flex items-start gap-3 px-5 py-3.5">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${toneDot[a.tone]}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{a.event}</div>
                <div className="text-xs text-muted-foreground">{a.website}</div>
              </div>
              <div className="text-xs whitespace-nowrap text-muted-foreground">
                {relativeTime(a.at)}
              </div>
            </li>
          ))}
        </ul>
        )}
      </section>
    </AppLayout>
  );
}
