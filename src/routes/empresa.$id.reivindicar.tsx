import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  Upload,
  Loader2,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchBusinessById } from "@/services/businesses.service";
import {
  businessHasOwner,
  createClaim,
  uploadClaimDocument,
  myOpenClaimForBusiness,
  STATUS_LABEL,
  DOC_LABEL,
  type DocType,
} from "@/lib/business-claims";
import { GlassCard } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/empresa/$id/reivindicar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reivindicar empresa — Guia Comendador Soares" },
      {
        name: "description",
        content: "Assuma a administração da sua empresa no Guia Comendador Soares.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReivindicarPage,
});

const schema = z.object({
  full_name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  cpf: z.string().trim().min(11, "CPF inválido").max(20),
  role_in_company: z.string().trim().min(2, "Informe seu cargo").max(60),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("E-mail inválido").max(255),
});

const REQUIRED_DOCS: DocType[] = ["cnpj_card", "social_contract", "bond_proof", "identity"];

function ReivindicarPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setAuthChecked(true);
    });
  }, []);

  const { data: business, isLoading: bLoading } = useQuery({
    queryKey: ["business", id],
    queryFn: () => fetchBusinessById(id),
  });

  const { data: hasOwner } = useQuery({
    queryKey: ["business-has-owner", id],
    queryFn: () => businessHasOwner(id),
  });

  const { data: existingClaim } = useQuery({
    queryKey: ["my-claim", id, userId],
    queryFn: () => myOpenClaimForBusiness(id, userId!),
    enabled: Boolean(userId),
  });

  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    role_in_company: "",
    phone: "",
    whatsapp: "",
    email: "",
  });
  const [files, setFiles] = useState<Partial<Record<DocType, File>>>({});
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => REQUIRED_DOCS.every((d) => files[d]), [files]);

  if (!authChecked || bLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center p-6 text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-display text-lg font-bold text-foreground">Empresa não encontrada</p>
        <Link to="/guia" className="text-sm font-semibold text-primary-vibrant">
          Voltar ao guia
        </Link>
      </div>
    );
  }

  if (!userId) {
    return (
      <Shell business={business}>
        <GlassCard className="p-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary-vibrant" />
          <h2 className="mt-3 font-display text-lg font-bold">Faça login para continuar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Para reivindicar <strong>{business.name}</strong>, entre na sua conta ou cadastre-se.
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              navigate({
                to: "/auth" as never,
                search: { next: `/empresa/${id}/reivindicar` } as never,
              })
            }
          >
            Entrar / Cadastrar
          </Button>
        </GlassCard>
      </Shell>
    );
  }

  if (hasOwner) {
    return (
      <Shell business={business}>
        <GlassCard className="p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-3 font-display text-lg font-bold">Empresa já vinculada</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta empresa já possui um proprietário verificado. Se acredita que houve engano, entre
            em contato com o suporte.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate({ to: "/empresa/$id", params: { id } })}
          >
            Voltar à empresa
          </Button>
        </GlassCard>
      </Shell>
    );
  }

  if (existingClaim) {
    return (
      <Shell business={business}>
        <GlassCard className="p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary-vibrant" />
          <h2 className="mt-3 font-display text-lg font-bold">
            Sua reivindicação está em andamento
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Status atual: <strong>{STATUS_LABEL[existingClaim.status]}</strong>. Nossa equipe
            entrará em contato assim que a análise for concluída.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate({ to: "/empresa/$id", params: { id } })}
          >
            Voltar à empresa
          </Button>
        </GlassCard>
      </Shell>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Preencha os campos obrigatórios.");
      return;
    }
    if (!canSubmit) {
      toast.error("Envie todos os documentos obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      const { id: claimId } = await createClaim({
        business_id: id,
        ...parsed.data,
        whatsapp: parsed.data.whatsapp || undefined,
      });
      for (const doc of REQUIRED_DOCS) {
        const file = files[doc];
        if (!file) continue;
        await uploadClaimDocument({ claimId, docType: doc, file });
      }
      toast.success("Reivindicação enviada! Nossa equipe fará a análise em breve.");
      navigate({ to: "/empresa/$id", params: { id } });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Erro ao enviar reivindicação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell business={business}>
      <form onSubmit={onSubmit} className="space-y-5">
        <GlassCard className="p-5">
          <h2 className="font-display text-base font-bold">Seus dados</h2>
          <div className="mt-4 grid gap-3">
            <Field label="Nome completo" required>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                maxLength={120}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF" required>
                <Input
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  required
                  maxLength={20}
                  placeholder="000.000.000-00"
                />
              </Field>
              <Field label="Cargo" required>
                <Input
                  value={form.role_in_company}
                  onChange={(e) => setForm({ ...form, role_in_company: e.target.value })}
                  required
                  maxLength={60}
                  placeholder="Sócio, Gerente…"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone" required>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  inputMode="tel"
                  maxLength={20}
                />
              </Field>
              <Field label="WhatsApp">
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  inputMode="tel"
                  maxLength={20}
                />
              </Field>
            </div>
            <Field label="E-mail" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                maxLength={255}
              />
            </Field>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">Documentos</h2>
              <p className="text-xs text-muted-foreground">
                Envie PDF, JPG ou PNG (até 10 MB cada).
              </p>
            </div>
            <FileText className="h-5 w-5 text-primary-vibrant" />
          </div>
          <div className="mt-4 space-y-3">
            {REQUIRED_DOCS.map((doc) => (
              <FileRow
                key={doc}
                label={DOC_LABEL[doc]}
                file={files[doc]}
                onChange={(f) => setFiles((prev) => ({ ...prev, [doc]: f }))}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 text-xs text-muted-foreground">
          Ao enviar, você declara que as informações são verdadeiras e autoriza o Guia Comendador
          Soares a verificar o vínculo com a empresa. Falsidade ideológica é crime previsto no Art.
          299 do Código Penal.
        </GlassCard>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            "Enviar reivindicação"
          )}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ business, children }: { business: any; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-12">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link
          to="/empresa/$id"
          params={{ id: business.id }}
          className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reivindicar</p>
          <h1 className="truncate font-display text-sm font-bold">{business.name}</h1>
        </div>
      </header>
      <main className="px-4 py-5">{children}</main>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function FileRow({
  label,
  file,
  onChange,
}: {
  label: string;
  file?: File;
  onChange: (f: File) => void;
}) {
  const inputId = `file-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {file
              ? `${file.name} — ${(file.size / 1024).toFixed(0)} KB`
              : "Nenhum arquivo selecionado"}
          </p>
        </div>
        <label
          htmlFor={inputId}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-card"
        >
          <Upload className="h-3.5 w-3.5" />
          {file ? "Trocar" : "Enviar"}
        </label>
        <input
          id={inputId}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f);
          }}
        />
      </div>
      {file && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-primary-vibrant">
          <CheckCircle2 className="h-3 w-3" /> Pronto para envio
        </p>
      )}
    </div>
  );
}
