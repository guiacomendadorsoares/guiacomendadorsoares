import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Building2,
  ShieldCheck,
  ShieldX,
  FileText,
  RefreshCw,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MailQuestion,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  listAdminClaims,
  listClaimDocs,
  getDocSignedUrl,
  approveClaim,
  rejectClaim,
  requestDocsClaim,
  reopenClaim,
  setInReview,
  saveInternalNotes,
  softDeleteClaim,
  type AdminClaimRow,
} from "@/lib/business-claims-admin";
import { STATUS_LABEL, DOC_LABEL, type ClaimStatus, type DocType } from "@/lib/business-claims";

export const Route = createFileRoute("/_authenticated/admin/reivindicacoes")({
  component: AdminClaimsPage,
});

const STATUS_STYLES: Record<ClaimStatus, string> = {
  pending: "bg-gold/20 text-gold-foreground",
  in_review: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  awaiting_docs: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  approved: "bg-primary/15 text-primary",
  rejected: "bg-destructive/15 text-destructive",
  already_claimed: "bg-secondary text-secondary-foreground",
  canceled: "bg-muted text-muted-foreground",
};

const STATUS_ORDER: (ClaimStatus | "all")[] = [
  "all",
  "pending",
  "in_review",
  "awaiting_docs",
  "approved",
  "rejected",
  "already_claimed",
  "canceled",
];

