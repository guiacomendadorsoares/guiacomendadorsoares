import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { StatusBadge } from "@/components/dashboard-shell";
import { Loader2, Plus, Pencil, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import type { ContentTable } from "@/lib/approvals";
import { SCHEMAS, selectColumns, type FieldDef } from "@/lib/content-schemas";
import { useCurrentPlan } from "@/lib/plans";
import { PremiumModal } from "@/components/premium-modal";
import { SingleImageUploader, GalleryUploader } from "@/components/image-uploader";
import { LocationPicker } from "@/components/location-picker";
import { findCategory } from "@/lib/guia-taxonomy";

interface Props {
  table: ContentTable;
  /** when set, list & insert are scoped to this user */
  ownerOnly?: string;
  /** when true, new records start as 'pending' instead of 'approved' */
  forcePending?: boolean;
}

export function ContentCrud({ table, ownerOnly, forcePending }: Props) {
  const schema = SCHEMAS[table];
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const queryKey = ["crud", table, ownerOnly ?? "all"];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from(table)
        .select(selectColumns(table))
        .order("created_at", { ascending: false })
        .limit(200);
      if (ownerOnly) q = q.eq("submitted_by", ownerOnly);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: Record<string, any> & { id?: string }) => {
      const payload: Record<string, any> = { ...schema.defaults, ...values };
      delete payload.id;
      if (forcePending) payload.status = "pending";
      // Coerce empty strings to null and numbers; pass arrays through
      for (const f of schema.fields) {
        const v = payload[f.key];
        if (f.type === "location") {
          delete payload[f.key];
          continue;
        } // virtual field
        if (f.type === "gallery") payload[f.key] = Array.isArray(v) ? v : [];
        else if (f.type === "image") payload[f.key] = v || null;
        else if (v === "" || v === undefined) payload[f.key] = null;
        else if (f.type === "number" && v !== null) {
          const s = String(v).trim();
          // Brazilian format: thousands "." and decimal ",". Strip "." then replace "," with ".".
          const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
          const n = Number(normalized);
          payload[f.key] = Number.isFinite(n) ? n : null;
        } else if (f.type === "datetime" && v) payload[f.key] = new Date(v).toISOString();
      }
      // Compat: a tabela `businesses` ainda exige category/category_label NOT NULL.
      // Espelhamos os valores escolhidos na nova taxonomia.
      if (table === "businesses") {
        const main = payload.main_category;
        const sub = payload.subcategory;
        if (main) {
          payload.category = main;
          const subLabel = (await import("@/lib/guia-taxonomy")).findSubcategory(main, sub)?.label;
          const catLabel = (await import("@/lib/guia-taxonomy")).findCategory(main)?.label;
          payload.category_label = subLabel ?? catLabel ?? main;
        }
      }
      const client = supabase.from(table) as any;
      if (values.id) {
        const { error } = await client.update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await client.insert({
          ...payload,
          submitted_by: ownerOnly ?? u.user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`${schema.label} salvo`);
      qc.invalidateQueries({ queryKey });
      setEditing(null);
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey });
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">{schema.label}s</h2>
          <p className="text-xs text-muted-foreground">{data?.length ?? 0} registros.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="shrink-0">
          <Plus className="mr-1 h-4 w-4" /> Novo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !data?.length ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum registro ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{row[schema.titleKey] ?? "Sem título"}</p>
                  <StatusBadge status={row.status} />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {schema.subtitleKey && row[schema.subtitleKey]
                    ? `${row[schema.subtitleKey]} · `
                    : ""}
                  {new Date(row.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(row)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CrudFormDialog
        open={creating || !!editing}
        fields={schema.fields}
        title={editing ? `Editar ${schema.label}` : `Novo ${schema.label}`}
        initial={editing}
        defaults={schema.defaults}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={(v) => upsert.mutate(editing ? { ...v, id: editing.id } : v)}
        saving={upsert.isPending}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
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

function CrudFormDialog({
  open,
  fields,
  title,
  initial,
  defaults,
  onClose,
  onSubmit,
  saving,
}: {
  open: boolean;
  fields: FieldDef[];
  title: string;
  initial: any;
  defaults: Record<string, any>;
  onClose: () => void;
  onSubmit: (v: Record<string, any>) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, any> = { ...defaults };
    for (const f of fields) {
      const v = initial ? initial[f.key] : defaults[f.key];
      if (f.type === "boolean") init[f.key] = !!v;
      else if (f.type === "gallery") init[f.key] = Array.isArray(v) ? v : [];
      else if (f.type === "image") init[f.key] = v ?? null;
      else if (f.type === "datetime" && v) init[f.key] = new Date(v).toISOString().slice(0, 16);
      else init[f.key] = v ?? "";
    }
    setValues(init);
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !String(values[f.key] ?? "").trim()) {
        toast.error(`${f.label.replace(" *", "")} é obrigatório`);
        return;
      }
    }
    onSubmit(values);
  }

  const { plan } = useCurrentPlan();
  const businessFeatures = (plan?.features as any)?.business ?? {};
  const propertyFeatures = (plan?.features as any)?.properties ?? {};
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

  function galleryMaxFor(f: FieldDef): number {
    if (f.limitFrom === "properties") {
      const n = Number(propertyFeatures.max_photos ?? 5);
      return Number.isFinite(n) && n > 0 ? n : 999;
    }
    // business gallery: gated by `gallery` feature + gallery_max
    if (!businessFeatures.gallery) return 1; // FREE: 1 image
    const n = Number(businessFeatures.gallery_max ?? 20);
    return Number.isFinite(n) && n > 0 ? n : 999;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="crud-form" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((f) => {
              const locked = !!f.premium && !businessFeatures[f.premium];
              if (f.type === "location") {
                const lat = values[f.latKey ?? "latitude"];
                const lng = values[f.lngKey ?? "longitude"];
                const addr = values[f.addressKey ?? "address"];
                return (
                  <div key={f.key} className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">{f.label}</Label>
                    <LocationPicker
                      lat={lat != null && lat !== "" ? Number(lat) : null}
                      lng={lng != null && lng !== "" ? Number(lng) : null}
                      address={addr}
                      onChange={(c: { lat: number; lng: number } | null) =>
                        setValues({
                          ...values,
                          [f.latKey ?? "latitude"]: c?.lat ?? null,
                          [f.lngKey ?? "longitude"]: c?.lng ?? null,
                        })
                      }
                    />
                  </div>
                );
              }
              if (f.type === "subcategory") {
                const parent = values[f.dependsOn ?? "main_category"];
                const cat = findCategory(parent);
                const opts = cat?.subcategories ?? [];
                return (
                  <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        {f.label}
                      </Label>
                      <Select
                        value={values[f.key] ?? ""}
                        onValueChange={(v) => setValues({ ...values, [f.key]: v })}
                        disabled={!cat}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={cat ? "Selecione…" : "Escolha a categoria primeiro"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {opts.map((o) => (
                            <SelectItem key={o.slug} value={o.slug}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              }
              return (
                <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                  <FieldRender
                    field={f}
                    value={values[f.key]}
                    onChange={(v) => setValues({ ...values, [f.key]: v })}
                    locked={locked}
                    onLockedClick={() => setLockedFeature(f.label.replace(" *", ""))}
                    galleryMax={f.type === "gallery" ? galleryMaxFor(f) : undefined}
                  />
                </div>
              );
            })}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="crud-form" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
        <PremiumModal
          open={!!lockedFeature}
          onOpenChange={(o) => !o && setLockedFeature(null)}
          feature={lockedFeature ?? undefined}
        />
      </DialogContent>
    </Dialog>
  );
}

function FieldRender({
  field,
  value,
  onChange,
  locked,
  onLockedClick,
  galleryMax,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  locked?: boolean;
  onLockedClick?: () => void;
  galleryMax?: number;
}) {
  const label = (
    <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      {field.label}
      {locked && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Lock className="h-2.5 w-2.5" /> Premium
        </span>
      )}
    </Label>
  );
  if (locked) {
    return (
      <button type="button" onClick={onLockedClick} className="w-full space-y-1.5 text-left">
        {label}
        <div className="flex h-10 items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Disponível em planos pagos
        </div>
      </button>
    );
  }
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-md border border-input bg-transparent px-3 py-2">
        {label}
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        {label}
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.max}
          rows={4}
          placeholder={field.placeholder}
        />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        {label}
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (field.type === "image") {
    return (
      <div className="space-y-1.5">
        {label}
        <SingleImageUploader
          value={value ?? null}
          onChange={onChange}
          folder={field.folder ?? "misc"}
          aspect={field.aspect ?? "square"}
        />
      </div>
    );
  }
  if (field.type === "gallery") {
    return (
      <div className="space-y-1.5">
        {label}
        <GalleryUploader
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          folder={field.folder ?? "misc"}
          max={galleryMax ?? 1}
        />
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div className="space-y-1.5">
        {label}
        <Input
          type="text"
          inputMode="decimal"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ""))}
          placeholder={field.placeholder ?? "Ex: 1.500,00"}
        />
      </div>
    );
  }
  const inputType =
    field.type === "datetime" ? "datetime-local" : field.type === "url" ? "url" : "text";
  return (
    <div className="space-y-1.5">
      {label}
      <Input
        type={inputType}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={field.max}
        placeholder={field.placeholder}
      />
    </div>
  );
}
