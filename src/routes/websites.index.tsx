import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Globe, Loader2, Plus, HelpCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApp } from "@/lib/app-state";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/websites/")({
  head: () => ({
    meta: [
      { title: "Websites — PatchProof AI portfolio assurance" },
      {
        name: "description",
        content:
          "View the assurance status, open issues and protected journeys for every client website managed by your agency.",
      },
      { property: "og:title", content: "Websites — PatchProof AI portfolio assurance" },
      {
        property: "og:description",
        content:
          "View the assurance status, open issues and protected journeys for every client website managed by your agency.",
      },
    ],
  }),
  component: WebsitesPage,
});

const filters = ["All", "Healthy", "Attention Required", "Critical"] as const;

const emptyForm = {
  name: "",
  client: "",
  url: "",
  platform: "WordPress",
  type: "E-commerce",
  businessFunctions: "",
  wpUsername: "",
  wpAppPassword: "",
};

function WebsitesPage() {
  const { websites, addWebsite, loading, error } = useApp();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const visible = websites.filter((w) => filter === "All" || w.status === filter);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.client.trim() || !form.url.trim()) {
      toast.error("Website name, client and URL are required.");
      return;
    }
    const functions = form.businessFunctions
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    if (functions.length === 0) {
      toast.error("Add at least one business-critical function.");
      return;
    }

    let finalUrl = form.url.trim().toLowerCase();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      const isLocal = finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1') || finalUrl.endsWith('.local') || finalUrl.endsWith('.test');
      finalUrl = isLocal ? `http://${finalUrl}` : `https://${finalUrl}`;
    }
    if (finalUrl.endsWith('/')) {
      finalUrl = finalUrl.slice(0, -1);
    }

    setSaving(true);
    try {
        await addWebsite({
          ...form,
          url: finalUrl,
          platform: form.platform,
          type: form.type,
          businessFunctions: functions,
          wpUsername: form.wpUsername.trim() || undefined,
          wpAppPassword: form.wpAppPassword.replace(/\s+/g, '') || undefined,
        });
      setOpen(false);
      setForm(emptyForm);
      toast.success("Website added — protected journeys generated.");
    } catch {
      toast.error("Could not save the website. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Websites">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Websites</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View the assurance status of the websites managed by your agency.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add Website
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
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

      {loading ? (
        <div className="surface mt-5 flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading your websites…
        </div>
      ) : websites.length === 0 ? (
        <div className="surface mt-5 px-5 py-16 text-center">
          <Globe className="mx-auto size-6 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No websites yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Add your first client website and list its business-critical functions. PatchProof will
            generate the protected journeys automatically.
          </p>
          <Button className="mt-5" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add Website
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <p className="surface mt-5 px-5 py-12 text-center text-sm text-muted-foreground">
          No websites match this filter.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((w) => (
            <Link
              key={w.id}
              to="/websites/$websiteId"
              params={{ websiteId: w.id }}
              className="surface block p-5 transition-shadow hover:shadow-panel"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{w.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{w.client}</div>
                </div>
                <StatusBadge status={w.status} />
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="truncate">{w.url}</div>
                <div>{w.platform}</div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                <div>
                  <div className="text-base font-semibold">{w.openIssues}</div>
                  <div className="text-[11px] text-muted-foreground">Open Issues</div>
                </div>
                <div>
                  <div className="text-base font-semibold">{w.protectedJourneys}</div>
                  <div className="text-[11px] text-muted-foreground">Journeys</div>
                </div>
                <div>
                  <div className="text-base font-semibold">·</div>
                  <div className="text-[11px] text-muted-foreground">{w.lastChecked}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Website</DialogTitle>
            <DialogDescription>
              Provide the primary details only — journeys, baselines and metrics are derived
              automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="w-name">Website Name</Label>
              <Input
                id="w-name"
                maxLength={120}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-client">Client Name</Label>
              <Input
                id="w-client"
                maxLength={120}
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-url">Website URL</Label>
              <Input
                id="w-url"
                maxLength={255}
                placeholder="example.co.uk"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="w-platform">Platform</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm({ ...form, platform: v })}
                >
                  <SelectTrigger id="w-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WordPress">WordPress</SelectItem>
                    <SelectItem value="WordPress / WooCommerce">WordPress / WooCommerce</SelectItem>
                    <SelectItem value="Shopify">Shopify</SelectItem>
                    <SelectItem value="Webflow">Webflow</SelectItem>
                    <SelectItem value="Custom Build">Custom Build</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="w-type">Website Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger id="w-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Charity">Charity</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="Brochure">Brochure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-functions">Business-Critical Functions</Label>
              <Input
                id="w-functions"
                maxLength={255}
                placeholder="Checkout, Contact Form, Account Login"
                value={form.businessFunctions}
                onChange={(e) => setForm({ ...form, businessFunctions: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Comma separated. Each one becomes a protected journey with validation steps.
              </p>
            </div>

            {/* WordPress credentials — optional */}
            {(form.platform === "WordPress" || form.platform === "WordPress / WooCommerce") && (
              <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-foreground">WordPress Credentials (Optional)</p>
                <p className="text-[11px] text-muted-foreground">
                  Provide credentials to enable live vulnerability scanning. Go to your WordPress dashboard → Users → Profile → Application Passwords to generate one.
                  <br />
                  <span className="font-medium">Note:</span> The Live Scan button will remain hidden if these are not provided.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="w-wpuser" className="text-xs">WP Username</Label>
                    <Input
                      id="w-wpuser"
                      maxLength={100}
                      placeholder="admin"
                      value={form.wpUsername}
                      onChange={(e) => setForm({ ...form, wpUsername: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="w-wppass" className="text-xs flex items-center gap-1.5">
                      Application Password
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="size-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-[250px]">
                            Go to Users &gt; Profile in your WordPress dashboard, scroll to Application Passwords, enter a name, and click "Add New".
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="w-wppass"
                      type="password"
                      maxLength={100}
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={form.wpAppPassword}
                      onChange={(e) => setForm({ ...form, wpAppPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Add Website
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
