import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Crown,
  MoreHorizontal,
  History,
  ArrowUp,
  ArrowDown,
  Pause,
  Play,
  Gift,
  RefreshCw,
} from "lucide-react";
import {
  updateUserPlan,
  promoteUserPlan,
  demoteUserPlan,
  suspendUserPlan,
  reactivateUserPlan,
  grantTrial,
  renewUserPlan,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/gerenciar-planos")({
  component: GerenciarPlanosPage,
});

type PlanSlug = "free" | "destaque" | "ouro";
type PlanStatus = "active" | "suspended" | "canceled" | "trial";
type PlanSource = "manual_admin" | "asaas" | "promotion" | "courtesy" | "migration";

type PartnerRow = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  current_plan: PlanSlug;
  plan_status: PlanStatus;
  plan_source: PlanSource;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  plan_notes: string | null;
  roles: string[];
};

const PLAN_LABELS: Record<PlanSlug, string> = { free: "Free", destaque: "Destaque", ouro: "Ouro" };
const STATUS_LABELS: Record<PlanStatus, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  canceled: "Cancelado",
  trial: "Em teste",
};
const SOURCE_LABELS: Record<PlanSource, string> = {
  manual_admin: "Manual Admin",
  asaas: "Asaas",
  promotion: "Promoção",
  courtesy: "Cortesia",
  migration: "Migração",
};

function planBadgeVariant(plan: PlanSlug) {
  if (plan === "ouro") return "default" as const;
  if (plan === "destaque") return "secondary" as const;
  return "outline" as const;
}
function statusBadgeClass(status: PlanStatus) {
  if (status === "active") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "trial") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (status === "suspended") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  return "bg-destructive/15 text-destructive";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function GerenciarPlanosPage() {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<PartnerRow | null>(null);
  const [historyOf, setHistoryOf] = useState<PartnerRow | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-partner-plans"],
    queryFn: async (): Promise<PartnerRow[]> => {
      const { data: profs } = await (supabase as any)
        .from("profiles")
        .select(
          "id,user_id,email,full_name,avatar_url,current_plan,plan_status,plan_source,plan_started_at,plan_expires_at,plan_notes",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      const rows = (profs ?? []) as any[];
      const ids = rows.map((r) => r.user_id).filter(Boolean);
      let rolesMap = new Map<string, string[]>();
      if (ids.length) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids);
        for (const r of (roles ?? []) as any[]) {
          const arr = rolesMap.get(r.user_id) ?? [];
          arr.push(r.role);
          rolesMap.set(r.user_id, arr);
        }
      }
      return rows.map((r) => ({ ...r, roles: rolesMap.get(r.user_id) ?? [] }));
    },
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.filter((r) => {
      if (needle && !`${r.full_name ?? ""} ${r.email ?? ""}`.toLowerCase().includes(needle))
        return false;
      if (roleFilter !== "all" && !r.roles.includes(roleFilter)) return false;
      if (planFilter !== "all" && r.current_plan !== planFilter) return false;
      if (statusFilter !== "all" && r.plan_status !== statusFilter) return false;
      return true;
    });
  }, [data, q, roleFilter, planFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground">
          <Crown className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold">Gerenciar Planos</h1>
          <p className="text-sm text-muted-foreground">
            Controle manual de plano, status e validade para qualquer parceiro.
          </p>
        </div>
      </header>

      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 shadow-card md:grid-cols-[1fr_auto_auto_auto]">
        <Input
          placeholder="Buscar por nome ou email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos perfis</SelectItem>
            <SelectItem value="partner">Parceiros</SelectItem>
            <SelectItem value="broker">Corretores</SelectItem>
            <SelectItem value="influencer">Imprensa</SelectItem>
            <SelectItem value="user">Usuários</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="editor">Editores</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos planos</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="destaque">Destaque</SelectItem>
            <SelectItem value="ouro">Ouro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="trial">Em teste</SelectItem>
            <SelectItem value="suspended">Suspenso</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum parceiro encontrado.</p>
      )}

      <div className="grid gap-2">
        {filtered.map((row) => (
          <PartnerRowCard
            key={row.id}
            row={row}
            onEdit={() => setEditing(row)}
            onHistory={() => setHistoryOf(row)}
          />
        ))}
      </div>

      {editing && (
        <EditPlanDialog row={editing} open onOpenChange={(v) => !v && setEditing(null)} />
      )}
      {historyOf && (
        <HistoryDialog row={historyOf} open onOpenChange={(v) => !v && setHistoryOf(null)} />
      )}
    </div>
  );
}

