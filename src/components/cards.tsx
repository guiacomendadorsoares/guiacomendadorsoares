import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/** Discreet glass surface used in premium cards. */
export function GlassCard({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/40 bg-white/70 shadow-card backdrop-blur-md transition-all duration-200 dark:border-white/10 dark:bg-white/[0.04] ${
        interactive
          ? "hover:-translate-y-0.5 hover:shadow-elegant hover:border-primary/30 cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function HScroll({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-3 pb-1">{children}</div>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  to,
}: {
  title: string;
  subtitle?: string;
  to?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="shrink-0 text-xs font-semibold text-primary-vibrant">
          Ver tudo →
        </Link>
      )}
    </div>
  );
}
