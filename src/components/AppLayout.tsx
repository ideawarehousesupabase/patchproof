import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Globe,
  AlertTriangle,
  Route as RouteIcon,
  FileCheck2,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/websites", label: "Websites", icon: Globe },
  { to: "/issues", label: "Issues", icon: AlertTriangle },
  { to: "/journeys", label: "Journeys", icon: RouteIcon },
  { to: "/evidence", label: "Evidence", icon: FileCheck2 },
] as const;

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">PatchProof AI</span>
          <span className="block text-[11px] text-muted-foreground">Web Change Assurance</span>
        </span>
      )}
    </div>
  );
}

export function AppLayout({
  title,
  breadcrumb,
  children,
}: {
  title: string;
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  const { user, sessionReady, signOut } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (sessionReady && !user) navigate({ to: "/" });
  }, [user, sessionReady, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
              PatchProof AI
            </span>
            <span className="block text-[11px] opacity-70">Web Change Assurance</span>
          </span>
        </div>
        <button
          className="rounded-md p-1 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "opacity-80 hover:bg-sidebar-accent/60 hover:opacity-100",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-3">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
              : "opacity-80 hover:bg-sidebar-accent/60 hover:opacity-100",
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <button
          onClick={() => {
            signOut();
            navigate({ to: "/" });
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm opacity-80 transition-colors hover:bg-sidebar-accent/60 hover:opacity-100"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-in slide-in-from-left absolute inset-y-0 left-0 w-64 duration-200">
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              className="rounded-md p-2 hover:bg-accent lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              {breadcrumb && (
                <div className="truncate text-xs text-muted-foreground">{breadcrumb}</div>
              )}
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm leading-tight font-medium">{user.fullName}</div>
                <div className="text-xs text-muted-foreground">{user.agencyName}</div>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