function PartnerRowCard({
  row,
  onEdit,
  onHistory,
}: {
  row: PartnerRow;
  onEdit: () => void;
  onHistory: () => void;
}) {
  const qc = useQueryClient();
  const promote = useServerFn(promoteUserPlan);
  const demote = useServerFn(demoteUserPlan);
  const suspend = useServerFn(suspendUserPlan);
  const reactivate = useServerFn(reactivateUserPlan);
  const trial = useServerFn(grantTrial);
  const renew = useServerFn(renewUserPlan);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-partner-plans"] });
    qc.invalidateQueries({ queryKey: ["profile-plan"] });
    qc.invalidateQueries({ queryKey: ["owner-plan"] });
  };

  const run = (fn: () => Promise<any>, msg: string) =>
    fn()
      .then(() => {
        toast.success(msg);
        invalidate();
      })
      .catch((e: Error) => toast.error(e.message));

  const expired = row.plan_expires_at && new Date(row.plan_expires_at) < new Date();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {row.avatar_url ? (
          <img src={row.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-secondary" />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{row.full_name ?? row.email ?? "Sem nome"}</p>
          <p className="truncate text-xs text-muted-foreground">{row.email}</p>
          {row.roles.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {row.roles.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px]">
                  {r}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={planBadgeVariant(row.current_plan)}>{PLAN_LABELS[row.current_plan]}</Badge>
        <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(row.plan_status)}`}>
          {STATUS_LABELS[row.plan_status]}
        </span>
        <span className="text-xs text-muted-foreground">{SOURCE_LABELS[row.plan_source]}</span>
        <span className={`text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
          Venc: {fmtDate(row.plan_expires_at)}
        </span>

        <Button size="sm" variant="outline" onClick={onEdit}>
          Editar plano
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Ações rápidas</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => promote({ data: { userId: row.user_id, plan: "destaque" } }),
                  "Promovido para Destaque",
                )
              }
            >
              <ArrowUp className="mr-2 h-4 w-4" /> Promover para Destaque
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => promote({ data: { userId: row.user_id, plan: "ouro" } }),
                  "Promovido para Ouro",
                )
              }
            >
              <ArrowUp className="mr-2 h-4 w-4" /> Promover para Ouro
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                run(() => demote({ data: { userId: row.user_id } }), "Rebaixado para Free")
              }
            >
              <ArrowDown className="mr-2 h-4 w-4" /> Rebaixar para Free
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.plan_status === "suspended" ? (
              <DropdownMenuItem
                onClick={() =>
                  run(() => reactivate({ data: { userId: row.user_id } }), "Plano reativado")
                }
              >
                <Play className="mr-2 h-4 w-4" /> Reativar plano
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() =>
                  run(() => suspend({ data: { userId: row.user_id } }), "Plano suspenso")
                }
              >
                <Pause className="mr-2 h-4 w-4" /> Suspender plano
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Gift className="mr-2 h-4 w-4" /> Conceder teste gratuito
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => trial({ data: { userId: row.user_id, plan: "destaque", days: 7 } }),
                      "Teste de 7 dias concedido",
                    )
                  }
                >
                  Destaque — 7 dias
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => trial({ data: { userId: row.user_id, plan: "destaque", days: 15 } }),
                      "Teste de 15 dias concedido",
                    )
                  }
                >
                  Destaque — 15 dias
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => trial({ data: { userId: row.user_id, plan: "destaque", days: 30 } }),
                      "Teste de 30 dias concedido",
                    )
                  }
                >
                  Destaque — 30 dias
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => trial({ data: { userId: row.user_id, plan: "ouro", days: 7 } }),
                      "Teste de 7 dias concedido",
                    )
                  }
                >
                  Ouro — 7 dias
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => trial({ data: { userId: row.user_id, plan: "ouro", days: 15 } }),
                      "Teste de 15 dias concedido",
                    )
                  }
                >
                  Ouro — 15 dias
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => trial({ data: { userId: row.user_id, plan: "ouro", days: 30 } }),
                      "Teste de 30 dias concedido",
                    )
                  }
                >
                  Ouro — 30 dias
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RefreshCw className="mr-2 h-4 w-4" /> Renovar plano
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => renew({ data: { userId: row.user_id, days: 30 } }),
                      "Renovado por 30 dias",
                    )
                  }
                >
                  + 30 dias
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => renew({ data: { userId: row.user_id, days: 90 } }),
                      "Renovado por 90 dias",
                    )
                  }
                >
                  + 90 dias
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () => renew({ data: { userId: row.user_id, days: 365 } }),
                      "Renovado por 1 ano",
                    )
                  }
                >
                  + 365 dias
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onHistory}>
              <History className="mr-2 h-4 w-4" /> Ver histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function EditPlanDialog({
  row,
  open,
  onOpenChange,
}: {
  row: PartnerRow;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const update = useServerFn(updateUserPlan);
  const [plan, setPlan] = useState<PlanSlug>(row.current_plan);
  const [status, setStatus] = useState<PlanStatus>(row.plan_status);
  const [source, setSource] = useState<PlanSource>(row.plan_source);
  const [startedAt, setStartedAt] = useState(
    row.plan_started_at ? row.plan_started_at.slice(0, 10) : "",
  );
  const [noExpiry, setNoExpiry] = useState(!row.plan_expires_at);
  const [expiresAt, setExpiresAt] = useState(
    row.plan_expires_at ? row.plan_expires_at.slice(0, 10) : "",
  );
  const [reason, setReason] = useState("");

  const save = useMutation({
    mutationFn: async () =>
      update({
        data: {
          userId: row.user_id,
          plan,
          status,
          source,
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          expiresAt: noExpiry ? null : expiresAt ? new Date(expiresAt).toISOString() : null,
          reason: reason || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["admin-partner-plans"] });
      qc.invalidateQueries({ queryKey: ["profile-plan"] });
      qc.invalidateQueries({ queryKey: ["owner-plan"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar plano — {row.full_name ?? row.email}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <Label className="text-xs">Plano</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as PlanSlug)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="destaque">Destaque</SelectItem>
                  <SelectItem value="ouro">Ouro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PlanStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="trial">Em teste</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Origem</Label>
              <Select value={source} onValueChange={(v) => setSource(v as PlanSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_admin">Manual Admin</SelectItem>
                  <SelectItem value="asaas">Asaas</SelectItem>
                  <SelectItem value="promotion">Promoção</SelectItem>
                  <SelectItem value="courtesy">Cortesia</SelectItem>
                  <SelectItem value="migration">Migração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label className="text-xs">Data de início</Label>
              <Input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data de vencimento</Label>
              <Input
                type="date"
                value={expiresAt}
                disabled={noExpiry}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={noExpiry} onCheckedChange={setNoExpiry} />
                Sem vencimento
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs">Motivo / observação</Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Opcional — fica no histórico"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  row,
  open,
  onOpenChange,
}: {
  row: PartnerRow;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["plan-audit-log", row.user_id],
    enabled: open,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("plan_audit_log")
        .select("*")
        .eq("profile_user_id", row.user_id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de plano — {row.full_name ?? row.email}</DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem alterações registradas.</p>
        )}
        <div className="grid gap-2 max-h-[60vh] overflow-auto">
          {data.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {r.previous_plan ?? "—"} → <strong>{r.new_plan ?? "—"}</strong>
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Status: {r.previous_status ?? "—"} → {r.new_status ?? "—"} · Origem:{" "}
                {r.previous_source ?? "—"} → {r.new_source ?? "—"} · Venc:{" "}
                {fmtDate(r.previous_expires_at)} → {fmtDate(r.new_expires_at)}
              </div>
              {r.reason && <p className="mt-1 text-xs">Motivo: {r.reason}</p>}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
