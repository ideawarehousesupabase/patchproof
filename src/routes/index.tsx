import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findAccountByEmail, hashPassword } from "@/lib/account-store";
import { useApp } from "@/lib/app-state";
import { AuthAside } from "@/components/AuthAside";
import { PasswordInput } from "@/components/PasswordInput";
import { login as apiLogin, setAuthToken, isBackendConfigured } from "@/services/backendApi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — PatchProof AI Web Change Assurance" },
      {
        name: "description",
        content:
          "Sign in to the PatchProof AI workspace to monitor website changes, review AI repair proposals and validate business-critical journeys.",
      },
      { property: "og:title", content: "Sign in — PatchProof AI Web Change Assurance" },
      {
        property: "og:description",
        content:
          "Sign in to the PatchProof AI workspace to monitor website changes, review AI repair proposals and validate business-critical journeys.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/overview" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }
    setLoading(true);
    try {
      if (isBackendConfigured()) {
        // Single source of truth: the backend verifies credentials and returns the
        // authoritative account.id (the same id signed into the JWT), so the id used
        // for Firestore reads and the id every backend route looks data up under are
        // always the same document. Querying `findAccountByEmail` separately here (as
        // before) meant two independent, unordered `where("email", ...)` lookups that
        // could each pick a different document if more than one account ever shared
        // this email — causing "Website/Issue not found" on backend calls even though
        // the frontend could read the data fine.
        const result = await apiLogin(email, password);
        if (!result.ok) {
          setError(result.error || "Invalid email or password.");
          return;
        }
        window.sessionStorage.setItem("patchproof.token", result.data.token);
        setAuthToken(result.data.token);
        signIn({ ...result.data.account, passwordHash: "", createdAt: new Date().toISOString() });
        navigate({ to: "/overview" });
        return;
      }

      // No backend configured (offline/demo mode) — fall back to the client-only check.
      const account = await findAccountByEmail(email);
      if (!account || account.passwordHash !== hashPassword(password)) {
        setError("Invalid email or password.");
        return;
      }
      signIn(account);
      navigate({ to: "/overview" });
    } catch {
      setError("Unable to complete the request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

          <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your Web Change Assurance workspace.
          </p>

          <form onSubmit={onSubmit} autoComplete="off" className="mt-7 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.co.uk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Login
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            New to PatchProof?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
