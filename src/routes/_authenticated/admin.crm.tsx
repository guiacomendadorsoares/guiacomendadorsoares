import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Building2,
  Calendar,
  Clock,
  MoreHorizontal,
  Trash2,
  Edit3,
  History as HistoryIcon,
  Pause,
  Play,
  Gift,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  DollarSign,
  BarChart3,
  ListChecks,
  LayoutGrid,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useHasRole } from "@/hooks/use-auth";
import {
  listCrmLeads,
  upsertCrmLead,
  deleteCrmLead,
  moveCrmLeadStage,
  addCrmActivity,
  listCrmActivities,
  addCrmReminder,
  toggleCrmReminder,
  listCrmReminders,
  listCrmAudit,
} from "@/lib/crm.functions";
import {
  promoteUserPlan,
  demoteUserPlan,
  suspendUserPlan,
  reactivateUserPlan,
  grantTrial,
  renewUserPlan,
  updateUserPlan,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/crm")({
  component: CrmPage,
});

type Stage =
  | "lead"
  | "contato"
  | "visita"
  | "proposta"
  | "negociacao"
  | "teste"
  | "ativo"
  | "renovacao"
  | "cancelado";

type PartnerType = "empresa" | "farmacia" | "corretor" | "imobiliaria" | "lead";
type PlanSlug = "free" | "destaque" | "ouro";
type PlanSource = "manual_admin" | "asaas" | "promotion" | "courtesy" | "migration";

type Lead = {
  id: string;
  user_id: string | null;
  company_name: string;
  logo_url: string | null;
  category: string | null;
  partner_type: PartnerType;
  contact_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  stage: Stage;
  plan_slug: PlanSlug;
  plan_source: PlanSource;
  monthly_value: number | null;
  next_action: string | null;
  next_action_at: string | null;
  renewal_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const STAGE_ORDER: Stage[] = [
  "lead",
  "contato",
  "visita",
  "proposta",
  "negociacao",
  "teste",
  "ativo",
  "renovacao",
  "cancelado",
];
const STAGE_LABELS: Record<Stage, string> = {
  lead: "🟡 Lead",
  contato: "🔵 Primeiro Contato",
  visita: "🟠 Visita Agendada",
  proposta: "🟣 Proposta Enviada",
  negociacao: "🟢 Negociação",
  teste: "🟢 Teste Gratuito",
  ativo: "⭐ Cliente Ativo",
  renovacao: "🟡 Renovação",
  cancelado: "🔴 Cancelado",
};
const STAGE_COLOR: Record<Stage, string> = {
  lead: "bg-muted text-muted-foreground border-muted-foreground/20",
  contato: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  visita: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  proposta: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  negociacao: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  teste: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  ativo: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  renovacao: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
};

const PLAN_LABEL: Record<PlanSlug, string> = { free: "Free", destaque: "Destaque", ouro: "Ouro" };
const PLAN_VARIANT: Record<PlanSlug, "default" | "secondary" | "outline"> = {
  ouro: "default",
  destaque: "secondary",
  free: "outline",
};
const PARTNER_LABEL: Record<PartnerType, string> = {
  empresa: "Empresa",
  farmacia: "Farmácia",
  corretor: "Corretor",
  imobiliaria: "Imobiliária",
  lead: "Lead",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}
function fmtMoney(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86400_000);
}

/* -------------------- Root page -------------------- */

function CrmPage() {
  const isAdmin = useHasRole("admin");
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        O CRM Comercial é exclusivo do Admin Master.
      </div>
    );
  }

  const list = useServerFn(listCrmLeads);
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["crm-leads"],
    queryFn: () => list(),
  });

  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold">CRM Comercial</h1>
            <p className="text-sm text-muted-foreground">
              Gestão completa da carteira de parceiros — do lead à renovação.
            </p>
          </div>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Lead
        </Button>
      </header>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="funil">
            <LayoutGrid className="mr-2 h-4 w-4" /> Funil
          </TabsTrigger>
          <TabsTrigger value="renovacoes">
            <RefreshCw className="mr-2 h-4 w-4" /> Renovações
          </TabsTrigger>
          <TabsTrigger value="relatorios">
            <ListChecks className="mr-2 h-4 w-4" /> Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab leads={leads as Lead[]} loading={isLoading} />
        </TabsContent>
        <TabsContent value="funil" className="mt-4">
          <FunnelTab leads={leads as Lead[]} loading={isLoading} onOpen={setOpenLead} />
        </TabsContent>
        <TabsContent value="renovacoes" className="mt-4">
          <RenewalsTab leads={leads as Lead[]} onOpen={setOpenLead} />
        </TabsContent>
        <TabsContent value="relatorios" className="mt-4">
          <ReportsTab leads={leads as Lead[]} />
        </TabsContent>
      </Tabs>

      {openLead && <LeadSheet lead={openLead} onClose={() => setOpenLead(null)} />}
      {newOpen && <LeadFormDialog open onOpenChange={setNewOpen} lead={null} />}
    </div>
  );
}

