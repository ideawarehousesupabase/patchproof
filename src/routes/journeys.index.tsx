import { createFileRoute, Link } from "@tanstack/react-router";
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
  const { journeys, websites, loading } = useApp();
  const name = (id: string) => websites.find((w) => w.id === id)?.name ?? id;

  return (
    <AppLayout title="Journeys">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Journeys</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Validate that business-critical customer journeys still work after website changes.
          </p>
        </div>

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
