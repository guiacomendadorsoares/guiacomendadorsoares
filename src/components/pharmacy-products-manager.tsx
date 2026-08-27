import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pill, Plus, Trash2, Edit2, X, Save, Lock } from "lucide-react";
import { SingleImageUploader } from "@/components/image-uploader";
import { fetchPharmacyCategories } from "@/services/pharmacies.service";
import { useLimits, formatLimit } from "@/lib/plan-limits";

type Product = {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  brand: string | null;
  active_ingredient: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  promo_price: number | null;
  available: boolean;
  delivery: boolean;
  pickup: boolean;
  updated_at: string;
};

const empty = (business_id: string): Partial<Product> => ({
  business_id,
  name: "",
  category: "",
  brand: "",
  active_ingredient: "",
  description: "",
  image_url: "",
  price: null,
  promo_price: null,
  available: true,
  delivery: false,
  pickup: true,
});

export function PharmacyProductsManager({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const limits = useLimits();
  const maxProducts: number = limits.pharmacy.max_products ?? 0;
  const allowPromotion: boolean = !!limits.pharmacy.promotions;

  const { data: pharmacies = [] } = useQuery({
    queryKey: ["my-pharmacies", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,subcategory,main_category")
        .eq("submitted_by", userId)
        .eq("subcategory", "Farmácias");
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeBiz = selectedBiz ?? pharmacies[0]?.id ?? null;

  const { data: categories = [] } = useQuery({
    queryKey: ["pharm", "categories"],
    queryFn: fetchPharmacyCategories,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["my-pharm-products", activeBiz],
    enabled: !!activeBiz,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_products")
        .select("*")
        .eq("business_id", activeBiz!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Product>) => {
      if (!p.name?.trim()) throw new Error("Nome obrigatório");
      if (!p.business_id) throw new Error("Selecione uma farmácia");
      if (!p.id && maxProducts !== -1 && products.length >= maxProducts) {
        throw new Error(
          `Você atingiu o limite do seu plano (${maxProducts} produtos). Faça upgrade para cadastrar mais.`,
        );
      }
      if (p.promo_price != null && !allowPromotion) {
        throw new Error(
          "Promoções estão disponíveis a partir do plano Destaque. Faça upgrade para ativar.",
        );
      }

      const payload = {
        business_id: p.business_id,
        name: p.name.trim(),
        category: p.category || null,
        brand: p.brand || null,
        active_ingredient: p.active_ingredient || null,
        description: p.description || null,
        image_url: p.image_url || null,
        price: p.price ?? null,
        promo_price: p.promo_price ?? null,
        available: !!p.available,
        delivery: !!p.delivery,
        pickup: !!p.pickup,
      };
      if (p.id) {
        const { error } = await supabase.from("pharmacy_products").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pharmacy_products").insert(payload);
        if (error) throw error;
      }
    },

    onSuccess: () => {
      toast.success("Produto salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["my-pharm-products", activeBiz] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pharmacy_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["my-pharm-products", activeBiz] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro"),
  });

  const stats = useMemo(() => {
    const promo = products.filter((p) => p.promo_price != null).length;
    const unavailable = products.filter((p) => !p.available).length;
    return { total: products.length, promo, unavailable };
  }, [products]);

  if (pharmacies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <Pill className="mx-auto mb-2 h-6 w-6 text-primary-vibrant" />
        Cadastre sua empresa na subcategoria <strong>Farmácias</strong> para habilitar o
        gerenciamento de produtos e o comparador de preços.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pharmacies.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {pharmacies.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBiz(b.id)}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                activeBiz === b.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBox
          label={`Produtos ${products.length}/${formatLimit(maxProducts)}`}
          value={stats.total}
        />
        <StatBox label="Em promoção" value={stats.promo} />
        <StatBox label="Indisponíveis" value={stats.unavailable} />
      </div>

      {maxProducts !== -1 && products.length >= maxProducts && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-destructive" /> Você atingiu o limite do seu plano (
            {maxProducts} produtos).
          </span>
          <Link
            to="/planos"
            className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
          >
            Fazer upgrade
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Produtos
        </h3>
        <button
          onClick={() => {
            if (maxProducts !== -1 && products.length >= maxProducts) {
              toast.error("Limite do plano atingido. Faça upgrade para cadastrar mais.");
              return;
            }
            setEditing(empty(activeBiz!));
          }}
          disabled={maxProducts !== -1 && products.length >= maxProducts}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-card disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Novo produto
        </button>
      </div>

      {editing && (
        <ProductForm
          categories={categories}
          value={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={() => save.mutate(editing)}
          saving={save.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Nenhum produto cadastrado ainda. Clique em "Novo produto".
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary text-xl">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  "💊"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-bold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.brand || "—"} · {p.category || "sem categoria"} ·{" "}
                  {p.promo_price != null
                    ? `R$ ${p.promo_price} (era R$ ${p.price ?? "—"})`
                    : `R$ ${p.price ?? "—"}`}
                </p>
              </div>
              <button
                onClick={() => setEditing(p)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                aria-label="Editar"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => confirm(`Excluir "${p.name}"?`) && del.mutate(p.id)}
                className="rounded-full p-1.5 text-red-500 hover:bg-red-500/10"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="font-display text-xl font-black text-primary-vibrant">{value}</p>
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ProductForm({
  value,
  onChange,
  onCancel,
  onSave,
  saving,
  categories,
}: {
  value: Partial<Product>;
  onChange: (p: Partial<Product>) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  categories: { slug: string; name: string; icon: string | null }[];
}) {
  const upd = (patch: Partial<Product>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4 shadow-elegant">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm font-bold">
          {value.id ? "Editar produto" : "Novo produto"}
        </h4>
        <button onClick={onCancel} className="rounded-full p-1 hover:bg-secondary">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Field label="Nome *">
        <input
          className="input"
          value={value.name ?? ""}
          onChange={(e) => upd({ name: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Categoria">
          <select
            className="input"
            value={value.category ?? ""}
            onChange={(e) => upd({ category: e.target.value })}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Marca">
          <input
            className="input"
            value={value.brand ?? ""}
            onChange={(e) => upd({ brand: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Princípio ativo (medicamentos)">
        <input
          className="input"
          value={value.active_ingredient ?? ""}
          onChange={(e) => upd({ active_ingredient: e.target.value })}
        />
      </Field>

      <Field label="Descrição">
        <textarea
          className="input min-h-[64px]"
          value={value.description ?? ""}
          onChange={(e) => upd({ description: e.target.value })}
        />
      </Field>

      <Field label="Imagem">
        <SingleImageUploader
          value={value.image_url ?? ""}
          onChange={(url: string | null) => upd({ image_url: url ?? "" })}
          folder="pharmacy-products"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Preço (R$)">
          <input
            type="number"
            step="0.01"
            className="input"
            value={value.price ?? ""}
            onChange={(e) => upd({ price: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </Field>
        <Field label="Preço promocional (R$)">
          <input
            type="number"
            step="0.01"
            className="input"
            value={value.promo_price ?? ""}
            onChange={(e) =>
              upd({ promo_price: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Toggle
          label="Disponível"
          v={value.available ?? true}
          onChange={(v) => upd({ available: v })}
        />
        <Toggle
          label="Entrega"
          v={value.delivery ?? false}
          onChange={(v) => upd({ delivery: v })}
        />
        <Toggle label="Retirada" v={value.pickup ?? true} onChange={(v) => upd({ pickup: v })} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-bold"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" /> {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>

      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--card));border-radius:.5rem;padding:.5rem .625rem;font-size:.85rem;color:hsl(var(--foreground));outline:none}.input:focus{border-color:hsl(var(--primary))}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  v,
  onChange,
}: {
  label: string;
  v: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={v}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      <span className="font-semibold">{label}</span>
    </label>
  );
}
