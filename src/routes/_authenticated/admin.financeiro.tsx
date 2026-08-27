import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAsaasFinancials, cancelAsaasSubscription } from "@/lib/asaas.functions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  component: FinanceiroPage,
});

function brl(n: number | string | null | undefined) {
  if (n == null) return "—";
  return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PAID = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];
const PENDING = ["PENDING", "AWAITING_RISK_ANALYSIS"];
const OVERDUE = ["OVERDUE"];

function daysUntil(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00").getTime();
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

function FinanceiroPage() {
  const fetchFinancials = useServerFn(listAsaasFinancials);
  const cancelFn = useServerFn(cancelAsaasSubscription);
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["asaas-financials"],
    queryFn: () => fetchFinancials(),
  });
  const cancelMut = useMutation({
    mutationFn: (subscriptionId: string) => cancelFn({ data: { subscriptionId } }),
    onSuccess: () => {
      toast.success("Assinatura cancelada");
      qc.invalidateQueries({ queryKey: ["asaas-financials"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payments = (data?.payments ?? []) as any[];
  const subs = (data?.subscriptions ?? []) as any[];

  const paid = payments.filter((p) => PAID.includes(String(p.status).toUpperCase()));
  const pending = payments.filter((p) => PENDING.includes(String(p.status).toUpperCase()));
  const dueSoon = pending.filter((p) => {
    const d = daysUntil(p.dueDate);
    return d >= 0 && d <= 7;
  });
  const overdue = payments.filter((p) => OVERDUE.includes(String(p.status).toUpperCase()));
  const subsEndingSoon = subs.filter((s) => {
    if (!s.nextDueDate) return false;
    const d = daysUntil(s.nextDueDate);
    return d >= 0 && d <= 7;
  });

  const totalPaid = paid.reduce((acc, p) => acc + Number(p.value || 0), 0);
  const totalPending = pending.reduce((acc, p) => acc + Number(p.value || 0), 0);
  const totalOverdue = overdue.reduce((acc, p) => acc + Number(p.value || 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Integração Asaas{" "}
            {data?.sandbox ? <Badge variant="secondary">Sandbox</Badge> : <Badge>Produção</Badge>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados do Asaas…
        </div>
      )}

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Erro: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={CheckCircle2}
              label="Pagas"
              value={brl(totalPaid)}
              count={paid.length}
              tone="success"
            />
            <SummaryCard
              icon={Clock}
              label="Pendentes"
              value={brl(totalPending)}
              count={pending.length}
              tone="warning"
            />
            <SummaryCard
              icon={CalendarClock}
              label="A vencer (7d)"
              value={`${dueSoon.length} cobranças`}
              count={dueSoon.length}
              tone="info"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Vencidas"
              value={brl(totalOverdue)}
              count={overdue.length}
              tone="danger"
            />
          </div>

          <Tabs defaultValue="paid">
            <TabsList className="flex-wrap">
              <TabsTrigger value="paid">Pagas ({paid.length})</TabsTrigger>
              <TabsTrigger value="pending">Geradas não pagas ({pending.length})</TabsTrigger>
              <TabsTrigger value="due">A vencer ({dueSoon.length})</TabsTrigger>
              <TabsTrigger value="overdue">Vencidas ({overdue.length})</TabsTrigger>
              <TabsTrigger value="subsEnd">
                Assinaturas a expirar ({subsEndingSoon.length})
              </TabsTrigger>
              <TabsTrigger value="subs">Todas assinaturas ({subs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="paid">
              <PaymentsTable rows={paid} />
            </TabsContent>
            <TabsContent value="pending">
              <PaymentsTable rows={pending} />
            </TabsContent>
            <TabsContent value="due">
              <PaymentsTable rows={dueSoon} showDaysLeft />
            </TabsContent>
            <TabsContent value="overdue">
              <PaymentsTable rows={overdue} />
            </TabsContent>
            <TabsContent value="subsEnd">
              <SubsTable
                rows={subsEndingSoon}
                showDaysLeft
                onCancel={(id) => cancelMut.mutate(id)}
                cancelPending={cancelMut.isPending}
              />
            </TabsContent>
            <TabsContent value="subs">
              <SubsTable
                rows={subs}
                onCancel={(id) => cancelMut.mutate(id)}
                cancelPending={cancelMut.isPending}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  count,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  count: number;
  tone: "success" | "warning" | "info" | "danger";
}) {
  const toneCls = {
    success: "text-emerald-600 bg-emerald-500/10",
    warning: "text-amber-600 bg-amber-500/10",
    info: "text-sky-600 bg-sky-500/10",
    danger: "text-destructive bg-destructive/10",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-semibold">{value}</div>
          <div className="text-[11px] text-muted-foreground">{count} item(ns)</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentsTable({ rows, showDaysLeft = false }: { rows: any[]; showDaysLeft?: boolean }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              {showDaysLeft && <TableHead>Dias</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Fatura</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell className="font-mono text-xs">{p.customer}</TableCell>
                <TableCell>{p.billingType}</TableCell>
                <TableCell>{brl(p.value)}</TableCell>
                <TableCell>{p.dueDate}</TableCell>
                {showDaysLeft && <TableCell>{daysUntil(p.dueDate)}d</TableCell>}
                <TableCell>
                  <Badge variant="secondary">{p.status}</Badge>
                </TableCell>
                <TableCell>
                  {p.invoiceUrl ? (
                    <a
                      href={p.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      abrir
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showDaysLeft ? 8 : 7}
                  className="text-center text-muted-foreground"
                >
                  Nada por aqui.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SubsTable({
  rows,
  showDaysLeft = false,
  onCancel,
  cancelPending,
}: {
  rows: any[];
  showDaysLeft?: boolean;
  onCancel: (id: string) => void;
  cancelPending: boolean;
}) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Próx. cobrança</TableHead>
              {showDaysLeft && <TableHead>Dias</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const canceled = ["INACTIVE", "CANCELED"].includes(String(s.status).toUpperCase());
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="font-mono text-xs">{s.customer}</TableCell>
                  <TableCell>{brl(s.value)}</TableCell>
                  <TableCell>{s.cycle}</TableCell>
                  <TableCell>{s.nextDueDate}</TableCell>
                  {showDaysLeft && (
                    <TableCell>{s.nextDueDate ? `${daysUntil(s.nextDueDate)}d` : "—"}</TableCell>
                  )}
                  <TableCell>
                    <Badge variant="secondary">{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={canceled || cancelPending}
                      onClick={() => {
                        if (confirm(`Cancelar assinatura ${s.id}?`)) onCancel(s.id);
                      }}
                    >
                      Cancelar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showDaysLeft ? 8 : 7}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma assinatura.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
