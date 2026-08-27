import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CONTENT_TABLES, listPending, titleColumn, type ContentTable } from "@/lib/approvals";
import { approveContent, rejectContent } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/aprovacoes")({
  component: AprovacoesPage,
});

function AprovacoesPage() {
  return (
    <Tabs defaultValue="businesses" className="space-y-4">
      <TabsList className="flex flex-wrap h-auto">
        {CONTENT_TABLES.map((t) => (
          <TabsTrigger key={t.key} value={t.key}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {CONTENT_TABLES.map((t) => (
        <TabsContent key={t.key} value={t.key}>
          <ApprovalList table={t.key} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ApprovalList({ table }: { table: ContentTable }) {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const approveFn = useServerFn(approveContent);
  const rejectFn = useServerFn(rejectContent);

  const { data, isLoading } = useQuery({
    queryKey: ["pending", table],
    queryFn: () => listPending(table),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveFn({ data: { table, id } }),
    onSuccess: () => {
      toast.success("Aprovado");
      qc.invalidateQueries({ queryKey: ["pending", table] });
      qc.invalidateQueries({ queryKey: ["admin-counts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      rejectFn({
        data: { table, id: rejecting!, reason: reason.trim() || "Sem motivo informado" },
      }),
    onSuccess: () => {
      toast.success("Rejeitado");
      setRejecting(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["pending", table] });
      qc.invalidateQueries({ queryKey: ["admin-counts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="grid place-items-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  if (!data || data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhum item pendente.
      </p>
    );
  }

  const titleKey = titleColumn(table);

  return (
    <>
      <ul className="space-y-2">
        {data.map((row: any) => (
          <li
            key={row.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{row[titleKey] ?? "Sem título"}</p>
              <p className="text-xs text-muted-foreground">
                Enviado em {new Date(row.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                aria-label="Rejeitar"
                onClick={() => setRejecting(row.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                aria-label="Aprovar"
                onClick={() => approveMut.mutate(row.id)}
                disabled={approveMut.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar publicação</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            maxLength={500}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMut.mutate()}
              disabled={rejectMut.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
