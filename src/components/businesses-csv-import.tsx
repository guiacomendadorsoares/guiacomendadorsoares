import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/guia-taxonomy";

// -------- CSV parser (RFC 4180-ish, handles quotes/newlines) ---------
function detectDelimiter(text: string): string {
  // Sample the first non-quoted line to guess , ; or tab
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/)[0] ?? "";
  const counts: Record<string, number> = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  let best = ",";
  let max = -1;
  for (const [d, n] of Object.entries(counts))
    if (n > max) {
      best = d;
      max = n;
    }
  return best;
}

function parseCsv(text: string, delimiter?: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const delim = delimiter ?? detectDelimiter(src);
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delim) {
        cur.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && src[i + 1] === "\n") i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const HEADER_KEYS = ["name", "category", "address", "phone"] as const;
type Key = (typeof HEADER_KEYS)[number];

const HEADER_ALIASES: Record<string, Key> = {
  nome: "name",
  name: "name",
  categoria: "category",
  category: "category",
  endereco: "address",
  endereço: "address",
  address: "address",
  telefone: "phone",
  phone: "phone",
  tel: "phone",
};

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugifyCategoryInput(s: string) {
  return norm(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORY_ALIASES: Record<string, string> = {
  comida: "alimentacao",
  restaurante: "alimentacao",
  restaurantes: "alimentacao",
  lanchonete: "alimentacao",
  lanchonetes: "alimentacao",
  padaria: "alimentacao",
  padarias: "alimentacao",
  pizzaria: "alimentacao",
  hamburgueria: "alimentacao",
  acai: "alimentacao",
  sorveteria: "alimentacao",
  farmacia: "saude",
  farmacias: "saude",
  clinica: "saude",
  clinicas: "saude",
  dentista: "saude",
  dentistas: "saude",
  veterinaria: "saude",
  veterinarias: "saude",
  beleza: "beleza-estetica",
  estetica: "beleza-estetica",
  salao: "beleza-estetica",
  saloes: "beleza-estetica",
  barbearia: "beleza-estetica",
  barbearias: "beleza-estetica",
  academia: "esportes-bem-estar",
  academias: "esportes-bem-estar",
  esporte: "esportes-bem-estar",
  esportes: "esportes-bem-estar",
  "bem-estar": "esportes-bem-estar",
  bemestar: "esportes-bem-estar",
  auto: "automotivo",
  oficina: "automotivo",
  oficinas: "automotivo",
  automovel: "automotivo",
  automoveis: "automotivo",
  carro: "automotivo",
  carros: "automotivo",
  casa: "casa-construcao",
  construcao: "casa-construcao",
  obras: "casa-construcao",
  reforma: "casa-construcao",
  reformas: "casa-construcao",
  material: "casa-construcao",
  pet: "pets",
  animal: "pets",
  animais: "pets",
  escola: "educacao",
  escolas: "educacao",
  curso: "educacao",
  cursos: "educacao",
  ensino: "educacao",
  juridico: "juridico-profissional",
  advogado: "juridico-profissional",
  advogados: "juridico-profissional",
  contador: "juridico-profissional",
  contadores: "juridico-profissional",
  profissional: "juridico-profissional",
  profissionais: "juridico-profissional",
  imoveis: "imobiliario",
  imovel: "imobiliario",
  corretor: "imobiliario",
  corretores: "imobiliario",
  loja: "comercio",
  lojas: "comercio",
  mercado: "comercio",
  mercados: "comercio",
  varejo: "comercio",
  comercio: "comercio",
  servico: "servicos-gerais",
  servicos: "servicos-gerais",
  "servicos-geral": "servicos-gerais",
  chaveiro: "servicos-gerais",
  assistencia: "servicos-gerais",
  banco: "financeiro",
  bancos: "financeiro",
  seguro: "financeiro",
  seguros: "financeiro",
  financas: "financeiro",
  igreja: "comunidade",
  igrejas: "comunidade",
  ong: "comunidade",
  ongs: "comunidade",
  festa: "eventos-entretenimento",
  festas: "eventos-entretenimento",
  evento: "eventos-entretenimento",
  eventos: "eventos-entretenimento",
  entretenimento: "eventos-entretenimento",
  frete: "transporte-logistica",
  fretes: "transporte-logistica",
  transporte: "transporte-logistica",
  transportes: "transporte-logistica",
  logistica: "transporte-logistica",
  taxi: "transporte-logistica",
  mototaxi: "transporte-logistica",
  publicidade: "marketing-publicidade",
  marketing: "marketing-publicidade",
  grafica: "marketing-publicidade",
  graficas: "marketing-publicidade",
};

const CATEGORY_HELP = CATEGORIES.map((cat) => cat.label).join(", ");

function resolveCategory(input: string): { slug: string; label: string } | null {
  const q = norm(input);
  const slug = slugifyCategoryInput(input);
  if (!q) return null;
  const aliasSlug = CATEGORY_ALIASES[q] ?? CATEGORY_ALIASES[slug];
  const c = CATEGORIES.find(
    (cat) =>
      norm(cat.slug) === q ||
      slugifyCategoryInput(cat.label) === slug ||
      cat.slug === aliasSlug ||
      cat.subcategories.some(
        (sub) => slugifyCategoryInput(sub.label) === slug || norm(sub.label) === q,
      ),
  );
  return c ? { slug: c.slug, label: c.label } : null;
}

type ParsedRow = {
  index: number;
  raw: Record<string, string>;
  values?: Record<string, any>;
  error?: string;
  status: "ok" | "invalid" | "duplicate";
};

const TEMPLATE_CSV =
  "name,category,address,phone\n" +
  "Padaria Exemplo,alimentacao,Rua das Flores 123,(21) 99999-0000\n";

export function BusinessesCsvImport({ onDone }: { onDone?: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ ok: number; skip: number; err: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const okCount = useMemo(() => rows.filter((r) => r.status === "ok").length, [rows]);
  const errCount = useMemo(() => rows.filter((r) => r.status === "invalid").length, [rows]);
  const dupCount = useMemo(() => rows.filter((r) => r.status === "duplicate").length, [rows]);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-empresas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function readFileSmart(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    // Try UTF-8 strict — falls back if bytes aren't valid UTF-8 (e.g. Excel/Windows-1252)
    try {
      const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(buf);
      // Heuristic: if it decoded but shows classic mojibake ("Ã©", "Ã§"), it was Latin-1 mislabeled
      if (/Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]/.test(utf8)) {
        return new TextDecoder("windows-1252").decode(buf);
      }
      return utf8;
    } catch {
      return new TextDecoder("windows-1252").decode(buf);
    }
  }

  async function handleFile(file: File) {
    setProgress(null);
    const text = await readFileSmart(file);
    const table = parseCsv(text);
    if (table.length < 2) {
      toast.error("Planilha vazia ou sem linhas.");
      return;
    }
    const header = table[0].map((h) => HEADER_ALIASES[norm(h)] ?? (norm(h) as Key));
    const missing = ["name", "category", "address", "phone"].filter(
      (k) => !header.includes(k as Key),
    );
    if (missing.length) {
      toast.error(
        `Colunas obrigatórias faltando: ${missing.join(", ")}. Cabeçalhos detectados: ${table[0].join(" | ")}`,
      );
      return;
    }

    // Fetch ALL existing names (paginated) to detect duplicates by normalized name.
    const dupSet = new Set<string>();
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("businesses")
        .select("name, address")
        .range(from, from + pageSize - 1);
      if (error) break;
      (data ?? []).forEach((r: any) => {
        dupSet.add(norm(r.name ?? ""));
        dupSet.add(`${norm(r.name ?? "")}|${norm(r.address ?? "")}`);
      });
      if (!data || data.length < pageSize) break;
    }

    const parsed: ParsedRow[] = [];
    for (let i = 1; i < table.length; i++) {
      const rec: Record<string, string> = {};
      header.forEach((k, j) => {
        rec[k] = (table[i][j] ?? "").trim();
      });
      const row: ParsedRow = { index: i, raw: rec, status: "invalid" };

      const cat =
        resolveCategory(rec.category ?? "") ??
        (rec.category?.trim()
          ? { slug: slugifyCategoryInput(rec.category), label: rec.category.trim() }
          : { slug: "sem-categoria", label: "Sem categoria" });

      const nameKey = norm(rec.name);
      const nameAddrKey = `${nameKey}|${norm(rec.address)}`;
      if (!nameKey) {
        row.error = "Nome vazio";
        parsed.push(row);
        continue;
      }
      if (dupSet.has(nameKey) || dupSet.has(nameAddrKey)) {
        row.status = "duplicate";
        row.error = "Já existe (pulado)";
        parsed.push(row);
        continue;
      }
      dupSet.add(nameKey);
      dupSet.add(nameAddrKey);

      row.status = "ok";
      row.values = {
        name: rec.name || "",
        main_category: cat.slug,
        category: cat.slug,
        subcategory: null,
        category_label: cat.label,
        address: rec.address || "",
        phone: rec.phone || null,
        status: "approved",
      };
      parsed.push(row);
    }
    setRows(parsed);
  }

  async function runImport() {
    if (!okCount) {
      toast.error("Nenhuma linha válida para importar.");
      return;
    }
    setImporting(true);
    const { data: u } = await supabase.auth.getUser();
    const submittedBy = u.user?.id ?? null;
    let ok = 0,
      err = 0;
    const toInsert = rows
      .filter((r) => r.status === "ok" && r.values)
      .map((r) => ({ ...r.values!, submitted_by: submittedBy }));
    // Insert in chunks of 50
    for (let i = 0; i < toInsert.length; i += 50) {
      const chunk = toInsert.slice(i, i + 50);
      const { error, data } = await (supabase.from("businesses") as any).insert(chunk).select("id");
      if (error) {
        err += chunk.length;
        console.error(error);
      } else ok += data?.length ?? chunk.length;
    }
    setImporting(false);
    setProgress({ ok, skip: dupCount, err: err + errCount });
    if (ok > 0) toast.success(`${ok} empresa(s) importada(s).`);
    if (err > 0) toast.error(`${err} linha(s) falharam no banco.`);
    qc.invalidateQueries({ queryKey: ["crud", "businesses"] });
    onDone?.();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-1 h-4 w-4" /> Importar planilha
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setRows([]);
            setProgress(null);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar empresas via CSV</DialogTitle>
            <DialogDescription>
              Cada linha vira uma empresa no <strong>plano Free</strong>, já{" "}
              <strong>aprovada</strong> e vinculada à categoria informada. Duplicatas (mesmo nome +
              categoria) são puladas automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-1 h-4 w-4" /> Baixar modelo CSV
              </Button>
              <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> Escolher arquivo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f).catch((err) => toast.error(err.message));
                  e.target.value = "";
                }}
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                Colunas da planilha (todas obrigatórias exceto telefone):
              </p>
              <p className="mt-1">
                <code>name, category, address, phone</code>
              </p>
              <p className="mt-2">
                <strong>category</strong> pode ser o slug (<code>alimentacao</code>) ou o nome (
                <code>Alimentação</code>).
              </p>
            </div>

            {rows.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> {okCount} válidas
                  </span>
                  {dupCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-600">
                      {dupCount} duplicadas (puladas)
                    </span>
                  )}
                  {errCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">
                      <AlertCircle className="h-3 w-3" /> {errCount} inválidas
                    </span>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Nome</th>
                        <th className="p-2 text-left">Categoria</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.index} className="border-t border-border">
                          <td className="p-2 text-muted-foreground">{r.index}</td>
                          <td className="p-2">
                            {r.raw.name || <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="p-2">
                            {r.raw.category}
                            {r.raw.subcategory ? ` / ${r.raw.subcategory}` : ""}
                          </td>
                          <td className="p-2">
                            {r.status === "ok" && <span className="text-emerald-600">OK</span>}
                            {r.status === "duplicate" && (
                              <span className="text-amber-600">Duplicada</span>
                            )}
                            {r.status === "invalid" && (
                              <span className="text-destructive">{r.error}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {progress && (
              <div className="rounded-lg border border-border bg-card p-3 text-sm">
                <p>
                  <strong>{progress.ok}</strong> importadas · <strong>{progress.skip}</strong>{" "}
                  puladas · <strong>{progress.err}</strong> com erro.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setRows([]);
                setProgress(null);
              }}
              disabled={importing}
            >
              Fechar
            </Button>
            <Button onClick={runImport} disabled={importing || okCount === 0}>
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Importar ${okCount || ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
