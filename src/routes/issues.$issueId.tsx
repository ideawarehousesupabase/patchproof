import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/issues/$issueId")({
  head: () => ({
    meta: [
      { title: "Issue details — PatchProof AI" },
      {
        name: "description",
        content:
          "Business impact, dependency mapping, AI repair proposal, safety assessment and patch preview for a detected website issue.",
      },
      { property: "og:title", content: "Issue details — PatchProof AI" },
      {
        property: "og:description",
        content:
          "Business impact, dependency mapping, AI repair proposal, safety assessment and patch preview for a detected website issue.",
      },
    ],
  }),
  component: IssueDetailPage,
});

const impactTone: Record<string, string> = {
  "Critical Impact": "border-danger/25 bg-danger-soft text-danger",
  "High Impact": "border-warning/25 bg-warning-soft text-warning",
  "Medium Impact": "border-info/25 bg-info-soft text-info",
};

function IssueDetailPage() {
  const { issueId } = useParams({ from: "/issues/$issueId" });
  const { issues, websites, journeys, setIssueStatus, setJourneyStatus, applyRepair, undoRepair } = useApp();
  const issue = issues.find((i) => i.id === issueId);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [wpPassword, setWpPassword] = useState("");
  const [applying, setApplying] = useState(false);

  if (!issue) {
    return (
      <AppLayout title="Issue not found">
        <p className="surface px-5 py-12 text-center text-sm text-muted-foreground">
          This issue is no longer available.
        </p>
      </AppLayout>
    );
  }

  const website = websites.find((w) => w.id === issue.websiteId);
  const journey = journeys.find((j) => j.id === issue.journeyId);

  const approve = async () => {
    if (!wpPassword) {
      toast.error("Please provide the WordPress Admin password for the Headless AI Agent to log in.");
      return;
    }
    
    setPreviewOpen(false);
    setApplying(true);
    
    try {
      const result = await applyRepair(issue.id, wpPassword);
      
      if (result.ok) {
        toast.success(result.data.message);
        setIssueStatus(issue.id, "Validation Required");
        if (journey) setJourneyStatus(journey.id, "Validation Required");
      } else {
        toast.error(result.error);
        setIssueStatus(issue.id, "Repair Proposed"); // Reset back to proposed on failure
      }
    } catch {
      toast.error("Failed to communicate with the repair server.");
      setIssueStatus(issue.id, "Repair Proposed");
    } finally {
      setApplying(false);
    }
  };

  const reject = () => {
    setPreviewOpen(false);
    setIssueStatus(issue.id, "Rejected");
  };

  const handleUndo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpPassword) {
      toast.error("Please provide the WordPress Admin password.");
      return;
    }
    setApplying(true);
    try {
      const result = await undoRepair(issue.id, wpPassword);
      if (result.ok) {
        toast.success(result.data.message || "Reverted successfully!");
      } else {
        toast.error("Undo failed: " + result.error);
      }
    } catch {
      toast.error("Failed to communicate with the repair server.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <AppLayout
      title={issue.title}
      breadcrumb={
        <span>
          <Link to="/issues" className="hover:underline">
            Issues
          </Link>
          {" / "}
          {issue.id}
        </span>
      }
    >
      <div className="surface flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={issue.severity} />
            <StatusBadge status={issue.status} />
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">{issue.title}</h2>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {website && (
              <Link
                to="/websites/$websiteId"
                params={{ websiteId: website.id }}
                className="text-primary hover:underline"
              >
                {website.name}
              </Link>
            )}
            <span>{issue.category}</span>
            <span>Detected {issue.detected}</span>
          </div>
        </div>
        {issue.status === "Validation Required" && journey && (
          <Button asChild>
            <Link to="/journeys/$journeyId" params={{ journeyId: journey.id }}>
              Run Journey Validation
            </Link>
          </Button>
        )}
      </div>

      {applying && (
        <div className="surface mt-4 flex items-center gap-3 p-5">
          <Loader2 className="size-4 animate-spin text-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium">Communicating with Headless Agent…</div>
            <Progress value={66} className="mt-2 h-1.5" />
          </div>
        </div>
      )}

      {issue.status === "Validation Required" && !applying && (
        <div className="mt-4 rounded-lg border border-success/25 bg-success-soft p-4 text-sm text-success">
          <div className="font-medium">Repair Applied</div>
          <p className="mt-1 opacity-90">
            Validation Required — run the affected business journey to confirm the outcome.
          </p>
          <div className="mt-4 border-t border-success/25 pt-4">
             <p className="text-xs font-medium mb-3 text-success">Did the patch break your site? Revert it immediately:</p>
             <form onSubmit={handleUndo} className="flex items-center gap-3">
               <Input 
                 type="password" 
                 placeholder="WP Admin Password" 
                 value={wpPassword} 
                 onChange={(e) => setWpPassword(e.target.value)} 
                 className="max-w-[200px] border-success/50 bg-background focus-visible:ring-success"
                 autoComplete="new-password"
                 required
               />
               <Button type="submit" variant="outline" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger border-danger/25">
                 Revert Repair
               </Button>
             </form>
          </div>
        </div>
      )}

      {issue.status === "Rejected" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          <span>The repair has not been applied.</span>
          <Button size="sm" variant="outline" onClick={() => setIssueStatus(issue.id, "Repair Proposed")}>
            Return to issue
          </Button>
        </div>
      )}

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="repair">Repair</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <section className="surface p-5">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Website", value: website?.name ?? "—" },
                { label: "Severity", value: issue.severity },
                { label: "Detection Time", value: issue.detected },
                { label: "Technical Component", value: issue.component },
                { label: "Category", value: issue.category },
                { label: "Current Status", value: issue.status },
              ].map((f) => (
                <div key={f.label}>
                  <dt className="text-xs text-muted-foreground">{f.label}</dt>
                  <dd className="mt-1 text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Issue Description</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {issue.description}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Potential Business Impact</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {issue.impactCards.map((c) => (
                <div key={c.label} className="surface p-4">
                  <div className="text-sm font-medium">{c.label}</div>
                  <span
                    className={cn(
                      "mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      impactTone[c.level] ?? "border-border bg-neutral-soft text-muted-foreground",
                    )}
                  >
                    {c.level}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="dependencies" className="mt-4 space-y-4">
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Web Change Assurance Graph</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              This issue does not exist in isolation. PatchProof maps the affected website
              components to the business journeys that depend on them.
            </p>

            <div className="mt-6 flex flex-col items-center gap-1">
              {issue.dependencies.map((node, idx) => (
                <div key={node.label} className="flex w-full max-w-sm flex-col items-center">
                  <div
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 text-center text-sm font-medium",
                      node.kind === "technical"
                        ? "border-border bg-neutral-soft"
                        : "border-primary/25 bg-info-soft text-primary",
                    )}
                  >
                    {node.label}
                    <div className="mt-0.5 text-[11px] font-normal opacity-70">
                      {node.kind === "technical" ? "Technical Component" : "Business Outcome"}
                    </div>
                  </div>
                  {idx < issue.dependencies.length - 1 && (
                    <ArrowDown className="my-1 size-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm border border-border bg-neutral-soft" />
                Technical Component
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm border border-primary/25 bg-info-soft" />
                Business Outcome
              </span>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="repair" className="mt-4 space-y-4">
          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">AI Repair Proposal</h3>
            </div>

            <div className="mt-5 space-y-5">
              <Field label="Root Cause" value={issue.repair.rootCause} />
              <Field label="Proposed Repair" value={issue.repair.proposedRepair} />
              <ListField label="Components Affected" items={issue.repair.components} />
              <Field label="Expected Outcome" value={issue.repair.expectedOutcome} />
              <ListField label="Validation Required" items={issue.repair.validationRequired} />
              <Field label="Rollback Plan" value={issue.repair.rollbackPlan} />
            </div>

            {["Repair Proposed", "Awaiting Approval", "Detected", "Analysed"].includes(
              issue.status,
            ) && (
              <div className="mt-6 border-t border-border pt-5">
                <Button onClick={() => setPreviewOpen(true)}>View Patch Preview</Button>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="safety" className="mt-4 space-y-4">
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Repair Safety Assessment</h3>

            <div className="mt-5 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <div className="text-3xl font-semibold tracking-tight">
                  {issue.safety.score}
                  <span className="text-base text-muted-foreground"> / 100</span>
                </div>
                <div className="text-xs text-muted-foreground">Safety Score</div>
                <Progress value={issue.safety.score} className="mt-3 h-2" />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={`${issue.safety.riskLevel} Risk`} tone={
                    issue.safety.riskLevel === "Low"
                      ? "success"
                      : issue.safety.riskLevel === "Medium"
                        ? "warning"
                        : "danger"
                  } />
                  <StatusBadge status={issue.safety.decision} tone="info" />
                </div>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
                {issue.safety.factors.map((f) => (
                  <div key={f.label} className="rounded-lg border border-border p-4">
                    <dt className="text-xs text-muted-foreground">{f.label}</dt>
                    <dd className="mt-1 text-sm font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-5 rounded-md border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              Automation is risk-bounded: low-risk repairs are eligible for automatic execution,
              medium-risk repairs require human approval, high-risk repairs are escalated and unsafe
              repairs are blocked.
            </p>
          </section>
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patch Preview</DialogTitle>
            <DialogDescription>
              Review what would change before the repair is applied.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <div className="text-xs font-medium text-muted-foreground">Current State</div>
              <ul className="mt-3 space-y-2 text-sm">
                {issue.patchPreview.current.map((r) => (
                  <li key={r.label}>
                    <span className="text-muted-foreground">{r.label}: </span>
                    {r.value}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-primary/25 bg-info-soft p-4">
              <div className="text-xs font-medium text-primary">Proposed State</div>
              <ul className="mt-3 space-y-2 text-sm">
                {issue.patchPreview.proposed.map((r) => (
                  <li key={r.label}>
                    <span className="text-muted-foreground">{r.label}: </span>
                    {r.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Meta label="Expected Effect" value={issue.patchPreview.expectedEffect} />
            <Meta label="Business Journey Affected" value={issue.patchPreview.journeyAffected} />
            <Meta label="Risk Level" value={issue.patchPreview.riskLevel} />
            <Meta label="Rollback" value={issue.patchPreview.rollback} />
            <Meta label="Validation Required" value={issue.patchPreview.validationRequired} />
          </dl>

          <form className="rounded-lg border border-warning/25 bg-warning-soft p-4">
            <Label htmlFor="wp-password" className="text-warning">WordPress Admin Password (Required for Headless AI)</Label>
            <p className="mb-3 mt-1 text-xs text-warning">
              Because WordPress blocks Application Passwords from the visual login screen, the Headless AI Agent requires your actual WP Admin password to physically log into the dashboard and click the update button.
            </p>
            <Input 
              id="wp-password" 
              type="password" 
              placeholder="Your WP Admin Password"
              value={wpPassword}
              onChange={(e) => setWpPassword(e.target.value)}
              className="border-warning/50 focus-visible:ring-warning"
              autoComplete="new-password"
            />
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={reject}>
              <XCircle className="size-4" />
              Reject
            </Button>
            <Button onClick={approve}>
              <CheckCircle2 className="size-4" />
              Approve Repair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((i) => (
          <li
            key={i}
            className="rounded-md border border-border bg-neutral-soft px-2.5 py-1 text-xs"
          >
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
