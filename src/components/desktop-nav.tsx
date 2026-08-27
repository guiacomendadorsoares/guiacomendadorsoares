import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, LayoutGrid, Heart, User } from "lucide-react";
import type { ComponentType } from "react";
import logoUrl from "@/assets/logo.png";

type Item = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

const items: Item[] = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/guia", label: "Categorias", icon: LayoutGrid },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function DesktopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky top-0 z-40 hidden border-b border-border bg-background/85 backdrop-blur-lg md:block"
    >
      <ul className="mx-auto flex max-w-6xl items-center gap-1 px-8 py-3 lg:px-12">
        <li className="mr-auto">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-base font-extrabold text-foreground"
          >
            <img src={logoUrl} alt="" className="h-8 w-8 object-contain" />
            Guia CS
          </Link>
        </li>
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                data-active={active}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:bg-secondary data-[active=true]:text-primary"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
