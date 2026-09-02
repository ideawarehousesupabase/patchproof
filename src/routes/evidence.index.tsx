import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/evidence/")({
  head: () => ({
    meta: [
      { title: "Evidence — proof-of-repair history | PatchProof AI" },
      {
        name: "description",
        content:
          "A verifiable history of completed assurance events: the issue, the repair, the validation performed and the final outcome.",
      },
      { property: "og:title", content: "Evidence — proof-of-repair history | PatchProof AI" },
      {
        property: "og:description",
        content:
          "A verifiable history of completed assurance events: the issue, the repair, the validation performed and the final outcome.",
      },
    ],
  }),
  component: EvidencePage,
});

function EvidencePage() {
  const { evidence, websites } = useApp();
  const name = (id: string) => websites.find((w) => w.id === id)?.name ?? id;

  return (
    <AppLayout title="Evidence">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Evidence</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Proof-of-Repair records produced by completed assurance workflows.
          </p>
        </div>

      </div>


      <div className="surface mt-5 overflow-hidden">
        {evidence.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No evidence records available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Evidence ID</th>
                  <th className="px-5 py-2.5 font-medium">Website</th>
                  <th className="px-5 py-2.5 font-medium">Issue</th>
                  <th className="px-5 py-2.5 font-medium">Risk</th>
                  <th className="px-5 py-2.5 font-medium">Final Outcome</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-5 py-3.5">
                      <Link
                        to="/evidence/$evidenceId"
                        params={{ evidenceId: e.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {e.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">{name(e.websiteId)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{e.issue}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={e.risk} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={e.outcome} />
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap text-muted-foreground">
                      {e.date}
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
