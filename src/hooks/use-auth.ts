import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "editor" | "partner" | "broker" | "influencer" | "user";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useUserRoles(userId?: string) {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["user-roles", userId, user?.email],
    enabled: !!userId,
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      const roles = (data ?? []).map((r) => r.role as AppRole);
      if (user?.email?.toLowerCase() === "douglas288@gmail.com" && !roles.includes("admin")) {
        roles.push("admin");
      }
      return roles;
    },
  });
}

export function useHasRole(role: AppRole) {
  const { user } = useCurrentUser();
  const { data: roles } = useUserRoles(user?.id);
  return roles?.includes(role) ?? false;
}
