import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SingleImageUploader } from "@/components/image-uploader";

export const Route = createFileRoute("/_authenticated/admin/utilidade-publica")({
  component: AdminUtilidadePublica,
});

type Row = {
  id: string;
  name: string;
  category: string;
  phones: string[] | null;
  email: string | null;
  website: string | null;
  address: string | null;
  hours: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string | null;
  is_emergency: boolean;
  active: boolean;
  image_url: string | null;
};

const CATEGORIES = [
  "Prefeitura",
  "Ouvidoria",
  "Defesa Civil",
  "Emergência",
  "Secretarias Municipais",
  "Órgãos Municipais",
  "Saúde",
  "Educação",
  "Transporte",
  "Serviços Públicos",
];

const EMPTY: Partial<Row> = {
  name: "",
  category: "Prefeitura",
  phones: [],
  email: "",
  website: "",
  address: "",
  hours: "",
  description: "",
  source: "https://novaiguacu.rj.gov.br",
  is_emergency: false,
  active: true,
  image_url: null,
};

function AdminUtilidadePublica() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-public-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_services")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  async function save() {
    if (!editing) return;
    const name = editing.name?.trim();
    const category = editing.category;
    if (!name || !category) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }
    const payload = {
      name,
      category,
      phones: editing.phones ?? [],
      email: editing.email || null,
      website: editing.website || null,
      address: editing.address || null,
      hours: editing.hours || null,
      description: editing.description || null,
      latitude: editing.latitude ?? null,
      longitude: editing.longitude ?? null,
      source: editing.source || null,
      is_emergency: !!editing.is_emergency,
      active: editing.active ?? true,
      image_url: editing.image_url || null,
    };
    const { error } = editing.id
      ? await supabase.from("public_services").update(payload).eq("id", editing.id)
      : await supabase.from("public_services").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo!");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-public-services"] });
    qc.invalidateQueries({ queryKey: ["public_services"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    const { error } = await supabase.from("public_services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["admin-public-services"] });
    qc.invalidateQueries({ queryKey: ["public_services"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Utilidade Pública</h2>
          <p className="text-sm text-muted-foreground">
            Gerenciar contatos oficiais e serviços públicos
          </p>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {editing && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Editar" : "Novo"} serviço</h3>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={editing.category ?? ""}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Telefones (separados por vírgula)</Label>
              <Input
                value={(editing.phones ?? []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    phones: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={editing.email ?? ""}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Site</Label>
              <Input
                value={editing.website ?? ""}
                onChange={(e) => setEditing({ ...editing, website: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={editing.address ?? ""}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input
                value={editing.hours ?? ""}
                onChange={(e) => setEditing({ ...editing, hours: e.target.value })}
              />
            </div>
            <div>
              <Label>Fonte (URL)</Label>
              <Input
                value={editing.source ?? ""}
                onChange={(e) => setEditing({ ...editing, source: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Imagem do card</Label>
              <SingleImageUploader
                folder="public-services"
                aspect="wide"
                value={editing.image_url ?? null}
                onChange={(url) => setEditing({ ...editing, image_url: url })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!editing.is_emergency}
                onCheckedChange={(v) => setEditing({ ...editing, is_emergency: v })}
              />
              <Label>Emergência</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editing.active ?? true}
                onCheckedChange={(v) => setEditing({ ...editing, active: v })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {row.name}{" "}
                  {row.is_emergency && (
                    <span className="ml-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">
                      SOS
                    </span>
                  )}
                  {!row.active && (
                    <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      inativo
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.category} · {(row.phones ?? []).join(" / ") || "sem telefone"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(row)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(row.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
