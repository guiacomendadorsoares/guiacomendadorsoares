import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell, useRequireAnyRole, StatusBadge } from "@/components/dashboard-shell";
import { ContentCrud } from "@/components/content-crud";
import { MyPlanCard } from "@/components/my-plan-card";
import { useCurrentUser } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PharmacyProductsManager } from "@/components/pharmacy-products-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Loader2,
  Users,
  Plus,
  Trash2,
  ShieldCheck,
  ExternalLink,
  History,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import {
  listMyBusinesses,
  listTeam,
  inviteMemberByEmail,
  updateMemberRole,
  removeMember,
  canManageTeam,
  canEditBusiness,
  ROLE_LABEL,
  ROLE_DESC,
  ASSIGNABLE_ROLES,
  listBusinessAudit,
  transferOwnership,
  type MyBusiness,
  type MemberRole,
  type TeamMember,
} from "@/lib/business-owner";

export const Route = createFileRoute("/_authenticated/painel-empresa")({
  component: PainelEmpresa,
});

function PainelEmpresa() {
  const { ready } = useRequireAnyRole(["partner", "admin"]);
  const { user } = useCurrentUser();

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["my-businesses", user?.id],
    queryFn: () => listMyBusinesses(user!.id),
    enabled: !!user?.id,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () =>
      businesses?.find((b) => b.id === (selectedId ?? businesses?.[0]?.id)) ??
      businesses?.[0] ??
      null,
    [businesses, selectedId],
  );

  if (!ready || !user) return null;

  return (
    <DashboardShell
      role="partner"
      title="Painel da Empresa"
      subtitle="Gerencie sua presença no Guia"
    >
      <div className="space-y-6">
        <MyPlanCard kind="business" />

        {/* Business selector */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold">Minhas empresas</h2>
          </div>
          {isLoading ? (
            <div className="grid place-items-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : !businesses?.length ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma empresa vinculada ainda. Cadastre uma nova ou reivindique uma existente pelo
              Guia.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((b) => (
                <BusinessTile
                  key={b.id}
                  b={b}
                  active={selected?.id === b.id}
                  onClick={() => setSelectedId(b.id)}
                />
              ))}
            </div>
          )}
        </section>

        {selected && (
          <Tabs defaultValue="empresa" key={selected.id}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="empresa">Dados</TabsTrigger>
              <TabsTrigger value="equipe">
                <Users className="mr-1 h-3.5 w-3.5" /> Equipe
              </TabsTrigger>
              <TabsTrigger value="farmacia">💊 Farmácia</TabsTrigger>
              <TabsTrigger value="vagas">Vagas</TabsTrigger>
              <TabsTrigger value="eventos">Eventos</TabsTrigger>
              <TabsTrigger value="auditoria">
                <History className="mr-1 h-3.5 w-3.5" /> Auditoria
              </TabsTrigger>
              {selected.is_primary_owner && (
                <TabsTrigger value="titularidade">
                  <Crown className="mr-1 h-3.5 w-3.5" /> Titularidade
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="empresa" className="mt-4">
              {canEditBusiness(selected.role, selected.is_primary_owner) ? (
                <ContentCrud table="businesses" ownerOnly={user.id} forcePending />
              ) : (
                <ReadOnlyNotice roleLabel={ROLE_LABEL[selected.role]} />
              )}
            </TabsContent>

            <TabsContent value="equipe" className="mt-4">
              <TeamManager
                business={selected}
                canManage={canManageTeam(selected.role, selected.is_primary_owner)}
                currentUserId={user.id}
              />
            </TabsContent>

            <TabsContent value="farmacia" className="mt-4">
              <PharmacyProductsManager userId={user.id} />
            </TabsContent>

            <TabsContent value="vagas" className="mt-4">
              <ContentCrud table="jobs" ownerOnly={user.id} forcePending />
            </TabsContent>

            <TabsContent value="eventos" className="mt-4">
              <ContentCrud table="events" ownerOnly={user.id} forcePending />
            </TabsContent>

            <TabsContent value="auditoria" className="mt-4">
              <AuditTimeline businessId={selected.id} />
            </TabsContent>

            {selected.is_primary_owner && (
              <TabsContent value="titularidade" className="mt-4">
                <OwnershipTransfer business={selected} currentUserId={user.id} />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </DashboardShell>
  );
}

function BusinessTile({
  b,
  active,
  onClick,
}: {
  b: MyBusiness;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/40"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
        {b.cover_url ? (
          <img src={b.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{b.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            {ROLE_LABEL[b.role]}
          </span>
          {b.is_primary_owner && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
              <ShieldCheck className="h-2.5 w-2.5" /> Titular
            </span>
          )}
          {b.status && <StatusBadge status={b.status as any} />}
        </div>
      </div>
      <Link
        to="/empresa/$id"
        params={{ id: b.id }}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted"
        title="Ver no Guia"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </button>
  );
}

function ReadOnlyNotice({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      Seu papel <strong>{roleLabel}</strong> não permite editar os dados desta empresa. Peça ao
      proprietário ou gerente para atualizar seu papel para <strong>Editor</strong> ou superior.
    </div>
  );
}

function TeamManager({
  business,
  canManage,
  currentUserId,
}: {
  business: MyBusiness;
  canManage: boolean;
  currentUserId: string;
}) {
  const qc = useQueryClient();
  const queryKey = ["business-team", business.id];
  const { data: team, isLoading } = useQuery({
    queryKey,
    queryFn: () => listTeam(business.id),
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);

  const invite = useMutation({
    mutationFn: () => inviteMemberByEmail({ businessId: business.id, email, role }),
    onSuccess: () => {
      toast.success("Membro adicionado à equipe.");
      setEmail("");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: (p: { id: string; role: MemberRole }) => updateMemberRole(p.id, p.role),
    onSuccess: () => {
      toast.success("Papel atualizado.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeMember(id),
    onSuccess: () => {
      toast.success("Membro removido.");
      setConfirmRemove(null);
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-bold">Adicionar membro</h3>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate();
            }}
            className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                E-mail cadastrado
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pessoa@exemplo.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Papel</Label>
              <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={invite.isPending} className="w-full sm:w-auto">
                {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
              </Button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            A pessoa precisa ter conta no Guia com o mesmo e-mail. {ROLE_DESC[role]}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-bold">Equipe ({team?.length ?? 0})</h3>
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : !team?.length ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum membro vinculado ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {team.map((m) => {
              const isSelf = m.user_id === currentUserId;
              const editable = canManage && !m.is_primary_owner && !isSelf;
              return (
                <li
                  key={m.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm">
                      {m.profile?.full_name || m.profile?.email || "Sem nome"}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(você)</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.profile?.email ?? "—"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {m.is_primary_owner && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                          <ShieldCheck className="h-2.5 w-2.5" /> Titular
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editable ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) =>
                          changeRole.mutate({ id: m.id, role: v as MemberRole })
                        }
                      >
                        <SelectTrigger className="h-9 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                        {ROLE_LABEL[m.role]}
                      </span>
                    )}
                    {editable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setConfirmRemove({
                            id: m.id,
                            name: m.profile?.full_name || m.profile?.email || "membro",
                          })
                        }
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {confirmRemove?.name} da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta pessoa perderá o acesso à empresa imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && remove.mutate(confirmRemove.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============= Audit Timeline =============
const ACTION_LABEL: Record<string, string> = {
  member_invited: "Membro adicionado",
  member_reactivated: "Membro reativado",
  member_role_changed: "Papel alterado",
  member_removed: "Membro removido",
  ownership_transferred: "Titularidade transferida",
};

function fmtValue(v: any): string {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function AuditTimeline({ businessId }: { businessId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["business-audit", businessId],
    queryFn: () => listBusinessAudit(businessId, 200),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-bold">Histórico de alterações</h3>
      </div>
      {isLoading ? (
        <div className="grid place-items-center py-6">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : !data?.length ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma ação registrada ainda.
        </p>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-4">
          {data.map((row) => (
            <li key={row.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {ACTION_LABEL[row.action] ?? row.action}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm">
                  Por <strong>{row.actor?.full_name || row.actor?.email || "Sistema"}</strong>
                </p>
                {(row.previous_value || row.new_value) && (
                  <div className="mt-1.5 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    {row.previous_value && (
                      <div>
                        <span className="font-semibold">Antes:</span> {fmtValue(row.previous_value)}
                      </div>
                    )}
                    {row.new_value && (
                      <div>
                        <span className="font-semibold">Depois:</span> {fmtValue(row.new_value)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ============= Ownership Transfer =============
function OwnershipTransfer({
  business,
  currentUserId,
}: {
  business: MyBusiness;
  currentUserId: string;
}) {
  const qc = useQueryClient();
  const { data: team, isLoading } = useQuery({
    queryKey: ["business-team", business.id],
    queryFn: () => listTeam(business.id),
  });
  const candidates = (team ?? []).filter(
    (m) => !m.is_primary_owner && m.user_id !== currentUserId && m.status === "active",
  );
  const [targetId, setTargetId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<TeamMember | null>(null);

  const mut = useMutation({
    mutationFn: (t: TeamMember) =>
      transferOwnership({
        businessId: business.id,
        newOwnerUserId: t.user_id,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Titularidade transferida com sucesso.");
      setConfirmTarget(null);
      setTargetId("");
      setReason("");
      qc.invalidateQueries({ queryKey: ["business-team", business.id] });
      qc.invalidateQueries({ queryKey: ["business-audit", business.id] });
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-600" />
        <h3 className="font-display text-sm font-bold">Transferir titularidade</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Ao transferir, você deixa de ser o proprietário desta empresa e assume o papel de{" "}
        <strong>Gerente</strong>. O novo titular terá controle total, incluindo o plano de
        assinatura. Esta ação é registrada na auditoria.
      </p>

      {isLoading ? (
        <div className="grid place-items-center py-6">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : !candidates.length ? (
        <p className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
          Adicione um membro à equipe antes de transferir a titularidade.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Novo proprietário</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((m) => (
                  <SelectItem key={m.id} value={m.user_id}>
                    {m.profile?.full_name || m.profile?.email || m.user_id} · {ROLE_LABEL[m.role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ex.: venda da empresa, mudança de sócio…"
            />
          </div>
          <div>
            <Button
              variant="destructive"
              disabled={!targetId || mut.isPending}
              onClick={() => {
                const t = candidates.find((c) => c.user_id === targetId);
                if (t) setConfirmTarget(t);
              }}
            >
              {mut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Transferir titularidade"
              )}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar transferência?</AlertDialogTitle>
            <AlertDialogDescription>
              Você deixará de ser o proprietário de <strong>{business.name}</strong> e passará para
              <strong> {confirmTarget?.profile?.full_name || confirmTarget?.profile?.email}</strong>
              . Esta ação não pode ser desfeita sem o consentimento do novo titular.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmTarget && mut.mutate(confirmTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar transferência
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
