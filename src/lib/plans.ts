import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-auth";

export type PlanSlug = "free" | "destaque" | "ouro";

export interface BusinessFeatures {
  description_max?: number;
  logo: boolean;
  banner: boolean;
  gallery: boolean;
  gallery_max?: number;
  videos: boolean;
  social: boolean;
  website?: boolean;
  whatsapp: boolean;
  map?: boolean;
  directions?: boolean;
  promotions: boolean;
  max_promotions?: number;
  products?: boolean;
  max_products?: number;
  max_jobs_per_month?: number;
  photo_single?: boolean;
  stats: "none" | "basic" | "advanced";
  featured_home: boolean;
  featured_category: boolean;
  verified_badge: boolean;
  empresa_do_dia?: boolean;
  rotating_banner?: boolean;
  priority_search?: boolean;
  sponsored_posts?: boolean;
}
export interface PropertyFeatures {
  max_listings: number;
  max_photos: number;
  videos: boolean;
  featured_home: boolean;
  featured_search: boolean;
  stats: "none" | "basic" | "advanced";
  whatsapp: boolean;
  priority_search?: boolean;
}

export interface PlanFeatures {
  business: BusinessFeatures;
  properties: PropertyFeatures;
}

export interface Plan {
  id: string;
  name: string;
  slug: PlanSlug;
  description: string | null;
  price: number;
  active: boolean;
  features: PlanFeatures;
  sort_order: number;
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await (supabase as any)
        .from("subscription_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });
}

export function useCurrentPlan() {
  const { user } = useCurrentUser();
  const plans = usePlans();
  const profile = useQuery({
    queryKey: ["profile-plan", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("current_plan, plan_status, plan_expires_at")
        .eq("user_id", user!.id)
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
  const plan =
    plans.data?.find((p) => p.slug === slug) ?? plans.data?.find((p) => p.slug === "free") ?? null;
  return { slug, plan, allPlans: plans.data ?? [], loading: plans.isLoading || profile.isLoading };
}
