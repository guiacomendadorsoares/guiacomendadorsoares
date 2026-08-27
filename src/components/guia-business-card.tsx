import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck, Star } from "lucide-react";
import type { Business } from "@/lib/businesses";
import { GlassCard } from "@/components/cards";

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "•"
  );
}

export function GuiaBusinessCard({ b }: { b: Business }) {
  const logo = (b as any).logo_url as string | null | undefined;
  const initials = b.initials || initialsOf(b.name);
  const from = b.from || "#1f3a2e";
  const to = b.to || "#4a8a6b";

  return (
    <Link to="/empresa/$id" params={{ id: b.id }}>
      <GlassCard interactive className="p-3.5">
        <div className="flex gap-3">
          <div
            className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl text-white"
            style={{
              background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
              boxShadow: `0 10px 22px -10px ${from}cc, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 8px rgba(0,0,0,0.2)`,
            }}
          >
            {logo ? (
              <img src={logo} alt={b.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <>
                <span className="pointer-events-none absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/35 blur-[2px]" />
                <span className="relative font-display text-lg font-extrabold tracking-tight drop-shadow">
                  {initials}
                </span>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="flex items-center gap-1 truncate font-display text-[15px] font-bold text-foreground">
                  {b.name}
                  {b.verified && (
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary-vibrant" />
                  )}
                </h3>
                <p className="truncate text-[11px] font-medium text-primary-vibrant">
                  {b.categoryLabel || (b.subcategory ?? "")}
                </p>
              </div>
              {b.rating > 0 && (
                <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-foreground">
                  <Star className="h-3 w-3 fill-gold text-gold" />
                  {b.rating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="mt-1.5 flex items-start gap-1 text-[11.5px] text-muted-foreground">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{b.address}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