function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status] ?? "bg-secondary"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function AdminClaimsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ClaimStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["admin-claims", status, search],
    queryFn: () => listAdminClaims({ status, search }),
    staleTime: 30_000,
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of STATUS_ORDER) c[s] = 0;
    for (const r of claims) c[r.status] = (c[r.status] ?? 0) + 1;
    c.all = claims.length;
    return c;
  }, [claims]);

  const selected = claims.find((c) => c.id === selectedId) ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-claims"] });

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-2xl font-bold">Reivindicações de empresa</h2>
        <p className="text-sm text-muted-foreground">
          Aprove, recuse ou peça documentos adicionais. Ao aprovar, o solicitante vira proprietário
          principal da empresa.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              status === s ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            }`}
          >
            {s === "all" ? "Todas" : STATUS_LABEL[s as ClaimStatus]}
            <span className="ml-1.5 rounded-full bg-background/30 px-1.5 text-[10px]">
              {counts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por empresa, nome, e-mail ou CPF"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando reivindicações…
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          Nenhuma reivindicação encontrada.
        </div>
      ) : (
        <ul className="space-y-2">
          {claims.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelectedId(c.id)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-semibold">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {c.business?.name ?? "Empresa removida"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.full_name} · {c.email} · {new Date(c.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <ClaimStatusBadge status={c.status} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ClaimDetailSheet
        claim={selected}
        onClose={() => setSelectedId(null)}
        onChanged={invalidate}
      />
    </div>
  );
}

function ClaimDetailSheet({
  claim,
  onClose,
  onChanged,
}: {
  claim: AdminClaimRow | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const open = !!claim;
  const [rejectOpen, setRejectOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [notesDraft, setNotesDraft] = useState<string>("");

  const { data: docs = [] } = useQuery({
    queryKey: ["admin-claim-docs", claim?.id],
    queryFn: () => (claim ? listClaimDocs(claim.id) : Promise.resolve([])),
    enabled: !!claim,
  });

  const approveM = useMutation({
    mutationFn: () => approveClaim(claim!),
    onSuccess: () => {
      toast.success("Reivindicação aprovada. Proprietário vinculado.");
      onChanged();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao aprovar"),
  });
  const rejectM = useMutation({
    mutationFn: () => rejectClaim(claim!.id, reason || "Sem motivo informado"),
    onSuccess: () => {
      toast.success("Recusada");
      setRejectOpen(false);
      setReason("");
      onChanged();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao recusar"),
  });
  const docsM = useMutation({
    mutationFn: () => requestDocsClaim(claim!.id, note),
    onSuccess: () => {
      toast.success("Solicitação enviada");
      setDocsOpen(false);
      setNote("");
      onChanged();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });
  const reviewM = useMutation({
    mutationFn: () => setInReview(claim!.id),
    onSuccess: () => {
      toast.success("Marcada como em análise");
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });
  const reopenM = useMutation({
    mutationFn: () => reopenClaim(claim!.id),
    onSuccess: () => {
      toast.success("Reaberta");
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });
  const deleteM = useMutation({
    mutationFn: () => softDeleteClaim(claim!.id),
    onSuccess: () => {
      toast.success("Excluída");
      onChanged();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });
  const notesM = useMutation({
    mutationFn: () => saveInternalNotes(claim!.id, notesDraft),
    onSuccess: () => {
      toast.success("Notas salvas");
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });

  if (!claim) return <Sheet open={false} onOpenChange={() => onClose()} />;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 pr-6">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Reivindicação
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <section className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Empresa</p>
            <p className="font-display text-lg font-bold">{claim.business?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{claim.business?.category_label ?? ""}</p>
            {claim.business?.address && (
              <p className="mt-1 text-xs text-muted-foreground">{claim.business.address}</p>
            )}
            <div className="mt-2">
              <ClaimStatusBadge status={claim.status} />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Solicitante
            </p>
            <p className="font-semibold">{claim.full_name}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">CPF</dt>
              <dd>{claim.cpf}</dd>
              <dt className="text-muted-foreground">Cargo</dt>
              <dd>{claim.role_in_company}</dd>
              <dt className="text-muted-foreground">Telefone</dt>
              <dd>{claim.phone}</dd>
              <dt className="text-muted-foreground">WhatsApp</dt>
              <dd>{claim.whatsapp ?? "—"}</dd>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="truncate">{claim.email}</dd>
              <dt className="text-muted-foreground">Enviada em</dt>
              <dd>{new Date(claim.created_at).toLocaleString("pt-BR")}</dd>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3 w-3" /> Documentos ({docs.length})
            </p>
            {docs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum documento enviado.</p>
            ) : (
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {DOC_LABEL[d.doc_type as DocType] ?? d.doc_type}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {d.file_name} · {(d.size_bytes / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const url = await getDocSignedUrl(d.file_path);
                        if (url) window.open(url, "_blank", "noopener");
                        else toast.error("Não foi possível gerar o link");
                      }}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" /> Abrir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Notas internas
            </Label>
            <Textarea
              rows={3}
              placeholder="Observações visíveis apenas para o admin…"
              defaultValue={claim.internal_notes ?? ""}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="mt-1"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => notesM.mutate()}
                disabled={notesM.isPending}
              >
                {notesM.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                Salvar notas
              </Button>
            </div>
            {claim.rejection_reason && (
              <div className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs">
                <span className="font-semibold text-destructive">Motivo da recusa:</span>{" "}
                {claim.rejection_reason}
              </div>
            )}
          </section>

          <section className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => approveM.mutate()}
              disabled={approveM.isPending || claim.status === "approved"}
              className="col-span-2"
            >
              {approveM.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Aprovar e vincular proprietário
            </Button>
            <Button
              variant="outline"
              onClick={() => reviewM.mutate()}
              disabled={reviewM.isPending || claim.status === "in_review"}
            >
              <Clock className="mr-2 h-4 w-4" /> Em análise
            </Button>
            <Button variant="outline" onClick={() => setDocsOpen(true)}>
              <MailQuestion className="mr-2 h-4 w-4" /> Pedir documentos
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" /> Recusar
            </Button>
            <Button variant="outline" onClick={() => reopenM.mutate()} disabled={reopenM.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reabrir
            </Button>
            <Button
              variant="ghost"
              className="col-span-2 text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (
                  confirm("Excluir esta reivindicação? Esta ação é reversível apenas pelo banco.")
                )
                  deleteM.mutate();
              }}
              disabled={deleteM.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir reivindicação
            </Button>
          </section>
        </div>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recusar reivindicação</DialogTitle>
            </DialogHeader>
            <Textarea
              rows={4}
              placeholder="Motivo da recusa (visível ao solicitante)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectM.mutate()}
                disabled={rejectM.isPending || !reason.trim()}
              >
                {rejectM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar recusa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar documentos adicionais</DialogTitle>
            </DialogHeader>
            <Textarea
              rows={4}
              placeholder="Descreva o que precisa (ex.: contrato social atualizado)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDocsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => docsM.mutate()} disabled={docsM.isPending || !note.trim()}>
                {docsM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
