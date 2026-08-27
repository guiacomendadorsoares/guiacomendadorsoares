import { MapPin, Clock, Banknote, Flame, ArrowUpRight, Briefcase } from "lucide-react";
import type { Job } from "@/lib/jobs";
import { GlassCard } from "@/components/cards";
import { getTypeBadgeColor } from "@/lib/jobs";

export function JobCard({ job }: { job: Job }) {
  return (
    <GlassCard interactive className="overflow-hidden">
      {/* Top accent bar for urgent */}
      {job.urgent && <div className="gradient-brand h-1 w-full" />}

      <div className="p-4">
        {/* Header: Logo + Company + Type */}
        <div className="flex items-start gap-3">
          {/* 3D gradient logo */}
          <div
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white"
            style={{
              background: `linear-gradient(135deg, ${job.companyGradient[0]} 0%, ${job.companyGradient[1]} 100%)`,
              boxShadow: `0 8px 18px -8px ${job.companyGradient[0]}cc, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.2)`,
            }}
          >
            <span className="pointer-events-none absolute inset-x-2 top-1 h-2.5 rounded-full bg-white/35 blur-[1.5px]" />
            <span className="relative text-[13px] font-extrabold tracking-tight drop-shadow">
              {job.companyInitials}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-sm font-bold text-foreground">
              {job.company}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getTypeBadgeColor(job.type)}`}
              >
                {job.typeLabel}
              </span>
              {job.urgent && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-destructive">
                  <Flame className="h-3 w-3" />
                  Urgente
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Job Title */}
        <h4 className="mt-3 font-display text-[15px] font-bold leading-snug text-foreground">
          {job.title}
        </h4>

        {/* Details row */}
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Banknote className="h-3.5 w-3.5 shrink-0 text-primary-vibrant" />
            <span className="font-semibold text-foreground/80">{job.salary}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-vibrant" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary-vibrant" />
            <span>{job.postedAt}</span>
          </div>
        </div>

        {/* Short description */}
        {job.description && (
          <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {job.description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl gradient-brand text-xs font-bold text-primary-foreground shadow-elegant transition-transform active:scale-[0.98]"
          >
            <Briefcase className="h-3.5 w-3.5" />
            Candidatar-se
          </button>
          <button
            type="button"
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors active:bg-secondary"
          >
            Detalhes
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
