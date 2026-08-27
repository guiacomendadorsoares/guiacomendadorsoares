import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, LayoutGrid, Heart, User } from "lucide-react";
import type { ComponentType } from "react";

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

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/85 backdrop-blur-lg safe-bottom md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className="group relative flex flex-col items-center justify-center gap-1 px-2 pt-2 pb-1 text-[11px] font-medium text-muted-foreground transition-colors data-[active=true]:text-primary"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full transition-all duration-300 ease-out will-change-transform group-hover:-translate-y-0.5 group-active:scale-90 group-data-[active=true]:scale-110 group-data-[active=true]:gradient-brand group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-elegant motion-reduce:transform-none motion-reduce:transition-none">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="leading-none">{label}</span>
                <span
                  aria-hidden
                  className={`absolute -top-px h-[3px] rounded-full bg-primary transition-all duration-300 ease-out ${
                    active ? "w-8 opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
