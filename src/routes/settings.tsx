import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccount, updateAccount } from "@/lib/account-store";
import { useApp } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PatchProof AI account profile" },
      {
        name: "description",
        content: "Update the name, agency and email address on your PatchProof AI account.",
      },
      { property: "og:title", content: "Settings — PatchProof AI account profile" },
      {
        property: "og:description",
        content: "Update the name, agency and email address on your PatchProof AI account.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, updateUser, signOut, purgeAccountData } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    agencyName: user?.agencyName ?? "",
    email: user?.email ?? "",
  });
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.fullName.trim() || !form.agencyName.trim() || !form.email.trim()) {
      toast.error("Please complete all fields.");
      return;
    }
    setSaving(true);
    try {
      await updateAccount(user.id, form);
      updateUser(form);
      toast.success("Profile updated.");
    } catch {
      toast.error("Unable to complete the request. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAccount() {
    if (!user) return;
    try {
      await purgeAccountData();
      await deleteAccount(user.id);
      signOut();
      navigate({ to: "/register" });
    } catch {
      toast.error("Unable to complete the request. Please try again.");
    }
  }

  return (
    <AppLayout title="Settings">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Basic account information for your PatchProof workspace.
        </p>

        <form onSubmit={save} className="surface mt-5 space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agencyName">Agency Name</Label>
            <Input
              id="agencyName"
              value={form.agencyName}
              onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </form>

        <div className="surface mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="text-sm font-medium">Delete Account</div>
            <p className="text-xs text-muted-foreground">
              Permanently remove this prototype account.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                <AlertDialogDescription>
                  All of your websites, changes, issues, journeys and evidence records will be permanently deleted and you will be signed out.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={removeAccount}>Delete Account</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AppLayout>
  );
}
