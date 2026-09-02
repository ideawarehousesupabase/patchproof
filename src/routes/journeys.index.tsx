import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/journeys/")({
  head: () => ({
    meta: [
      { title: "Journeys — business journey validation | PatchProof AI" },
      {
        name: "description",
        content:
          "Protected customer journeys across every client website, with validation status for checkout, contact, donation, booking and registration flows.",
      },
      { property: "og:title", content: "Journeys — business journey validation | PatchProof AI" },
      {
        property: "og:description",
        content:
          "Protected customer journeys across every client website, with validation status for checkout, contact, donation, booking and registration flows.",
      },
    ],
  }),
  component: JourneysPage,
});

function JourneysPage() {
  const { journeys, websites, loading, triggerLiveValidation } = useApp();
  const name = (id: string) => websites.find((w) => w.id === id)?.name ?? id;

  const [runningAll, setRunningAll] = useState(false);

  // Skip journeys whose feature doesn't exist on the site (validating them would
  // only ever record a failure for something that was never there) and journeys
  // that have already passed (matches the single Run Validation button's own
  // disabled rule — no need to re-run a check that's already confirmed healthy).
  const runnable = journeys.filter((j) => j.status !== "Not Present" && j.status !== "Passed");

  async function runAllValidations() {
    if (runnable.length === 0) return;
    setRunningAll(true);

    let triggered = 0;
    const failed: string[] = [];

    // Sequential on purpose: each one dispatches its own GitHub Actions run.
    for (const journey of runnable) {
      try {
        const result = await triggerLiveValidation(journey.id);
        if (result.ok) triggered++;
        else failed.push(journey.name);
      } catch {
        failed.push(journey.name);
      }
    }

    setRunningAll(false);

    if (triggered > 0) {
      toast.success(
        `Validation triggered for ${triggered} journey${triggered === 1 ? "" : "s"}. Results will update automatically.`,
      );
    }
    if (failed.length > 0) {
      toast.error(`Could not trigger validation for: ${failed.join(", ")}`);
    }
  }

  return (
    <AppLayout title="Journeys">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Journeys</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Validate that business-critical customer journeys still work after website changes.
          </p>
        </div>

        <Button onClick={runAllValidations} disabled={runningAll || runnable.length === 0}>
          {runningAll ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PlayCircle className="size-4" />
          )}
          {runningAll ? "Triggering…" : `Run All Validation Tests (${runnable.length})`}
        </Button>
      </div>

      <div className="surface mt-5 overflow-hidden">
        {loading ? (
          <p className="px-5 py-16 text-center text-sm text-muted-foreground">Loading journeys…</p>
        ) : journeys.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <h3 className="text-sm font-semibold">No protected journeys yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Journeys are generated from the business-critical functions you list when adding a
              website.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link to="/websites">Add a website</Link>
            </Button>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Journey</th>
                <th className="px-5 py-2.5 font-medium">Website</th>
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {journeys.map((j) => (
                <tr key={j.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-5 py-3.5">
                    <Link
                      to="/journeys/$journeyId"
                      params={{ journeyId: j.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {j.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{name(j.websiteId)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{j.type}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={j.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </AppLayout>
  );
}
