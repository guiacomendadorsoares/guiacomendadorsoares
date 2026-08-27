import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, LogOut, ChevronDown } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useUserRoles, type AppRole } from "@/hooks/use-auth";
import { navForRole, type NavSection } from "@/lib/dashboard-nav";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";

function useDark() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };
  return { dark, toggle };
}

function NavList({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-6 py-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map(({ to, label, icon: Icon }) => {
              const active = to === pathname || (to !== "/" && pathname.startsWith(to + "/"));
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-elegant"
                    data-active={active}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 px-3 py-4">
      <img src={logoUrl} alt="" className="h-10 w-10 object-contain" />
      <span className="font-display text-sm font-bold leading-tight">
        Guia
        <br />
        Comendador Soares
      </span>
    </Link>
  );
}

export function DashboardShell({
  children,
  role,
  title,
  subtitle,
}: {
  children: ReactNode;
  role: AppRole;
  title: string;
  subtitle?: string;
}) {
  const sections = navForRole(role);
  const { user } = useCurrentUser();
  const { dark, toggle } = useDark();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <Brand />
        <div className="flex-1 overflow-y-auto px-3">
          <NavList sections={sections} />
        </div>
        <div className="border-t border-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-lg md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <Brand />
              <div className="px-3">
                <NavList sections={sections} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold leading-tight md:text-xl">
              {title}
            </h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Tema">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NotificationsBell variant="ghost" />
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-2 py-1 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full gradient-brand text-[11px] font-bold text-primary-foreground">
                {(user?.email ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[140px] truncate text-xs font-medium">{user?.email}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-primary/10 text-primary",
    pending: "bg-gold/20 text-gold-foreground",
    draft: "bg-secondary text-secondary-foreground",
    rejected: "bg-destructive/10 text-destructive",
  };
  const labels: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    draft: "Rascunho",
    rejected: "Rejeitado",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[status] ?? "bg-secondary"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function useRequireAnyRole(allowed: AppRole[]) {
  const { user, loading } = useCurrentUser();
  const { data: roles, isLoading } = useUserRoles(user?.id);
  const navigate = useNavigate();
  const allowedSet = new Set(allowed);
  const has = (roles ?? []).some((r) => allowedSet.has(r));
  useEffect(() => {
    if (loading || isLoading) return;
    if (!user) navigate({ to: "/auth", replace: true });
    else if (!has) navigate({ to: "/minha-conta", replace: true });
  }, [loading, isLoading, user, has, navigate]);
  return { ready: !loading && !isLoading && has, roles: roles ?? [] };
}
