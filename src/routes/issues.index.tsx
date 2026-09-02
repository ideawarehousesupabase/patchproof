import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AlertTriangle, Loader2, Plus, Upload } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-state";
import { parseChangesCsv } from "@/lib/engine";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/issues/")({
  head: () => ({
    meta: [
      { title: "Issues — detected website changes | PatchProof AI" },
      {
        name: "description",
        content:
          "All detected issues across your agency portfolio, with category, severity, business impact and assurance status.",
      },
      { property: "og:title", content: "Issues — detected website changes | PatchProof AI" },
      {
        property: "og:description",
        content:
          "All detected issues across your agency portfolio, with category, severity, business impact and assurance status.",
      },
    ],
  }),
  component: IssuesPage,
});

const filters = ["All", "Critical", "High", "Medium", "Resolved"] as const;

function localInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function IssuesPage() {
  const { issues, websites, reportChange, reportChanges, loading, error } = useApp();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    websiteId: "",
    component: "",
    description: "",
    detectedAt: localInputValue(new Date()),
  });

  const visible = issues.filter((i) => {
    if (filter === "All") return true;
    if (filter === "Resolved") return i.status === "Resolved";
    return i.severity === filter && i.status !== "Resolved";
  });

  const name = (id: string) => websites.find((w) => w.id === id)?.name ?? id;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.websiteId) {
      toast.error("Select the website this change was detected on.");
      return;
    }
    if (form.component.trim().length < 3) {
      toast.error("Describe the changed component (at least 3 characters).");
      return;
    }
    const detected = new Date(form.detectedAt);
    if (Number.isNaN(detected.getTime())) {
      toast.error("Enter a valid detection date and time.");
      return;
    }
    setSaving(true);
    try {
      const issue = await reportChange({
        websiteId: form.websiteId,
        component: form.component.slice(0, 160),
        description: form.description.slice(0, 1000),
        detectedAt: detected.toISOString(),
      });
      if (!issue) {
        toast.error("Could not analyse this change. Please try again.");
        return;
      }
      setOpen(false);
      setForm({
        websiteId: "",
        component: "",
        description: "",
        detectedAt: localInputValue(new Date()),
      });
      toast.success(`Change analysed — ${issue.severity} severity issue created.`);
    } catch {
      toast.error("Could not save the change. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCsvErrors([]);
    setImporting(true);
    try {
      const text = await file.text();
      const { rows, errors } = parseChangesCsv(text);
      const mapped = rows
        .map((r) => {
          const key = r.websiteRef.toLowerCase();
          const site = websites.find(
            (w) => w.name.toLowerCase() === key || w.url.toLowerCase() === key || w.id === r.websiteRef,
          );
          if (!site) {
            errors.push(`No matching website for "${r.websiteRef}".`);
            return null;
          }
          return {
            websiteId: site.id,
            component: r.component,
            description: r.description,
            detectedAt: r.detectedAt,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      setCsvErrors(errors);
      if (mapped.length) {
        const count = await reportChanges(mapped);
        toast.success(`${count} change${count === 1 ? "" : "s"} imported and analysed.`);
      } else if (errors.length) {
        toast.error("No rows could be imported.");
      }
    } catch {
      toast.error("Could not read that file.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <AppLayout title="Issues">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Issues</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detected website changes and issues across every client site your agency manages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onCsv}
          />
          <Button
            variant="outline"
            disabled={importing || websites.length === 0}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Import CSV
          </Button>
          <Button onClick={() => setOpen(true)} disabled={websites.length === 0}>
            <Plus className="size-4" />
            Record Change
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {csvErrors.length > 0 && (
        <div className="mt-4 rounded-md border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning">
          <div className="font-medium">Some rows were skipped</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
            {csvErrors.slice(0, 6).map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="surface mt-5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading issues…
          </div>
        ) : websites.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <AlertTriangle className="mx-auto size-6 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-semibold">Add a website first</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Issues are generated from changes recorded against a monitored website.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link to="/websites">Go to Websites</Link>
            </Button>
          </div>
        ) : issues.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <AlertTriangle className="mx-auto size-6 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-semibold">No changes recorded yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Record a detected change — or import a CSV of changes — and PatchProof will analyse
              impact, dependencies, repair and safety automatically.
            </p>
            <Button className="mt-5" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Record Change
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No issues match this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Issue</th>
                  <th className="px-5 py-2.5 font-medium">Website</th>
                  <th className="px-5 py-2.5 font-medium">Category</th>
                  <th className="px-5 py-2.5 font-medium">Severity</th>
                  <th className="px-5 py-2.5 font-medium">Business Impact</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Detected</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((i) => (
                  <tr key={i.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-5 py-3.5">
                      <Link
                        to="/issues/$issueId"
                        params={{ issueId: i.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {i.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">{i.id}</div>
                    </td>
                    <td className="px-5 py-3.5">{name(i.websiteId)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{i.category}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={i.severity} />
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{i.businessImpact}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap text-muted-foreground">
                      {i.detected}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Detected Change</DialogTitle>
            <DialogDescription>
              Enter only the raw change. Impact, dependencies, repair proposal and safety score are
              generated automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-website">Website</Label>
              <Select
                value={form.websiteId}
                onValueChange={(v) => setForm({ ...form, websiteId: v })}
              >
                <SelectTrigger id="c-website">
                  <SelectValue placeholder="Select a website" />
                </SelectTrigger>
                <SelectContent>
                  {websites.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-component">Changed Component</Label>
              <Input
                id="c-component"
                maxLength={160}
                placeholder="checkout-payment.js (Stripe integration)"
                value={form.component}
                onChange={(e) => setForm({ ...form, component: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-description">What changed?</Label>
              <Textarea
                id="c-description"
                maxLength={1000}
                rows={3}
                placeholder="Short description of the detected change."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-detected">Detected At</Label>
              <Input
                id="c-detected"
                type="datetime-local"
                value={form.detectedAt}
                onChange={(e) => setForm({ ...form, detectedAt: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Analyse Change
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