/* -------------------- Dashboard -------------------- */

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 shadow-card ${tone ?? ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function DashboardTab({ leads, loading }: { leads: Lead[]; loading: boolean }) {
  const stats = useMemo(() => {
    const total = leads.length;
    const byPlan = { free: 0, destaque: 0, ouro: 0 };
    const byType = { empresa: 0, farmacia: 0, corretor: 0, imobiliaria: 0, lead: 0 };
    let trial = 0,
      ativo = 0,
      suspenso = 0,
      cancelado = 0,
      renovProx = 0;
    for (const l of leads) {
      byPlan[l.plan_slug]++;
      byType[l.partner_type]++;
      if (l.stage === "teste") trial++;
      if (l.stage === "ativo") ativo++;
      if (l.stage === "cancelado") cancelado++;
      const d = daysUntil(l.renewal_at);
      if (d != null && d >= 0 && d <= 30) renovProx++;
    }
    return { total, byPlan, byType, trial, ativo, suspenso, cancelado, renovProx };
  }, [leads]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total de Leads" value={stats.total} />
      <StatCard label="Empresas Free" value={stats.byPlan.free} />
      <StatCard label="Empresas Destaque" value={stats.byPlan.destaque} />
      <StatCard label="Empresas Ouro" value={stats.byPlan.ouro} />
      <StatCard label="Farmácias" value={stats.byType.farmacia} />
      <StatCard label="Corretores" value={stats.byType.corretor} />
      <StatCard label="Imobiliárias" value={stats.byType.imobiliaria} />
      <StatCard label="Clientes em Teste" value={stats.trial} />
      <StatCard label="Clientes Ativos" value={stats.ativo} />
      <StatCard label="Renovações Próximas (30d)" value={stats.renovProx} />
      <StatCard label="Cancelados" value={stats.cancelado} />
      <StatCard label="Empresas" value={stats.byType.empresa} />
    </div>
  );
}

/* -------------------- Funnel (Kanban) -------------------- */

function FunnelTab({
  leads,
  loading,
  onOpen,
}: {
  leads: Lead[];
  loading: boolean;
  onOpen: (l: Lead) => void;
}) {
  const qc = useQueryClient();
  const move = useServerFn(moveCrmLeadStage);
  const [q, setQ] = useState("");
  const [planF, setPlanF] = useState<string>("all");
  const [typeF, setTypeF] = useState<string>("all");
  const [dragging, setDragging] = useState<Lead | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (
        needle &&
        !`${l.company_name} ${l.contact_name ?? ""} ${l.phone ?? ""} ${l.email ?? ""} ${l.category ?? ""}`
          .toLowerCase()
          .includes(needle)
      )
        return false;
      if (planF !== "all" && l.plan_slug !== planF) return false;
      if (typeF !== "all" && l.partner_type !== typeF) return false;
      return true;
    });
  }, [leads, q, planF, typeF]);

  const byStage = useMemo(() => {
    const map = new Map<Stage, Lead[]>();
    for (const s of STAGE_ORDER) map.set(s, []);
    for (const l of filtered) map.get(l.stage)!.push(l);
    return map;
  }, [filtered]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    setDragging(leads.find((l) => l.id === id) ?? null);
  };
  const onDragEnd = async (e: DragEndEvent) => {
    const leadId = String(e.active.id);
    const target = e.over?.id as Stage | undefined;
    setDragging(null);
    if (!target || !STAGE_ORDER.includes(target)) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === target) return;
    qc.setQueryData(["crm-leads"], (prev: Lead[] = []) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: target } : l)),
    );
    try {
      await move({ data: { id: leadId, stage: target } });
      toast.success("Estágio atualizado");
    } catch (err: any) {
      toast.error(err.message);
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 shadow-card md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, telefone, email, categoria…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={planF} onValueChange={setPlanF}>
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
        <Select value={typeF} onValueChange={setTypeF}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="empresa">Empresa</SelectItem>
            <SelectItem value="farmacia">Farmácia</SelectItem>
            <SelectItem value="corretor">Corretor</SelectItem>
            <SelectItem value="imobiliaria">Imobiliária</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STAGE_ORDER.map((s) => (
            <KanbanColumn key={s} stage={s} leads={byStage.get(s) ?? []} onOpen={onOpen} />
          ))}
        </div>
        <DragOverlay>
          {dragging && (
            <div className="rotate-2 opacity-90">
              <LeadCard lead={dragging} onOpen={() => {}} compact />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  stage,
  leads,
  onOpen,
}: {
  stage: Stage;
  leads: Lead[];
  onOpen: (l: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div className="flex w-[280px] shrink-0 flex-col gap-2">
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium ${STAGE_COLOR[stage]}`}
      >
        <span>{STAGE_LABELS[stage]}</span>
        <span className="rounded-full bg-background/60 px-2 text-xs">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[400px] flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-border/60 bg-muted/30"
        }`}
      >
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  onOpen,
  compact,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const dLeft = daysUntil(lead.renewal_at);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border bg-card p-3 shadow-sm transition ${
        isDragging ? "opacity-30" : "hover:border-primary/40 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 h-8 w-8 shrink-0 cursor-grab overflow-hidden rounded-lg bg-muted"
          aria-label="Arrastar"
        >
          {lead.logo_url ? (
            <img src={lead.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(lead)}>
          <p className="truncate text-sm font-semibold">{lead.company_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {lead.category ?? PARTNER_LABEL[lead.partner_type]}
          </p>
        </button>
        <Badge variant={PLAN_VARIANT[lead.plan_slug]} className="shrink-0">
          {PLAN_LABEL[lead.plan_slug]}
        </Badge>
      </div>
      {!compact && (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {lead.contact_name && <p className="truncate">👤 {lead.contact_name}</p>}
          {lead.phone && <p className="truncate">📞 {lead.phone}</p>}
          {lead.next_action && <p className="truncate text-foreground">→ {lead.next_action}</p>}
          {lead.renewal_at && (
            <p className={dLeft != null && dLeft < 0 ? "text-destructive" : ""}>
              🔁 Renov: {fmtDate(lead.renewal_at)} {dLeft != null && `(${dLeft}d)`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------- Renewals -------------------- */

function RenewalsTab({ leads, onOpen }: { leads: Lead[]; onOpen: (l: Lead) => void }) {
  const buckets = useMemo(() => {
    const b: Record<string, Lead[]> = { hoje: [], d7: [], d15: [], d30: [], atraso: [] };
    for (const l of leads) {
      const d = daysUntil(l.renewal_at);
      if (d == null) continue;
      if (d < 0) b.atraso.push(l);
      else if (d === 0) b.hoje.push(l);
      else if (d <= 7) b.d7.push(l);
      else if (d <= 15) b.d15.push(l);
      else if (d <= 30) b.d30.push(l);
    }
    return b;
  }, [leads]);

  const sections: Array<[string, string, Lead[]]> = [
    ["Vence Hoje", "bg-destructive/10", buckets.hoje],
    ["Atrasados", "bg-destructive/10", buckets.atraso],
    ["Vence em 7 dias", "bg-amber-500/10", buckets.d7],
    ["Vence em 15 dias", "bg-amber-500/10", buckets.d15],
    ["Vence em 30 dias", "bg-blue-500/10", buckets.d30],
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {sections.map(([label, tone, items]) => (
        <div key={label} className={`rounded-xl border border-border p-3 ${tone}`}>
          <p className="mb-2 text-sm font-semibold">
            {label} · <span className="text-muted-foreground">{items.length}</span>
          </p>
          <div className="grid gap-2">
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum registro.</p>
            )}
            {items.map((l) => (
              <button
                key={l.id}
                onClick={() => onOpen(l)}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-2 text-left text-sm hover:border-primary/40"
              >
                <span className="truncate font-medium">{l.company_name}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(l.renewal_at)}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------- Reports -------------------- */

function ReportsTab({ leads }: { leads: Lead[] }) {
  const groups = useMemo(() => {
    const byPlan = new Map<string, number>();
    const byCat = new Map<string, number>();
    const byBairro = new Map<string, number>();
    let novos30 = 0,
      renov30 = 0,
      cancel30 = 0;
    const now = Date.now();
    for (const l of leads) {
      byPlan.set(l.plan_slug, (byPlan.get(l.plan_slug) ?? 0) + 1);
      const cat = l.category ?? "—";
      byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
      const b = l.neighborhood ?? "—";
      byBairro.set(b, (byBairro.get(b) ?? 0) + 1);
      if (now - new Date(l.created_at).getTime() < 30 * 86400_000) novos30++;
      if (l.stage === "renovacao") renov30++;
      if (l.stage === "cancelado") cancel30++;
    }
    return { byPlan, byCat, byBairro, novos30, renov30, cancel30 };
  }, [leads]);

  const total = leads.length || 1;
  const convertidos = leads.filter((l) => l.stage === "ativo" || l.stage === "teste").length;
  const taxa = ((convertidos / total) * 100).toFixed(1);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <ReportCard title="Clientes por Plano" data={groups.byPlan} />
      <ReportCard title="Clientes por Categoria" data={groups.byCat} />
      <ReportCard title="Clientes por Bairro" data={groups.byBairro} />
      <StatCard label="Empresas novas (30d)" value={groups.novos30} />
      <StatCard label="Conversão de leads" value={`${taxa}%`} />
      <StatCard label="Renovações em andamento" value={groups.renov30} />
      <StatCard label="Cancelamentos" value={groups.cancel30} />
    </div>
  );
}

function ReportCard({ title, data }: { title: string; data: Map<string, number> }) {
  const rows = [...data.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <div className="space-y-1.5">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Sem dados.</p>}
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-xs">
              <span className="truncate">{k}</span>
              <span className="text-muted-foreground">{v}</span>
            </div>
            <div className="h-1.5 rounded bg-muted">
              <div
                className="h-full rounded gradient-brand"
                style={{ width: `${(v / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Lead Sheet (Ficha Completa) -------------------- */

function LeadSheet({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const listActs = useServerFn(listCrmActivities);
  const listRem = useServerFn(listCrmReminders);
  const listAudit = useServerFn(listCrmAudit);

  const { data: activities = [] } = useQuery({
    queryKey: ["crm-activities", lead.id],
    queryFn: () => listActs({ data: { leadId: lead.id } }),
  });
  const { data: reminders = [] } = useQuery({
    queryKey: ["crm-reminders", lead.id],
    queryFn: () => listRem({ data: { leadId: lead.id } }),
  });
  const { data: audit = [] } = useQuery({
    queryKey: ["crm-audit", lead.id],
    queryFn: () => listAudit({ data: { leadId: lead.id } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
    qc.invalidateQueries({ queryKey: ["crm-audit", lead.id] });
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-muted">
              {lead.logo_url ? (
                <img src={lead.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <span className="truncate">{lead.company_name}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className={`border ${STAGE_COLOR[lead.stage]}`}>{STAGE_LABELS[lead.stage]}</Badge>
          <Badge variant={PLAN_VARIANT[lead.plan_slug]}>{PLAN_LABEL[lead.plan_slug]}</Badge>
          <Badge variant="outline">{PARTNER_LABEL[lead.partner_type]}</Badge>
          {lead.renewal_at && (
            <Badge variant="outline">
              <Calendar className="mr-1 h-3 w-3" /> {fmtDate(lead.renewal_at)}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {lead.whatsapp && (
            <a
              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`}>
              <Button size="sm" variant="outline">
                <Phone className="mr-2 h-4 w-4" /> Ligar
              </Button>
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`}>
              <Button size="sm" variant="outline">
                <Mail className="mr-2 h-4 w-4" /> Email
              </Button>
            </a>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Edit3 className="mr-2 h-4 w-4" /> Editar
          </Button>
          <LeadActionsMenu lead={lead} onDone={invalidate} onClose={onClose} />
        </div>

        <Tabs defaultValue="dados" className="mt-4">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="plano">Plano</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="lembretes">Lembretes</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-3 space-y-2 text-sm">
            <Field label="Categoria" value={lead.category} />
            <Field label="Responsável" value={lead.contact_name} />
            <Field label="Telefone" value={lead.phone} />
            <Field label="WhatsApp" value={lead.whatsapp} />
            <Field label="Email" value={lead.email} />
            <Field label="Endereço" value={lead.address} />
            <Field label="Bairro" value={lead.neighborhood} />
            <Field label="Cadastro" value={fmtDate(lead.created_at)} />
            <Field label="Última alteração" value={fmtDate(lead.updated_at)} />
            <Field label="Observações" value={lead.notes} />
          </TabsContent>

          <TabsContent value="plano" className="mt-3 space-y-2 text-sm">
            <Field label="Plano atual" value={PLAN_LABEL[lead.plan_slug]} />
            <Field label="Origem" value={lead.plan_source} />
            <Field label="Renovação" value={fmtDate(lead.renewal_at)} />
            <Field label="Valor mensal" value={fmtMoney(lead.monthly_value)} />
            <Field label="Próxima ação" value={lead.next_action} />
            <Field label="Data ação" value={fmtDate(lead.next_action_at)} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-3">
            <TimelineTab leadId={lead.id} activities={activities as any[]} />
          </TabsContent>

          <TabsContent value="lembretes" className="mt-3">
            <RemindersTab leadId={lead.id} reminders={reminders as any[]} />
          </TabsContent>

          <TabsContent value="financeiro" className="mt-3 space-y-2 text-sm">
            <p className="text-xs text-muted-foreground">
              Estrutura preparada para integração com Asaas.
            </p>
            <Field label="Plano" value={PLAN_LABEL[lead.plan_slug]} />
            <Field label="Valor" value={fmtMoney(lead.monthly_value)} />
            <Field label="Situação" value={lead.stage} />
            <Field label="Forma de pagamento" value="—" />
            <Field label="Último pagamento" value="—" />
            <Field label="Próximo vencimento" value={fmtDate(lead.renewal_at)} />
          </TabsContent>

          <TabsContent value="auditoria" className="mt-3 space-y-2">
            {(audit as any[]).length === 0 && (
              <p className="text-xs text-muted-foreground">Sem alterações.</p>
            )}
            {(audit as any[]).map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {a.previous_stage ?? "—"} → {a.new_stage ?? "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Plano: {a.previous_plan ?? "—"} → {a.new_plan ?? "—"} · Origem:{" "}
                  {a.previous_source ?? "—"} → {a.new_source ?? "—"}
                </p>
                {a.reason && <p className="mt-1">Motivo: {a.reason}</p>}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {editing && (
          <LeadFormDialog open onOpenChange={(v) => !v && setEditing(false)} lead={lead} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value || "—"}</span>
    </div>
  );
}

/* -------------------- Lead actions menu -------------------- */

function LeadActionsMenu({
  lead,
  onDone,
  onClose,
}: {
  lead: Lead;
  onDone: () => void;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const del = useServerFn(deleteCrmLead);
  const promote = useServerFn(promoteUserPlan);
  const demote = useServerFn(demoteUserPlan);
  const suspend = useServerFn(suspendUserPlan);
  const reactivate = useServerFn(reactivateUserPlan);
  const trial = useServerFn(grantTrial);
  const renew = useServerFn(renewUserPlan);
  const update = useServerFn(updateUserPlan);
  const upsert = useServerFn(upsertCrmLead);

  const setPlanLocal = async (plan: PlanSlug) => {
    await upsert({
      data: { id: lead.id, company_name: lead.company_name, plan_slug: plan } as any,
    });
    if (lead.user_id) await update({ data: { userId: lead.user_id, plan } });
  };

  const run = (fn: () => Promise<any>, msg: string) =>
    fn()
      .then(() => {
        toast.success(msg);
        onDone();
        qc.invalidateQueries();
      })
      .catch((e: Error) => toast.error(e.message));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Alterar plano</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => run(() => setPlanLocal("destaque"), "Plano Destaque aplicado")}
        >
          <ArrowUp className="mr-2 h-4 w-4" /> Promover para Destaque
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => setPlanLocal("ouro"), "Plano Ouro aplicado")}>
          <ArrowUp className="mr-2 h-4 w-4" /> Promover para Ouro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => setPlanLocal("free"), "Rebaixado para Free")}>
          <ArrowDown className="mr-2 h-4 w-4" /> Rebaixar para Free
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {lead.user_id && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Gift className="mr-2 h-4 w-4" /> Conceder teste
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {[7, 15, 30, 60, 90].map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() =>
                      run(
                        () => trial({ data: { userId: lead.user_id!, plan: "destaque", days: d } }),
                        `Teste de ${d} dias concedido`,
                      )
                    }
                  >
                    {d} dias
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RefreshCw className="mr-2 h-4 w-4" /> Renovar
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {[30, 90, 365].map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() =>
                      run(
                        () => renew({ data: { userId: lead.user_id!, days: d } }),
                        `Renovado por ${d} dias`,
                      )
                    }
                  >
                    + {d} dias
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              onClick={() => run(() => suspend({ data: { userId: lead.user_id! } }), "Suspenso")}
            >
              <Pause className="mr-2 h-4 w-4" /> Suspender
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                run(() => reactivate({ data: { userId: lead.user_id! } }), "Reativado")
              }
            >
              <Play className="mr-2 h-4 w-4" /> Reativar
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            if (!confirm("Excluir este lead?")) return;
            del({ data: { id: lead.id } })
              .then(() => {
                toast.success("Excluído");
                onDone();
                onClose();
              })
              .catch((e: Error) => toast.error(e.message));
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------- Timeline / Reminders -------------------- */

function TimelineTab({ leadId, activities }: { leadId: string; activities: any[] }) {
  const qc = useQueryClient();
  const add = useServerFn(addCrmActivity);
  const [type, setType] = useState<string>("observacao");
  const [content, setContent] = useState("");
  const save = useMutation({
    mutationFn: () => add({ data: { leadId, type: type as any, content } }),
    onSuccess: () => {
      setContent("");
      toast.success("Registrado");
      qc.invalidateQueries({ queryKey: ["crm-activities", leadId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border p-2">
        <div className="flex gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ligacao">Ligação</SelectItem>
              <SelectItem value="visita">Visita</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="proposta">Proposta</SelectItem>
              <SelectItem value="reuniao">Reunião</SelectItem>
              <SelectItem value="observacao">Observação</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Descrição…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Registrar
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {activities.length === 0 && (
          <p className="text-xs text-muted-foreground">Sem atividades.</p>
        )}
        {activities.map((a) => (
          <div key={a.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{a.type}</span>
              <span className="text-xs text-muted-foreground">
                <Clock className="mr-1 inline h-3 w-3" />
                {new Date(a.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
            {a.content && <p className="mt-1 text-muted-foreground">{a.content}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RemindersTab({ leadId, reminders }: { leadId: string; reminders: any[] }) {
  const qc = useQueryClient();
  const add = useServerFn(addCrmReminder);
  const toggle = useServerFn(toggleCrmReminder);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const save = useMutation({
    mutationFn: () => add({ data: { leadId, title, dueAt: new Date(dueAt).toISOString() } }),
    onSuccess: () => {
      setTitle("");
      setDueAt("");
      toast.success("Lembrete criado");
      qc.invalidateQueries({ queryKey: ["crm-reminders", leadId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-lg border border-border p-2 md:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="Ex: Ligar amanhã, enviar proposta…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        <Button onClick={() => save.mutate()} disabled={save.isPending || !title || !dueAt}>
          Criar
        </Button>
      </div>
      <div className="space-y-2">
        {reminders.length === 0 && <p className="text-xs text-muted-foreground">Sem lembretes.</p>}
        {reminders.map((r) => (
          <label
            key={r.id}
            className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
          >
            <input
              type="checkbox"
              checked={r.done}
              onChange={(e) => {
                toggle({ data: { id: r.id, done: e.target.checked } })
                  .then(() => qc.invalidateQueries({ queryKey: ["crm-reminders", leadId] }))
                  .catch((err: Error) => toast.error(err.message));
              }}
            />
            <span className={`flex-1 ${r.done ? "line-through text-muted-foreground" : ""}`}>
              {r.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(r.due_at).toLocaleString("pt-BR")}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* -------------------- New/Edit Lead Dialog -------------------- */

function LeadFormDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead | null;
}) {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertCrmLead);
  const [f, setF] = useState({
    company_name: lead?.company_name ?? "",
    partner_type: (lead?.partner_type ?? "lead") as PartnerType,
    category: lead?.category ?? "",
    contact_name: lead?.contact_name ?? "",
    phone: lead?.phone ?? "",
    whatsapp: lead?.whatsapp ?? "",
    email: lead?.email ?? "",
    address: lead?.address ?? "",
    neighborhood: lead?.neighborhood ?? "",
    stage: (lead?.stage ?? "lead") as Stage,
    plan_slug: (lead?.plan_slug ?? "free") as PlanSlug,
    plan_source: (lead?.plan_source ?? "manual_admin") as PlanSource,
    monthly_value: lead?.monthly_value ?? 0,
    next_action: lead?.next_action ?? "",
    next_action_at: lead?.next_action_at ? lead.next_action_at.slice(0, 10) : "",
    renewal_at: lead?.renewal_at ? lead.renewal_at.slice(0, 10) : "",
    notes: lead?.notes ?? "",
    noRenewal: !lead?.renewal_at,
  });

  const save = useMutation({
    mutationFn: () =>
      upsert({
        data: {
          ...(lead?.id ? { id: lead.id } : {}),
          company_name: f.company_name,
          partner_type: f.partner_type,
          category: f.category || null,
          contact_name: f.contact_name || null,
          phone: f.phone || null,
          whatsapp: f.whatsapp || null,
          email: f.email || null,
          address: f.address || null,
          neighborhood: f.neighborhood || null,
          stage: f.stage,
          plan_slug: f.plan_slug,
          plan_source: f.plan_source,
          monthly_value: Number(f.monthly_value) || null,
          next_action: f.next_action || null,
          next_action_at: f.next_action_at ? new Date(f.next_action_at).toISOString() : null,
          renewal_at: f.noRenewal
            ? null
            : f.renewal_at
              ? new Date(f.renewal_at).toISOString()
              : null,
          notes: f.notes || null,
        } as any,
      }),
    onSuccess: () => {
      toast.success(lead ? "Atualizado" : "Lead cadastrado");
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof typeof f, v: any) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Nome da empresa</Label>
            <Input value={f.company_name} onChange={(e) => set("company_name", e.target.value)} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={f.partner_type} onValueChange={(v) => set("partner_type", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="farmacia">Farmácia</SelectItem>
                <SelectItem value="corretor">Corretor</SelectItem>
                <SelectItem value="imobiliaria">Imobiliária</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Categoria</Label>
            <Input value={f.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div>
            <Label>Responsável</Label>
            <Input value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Endereço</Label>
            <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input value={f.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
          </div>
          <div>
            <Label>Estágio</Label>
            <Select value={f.stage} onValueChange={(v) => set("stage", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Plano</Label>
            <Select value={f.plan_slug} onValueChange={(v) => set("plan_slug", v)}>
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
            <Label>Origem do plano</Label>
            <Select value={f.plan_source} onValueChange={(v) => set("plan_source", v)}>
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
          <div>
            <Label>Valor mensal (R$)</Label>
            <Input
              type="number"
              value={f.monthly_value}
              onChange={(e) => set("monthly_value", e.target.value)}
            />
          </div>
          <div>
            <Label>Próxima ação</Label>
            <Input value={f.next_action} onChange={(e) => set("next_action", e.target.value)} />
          </div>
          <div>
            <Label>Data da ação</Label>
            <Input
              type="date"
              value={f.next_action_at}
              onChange={(e) => set("next_action_at", e.target.value)}
            />
          </div>
          <div>
            <Label>Renovação</Label>
            <Input
              type="date"
              value={f.renewal_at}
              disabled={f.noRenewal}
              onChange={(e) => set("renewal_at", e.target.value)}
            />
            <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={f.noRenewal} onCheckedChange={(v) => set("noRenewal", v)} />
              Sem vencimento
            </label>
          </div>
          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !f.company_name}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
