import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAside } from "@/components/AuthAside";
import { createAccount, findAccountByEmail } from "@/lib/account-store";
import { PasswordInput } from "@/components/PasswordInput";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — PatchProof AI" },
      {
        name: "description",
        content:
          "Create a PatchProof AI agency workspace to monitor client website changes, review repairs and produce proof-of-repair evidence.",
      },
      { property: "og:title", content: "Create account — PatchProof AI" },
      {
        property: "og:description",
        content:
          "Create a PatchProof AI agency workspace to monitor client website changes, review repairs and produce proof-of-repair evidence.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(100),
    agencyName: z.string().trim().min(1, "Agency name is required").max(120),
    email: z.string().trim().email("Please enter a valid email address").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const [form, setForm] = useState({
    fullName: "",
    agencyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const existing = await findAccountByEmail(parsed.data.email);
      if (existing) {
        setFormError("An account with this email already exists.");
        return;
      }
      const account = await createAccount(parsed.data);
      setSuccess(true);
      signIn(account);
      navigate({ to: "/overview" });
    } catch {
      setFormError("Unable to complete the request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof typeof form; label: string; type?: string }[] = [
    { key: "fullName", label: "Full Name" },
    { key: "agencyName", label: "Agency Name" },
    { key: "email", label: "Email", type: "email" },
    { key: "password", label: "Password", type: "password" },
    { key: "confirmPassword", label: "Confirm Password", type: "password" },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthAside />

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-semibold tracking-tight">PatchProof AI</span>
              <span className="block text-xs text-muted-foreground">Web Change Assurance</span>
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Set up your agency workspace in a couple of minutes.
          </p>

          {success ? (
            <div className="mt-8 rounded-lg border border-success/25 bg-success-soft p-4 text-sm text-success">
              <CheckCircle2 className="mb-2 size-5" />
              Account created successfully. Taking you to your workspace…
            </div>
          ) : (
            <form onSubmit={onSubmit} autoComplete="off" className="mt-7 space-y-4">
              {fields.map(({ key, label, type }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  {type === "password" ? (
                    <PasswordInput
                      id={key}
                      autoComplete="off"
                      value={form[key]}
                      onChange={set(key)}
                      aria-invalid={Boolean(errors[key])}
                    />
                  ) : (
                    <Input
                      id={key}
                      type={type ?? "text"}
                      autoComplete="off"
                      value={form[key]}
                      onChange={set(key)}
                      aria-invalid={Boolean(errors[key])}
                    />
                  )}
                  {errors[key] && <p className="text-xs text-danger">{errors[key]}</p>}
                </div>
              ))}

              {formError && (
                <p className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
                  {formError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
