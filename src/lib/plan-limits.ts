import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlanSlug, Plan } from "@/lib/plans";
import { usePlans, useCurrentPlan } from "@/lib/plans";

export type PlanKind = "business" | "properties" | "pharmacy";

/** Get any user's current plan slug (used to gate public pages). */
export function useOwnerPlan(userId: string | null | undefined) {
  const plans = usePlans();
  const profile = useQuery({
    queryKey: ["owner-plan", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("current_plan, plan_status, plan_expires_at")
        .eq("user_id", userId!)
        .maybeSingle();
      if (!data) return "free" as PlanSlug;
      if (data.plan_status === "suspended" || data.plan_status === "canceled")
        return "free" as PlanSlug;
      if (data.plan_expires_at && new Date(data.plan_expires_at) < new Date())
        return "free" as PlanSlug;
      return (data.current_plan ?? "free") as PlanSlug;
    },
  });
  const slug: PlanSlug = profile.data ?? "free";
  const plan: Plan | null =
    plans.data?.find((p) => p.slug === slug) ?? plans.data?.find((p) => p.slug === "free") ?? null;
  return { slug, plan, loading: plans.isLoading || profile.isLoading };
}

export function getFeatures(plan: Plan | null, kind: PlanKind): any {
  return (plan?.features as any)?.[kind] ?? {};
}

/** Business feature gate: safe check for any boolean feature */
export function can(plan: Plan | null, kind: PlanKind, feature: string): boolean {
  return !!getFeatures(plan, kind)[feature];
}

/** Return numeric limit; -1 means unlimited, 0 means blocked */
export function limit(plan: Plan | null, kind: PlanKind, key: string): number {
  const v = getFeatures(plan, kind)[key];
  return typeof v === "number" ? v : 0;
}

export function formatLimit(n: number): string {
  return n === -1 ? "∞" : String(n);
}

/** Live usage counters used by dashboards */
export function useUsageCounts(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["plan-usage", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [biz, props, jobs] = await Promise.all([
        supabase
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("submitted_by", userId!),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("submitted_by", userId!),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("submitted_by", userId!)
          .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
      ]);
      // pharmacy products belonging to user-owned businesses
      const bizIds =
        (await supabase.from("businesses").select("id").eq("submitted_by", userId!)).data ?? [];
      let productCount = 0;
      if (bizIds.length) {
        const { count } = await supabase
          .from("pharmacy_products")
          .select("id", { count: "exact", head: true })
          .in(
            "business_id",
            bizIds.map((b: any) => b.id),
          );
        productCount = count ?? 0;
      }
      return {
        businesses: biz.count ?? 0,
        properties: props.count ?? 0,
        jobsThisMonth: jobs.count ?? 0,
        products: productCount,
      };
    },
  });
}

export function useLimits() {
  const { plan, slug, loading } = useCurrentPlan();
  return {
    slug,
    plan,
    loading,
    business: (plan?.features as any)?.business ?? {},
    properties: (plan?.features as any)?.properties ?? {},
    pharmacy: (plan?.features as any)?.pharmacy ?? {},
    can: (kind: PlanKind, f: string) => can(plan, kind, f),
    limit: (kind: PlanKind, k: string) => limit(plan, kind, k),
  };
}
