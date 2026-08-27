import type { ReactNode } from "react";

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-dashed border-border bg-card/60 px-6 py-12 text-center shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, color-mix(in oklab, var(--primary) 14%, transparent) 0%, transparent 70%), radial-gradient(45% 40% at 100% 100%, color-mix(in oklab, var(--gold) 16%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="relative">
        {icon && (
          <div
            className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-primary-foreground shadow-elegant animate-fade-in"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--primary) 85%, black) 0%, var(--primary) 100%)",
              boxShadow:
                "0 12px 28px -14px color-mix(in oklab, var(--primary) 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <span className="scale-125">{icon}</span>
          </div>
        )}
        <p className="font-display text-lg font-bold tracking-tight text-foreground">{title}</p>
        {description && (
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4, height = "h-24" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full animate-pulse rounded-2xl border border-border bg-muted/60 ${height}`}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
