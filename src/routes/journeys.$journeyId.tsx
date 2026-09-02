import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-state";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journeys/$journeyId")({
  head: () => ({
    meta: [
      { title: "Journey validation — PatchProof AI" },
      {
        name: "description",
        content:
          "Run a simulated business-journey validation, step by step, to confirm the customer journey still works after a repair.",
      },
      { property: "og:title", content: "Journey validation — PatchProof AI" },
      {
        property: "og:description",
        content:
          "Run a simulated business-journey validation, step by step, to confirm the customer journey still works after a repair.",
      },
    ],
  }),
  component: JourneyDetailPage,
});

function JourneyDetailPage() {
  const { journeyId } = useParams({ from: "/journeys/$journeyId" });
  const { journeys, websites, issues, triggerLiveValidation, backendAvailable } = useApp();
  const journey = journeys.find((j) => j.id === journeyId);

  const [running, setRunning] = useState(false);

  if (!journey) {
    return (
      <AppLayout title="Journey not found">
        <p className="surface px-5 py-12 text-center text-sm text-muted-foreground">
          This journey is no longer available.
        </p>
      </AppLayout>
    );
  }

  const website = websites.find((w) => w.id === journey.websiteId);
  const relatedIssue = issues.find((i) => i.journeyId === journey.id);

  async function runValidation() {
    if (!journey) return;
    setRunning(true);

    try {
      const result = await triggerLiveValidation(journey.id);
      if (result.ok) {
        toast.success("Validation triggered in GitHub Actions. Results will update automatically.");
      } else {
        toast.error(result.error);
        setRunning(false);
      }
    } catch {
      toast.error("Failed to trigger validation.");
      setRunning(false);
    }
    // We leave running=true if successful because the Firestore snapshot will update the journey status eventually.
    // In a real app we might poll or listen, but Firestore handles that automatically for us here!
  }

  return (
    <AppLayout
      title={`${journey.name} Journey`}
      breadcrumb={
        <Link to="/journeys" className="hover:underline">
          Journeys
        </Link>
      }
    >
      <div className="surface flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{journey.name} Journey</h2>
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
            <span>{journey.type}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {journey.categories.map((c) => (
              <span
                key={c}
                className="rounded-md border border-border bg-neutral-soft px-2.5 py-1 text-xs text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={journey.status} />
          <Button onClick={runValidation} disabled={running || journey.status === "Passed"}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
            {running ? "Awaiting Results…" : "Run Validation"}
          </Button>
        </div>
      </div>

      <section className="surface mt-4">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Journey Steps</h3>
        </div>
        <ul className="divide-y divide-border">
          {journey.steps.map((step, idx) => {
            const isDone = journey.status === "Passed";
            const isFailed = journey.status === "Failed";
            const isActive = running; // For now, all steps show as active while the GitHub Action runs
            
            return (
              <li key={step.name} className="flex items-center gap-3 px-5 py-3.5">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                    isDone
                      ? "border-success/30 bg-success-soft text-success"
                      : isFailed
                        ? "border-danger/30 bg-danger-soft text-danger"
                        : "border-border bg-neutral-soft text-muted-foreground",
                  )}
                >
                  {isDone ? <CheckCircle2 className="size-3.5" /> : idx + 1}
                </span>
                <span className="flex-1 text-sm font-medium">{step.name}</span>
                {isActive ? (
                  <span className="inline-flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="size-3.5 animate-spin" />
                    Testing {step.name}…
                  </span>
                ) : isDone ? (
                  <span className="text-xs font-medium text-success">✓ Passed</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {running ? "Queued" : "Validation Required"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {journey.status === "Passed" && (
        <section className="mt-4 rounded-lg border border-success/25 bg-success-soft p-5">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-5" />
            <h3 className="text-sm font-semibold">Journey Validated Successfully</h3>
          </div>
          <p className="mt-2 text-sm text-success/90">
            The {journey.name.toLowerCase()} journey continues to function correctly after the
            repair.
          </p>
          {relatedIssue && (
            <Button asChild className="mt-4">
              <Link to="/evidence">View Proof-of-Repair evidence</Link>
            </Button>
          )}
        </section>
      )}
    </AppLayout>
  );
}
