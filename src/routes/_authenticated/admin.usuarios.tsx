import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/use-auth";
import { grantRole, revokeRole, setUserPlan } from "@/lib/admin.functions";
import { Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: UsuariosPage,
});

const ROLES: AppRole[] = ["admin", "editor", "partner", "broker", "influencer", "user"];
const PLANS = ["free", "destaque", "ouro"] as const;
type PlanSlug = (typeof PLANS)[number];

function UsuariosPage() {
  const qc = useQueryClient();
  const grantFn = useServerFn(grantRole);
  const revokeFn = useServerFn(revokeRole);
  const setPlanFn = useServerFn(setUserPlan);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, current_plan")
        .order("created_at", { ascending: false })
        .limit(100);
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const rolesByUser = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        if (!r.user_id) return;
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p: any) => ({ ...p, roles: rolesByUser.get(p.user_id) ?? [] }));
    },
  });

  const addRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      grantFn({ data: { userId, role } }),
    onSuccess: () => {
      toast.success("Perfil adicionado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      revokeFn({ data: { userId, role } }),
    onSuccess: () => {
      toast.success("Perfil removido");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePlan = useMutation({
    mutationFn: ({ userId, plan }: { userId: string; plan: PlanSlug }) =>
      setPlanFn({ data: { userId, plan } }),
    onSuccess: () => {
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p>Carregando…</p>;

  return (
    <div className="space-y-3">
      {(data ?? []).map((u) => (
        <UserRow
          key={u.id}
          user={u}
          onAdd={(role) => addRole.mutate({ userId: u.user_id, role })}
          onRemove={(role) => removeRole.mutate({ userId: u.user_id, role })}
          onPlan={(plan) => changePlan.mutate({ userId: u.user_id, plan })}
        />
      ))}
    </div>
  );
}

function UserRow({
  user,
  onAdd,
  onRemove,
  onPlan,
}: {
  user: any;
  onAdd: (r: AppRole) => void;
  onRemove: (r: AppRole) => void;
  onPlan: (p: PlanSlug) => void;
}) {
  const [picked, setPicked] = useState<AppRole>("user");
  const plan: PlanSlug = (user.current_plan ?? "free") as PlanSlug;
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{user.full_name ?? user.email ?? "Sem nome"}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              plan === "ouro"
                ? "gradient-brand text-primary-foreground"
                : plan === "destaque"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            <Crown className="h-3 w-3" /> {plan}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {user.roles.length === 0 && (
            <span className="text-xs text-muted-foreground">Sem perfis</span>
          )}
          {user.roles.map((r: AppRole) => (
            <button
              key={r}
              onClick={() => onRemove(r)}
              className="group rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium hover:bg-destructive hover:text-destructive-foreground"
              title="Clique para remover"
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Select value={plan} onValueChange={(v) => onPlan(v as PlanSlug)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLANS.map((p) => (
              <SelectItem key={p} value={p}>
                Plano {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={picked} onValueChange={(v) => setPicked(v as AppRole)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => onAdd(picked)}>
          Adicionar perfil
        </Button>
      </div>
    </div>
  );
}
