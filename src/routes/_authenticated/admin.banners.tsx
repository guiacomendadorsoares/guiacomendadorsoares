import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SingleMediaUploader } from "@/components/image-uploader";
import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const INTERNAL_PAGES: { value: string; label: string }[] = [
  { value: "/", label: "Início" },
  { value: "/guia", label: "Guia de empresas" },
  { value: "/onde-comer", label: "Onde comer" },
  { value: "/vagas", label: "Vagas" },
  { value: "/imoveis", label: "Imóveis" },
  { value: "/noticias", label: "Notícias" },
  { value: "/utilidade-publica", label: "Utilidade pública" },
  { value: "/planos", label: "Planos" },
  { value: "/anuncie", label: "Anuncie" },
  { value: "/perfil", label: "Perfil" },
];

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: AdminBannersPage,
});

type Banner = {
  id: string;
  eyebrow: string;
  title: string;
  cta: string;
  href: string | null;
  media_url: string;
  media_type: "image" | "gif" | "video";
  poster_url: string | null;
  sort_order: number;
  active: boolean;
};

function AdminBannersPage() {
  const qc = useQueryClient();
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data as Banner[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("banners").insert({
        eyebrow: "Novo banner",
        title: "Edite este título",
        cta: "Saiba mais",
        media_url: "",
        media_type: "image",
        sort_order: banners.length,
        active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner criado");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p>Carregando…</p>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold">Banners da página principal</h1>
            <p className="text-sm text-muted-foreground">
              Adicione imagens, GIFs ou vídeos com link interno ou externo.
            </p>
          </div>
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="mr-1 h-4 w-4" /> Novo banner
        </Button>
      </header>
      <div className="grid gap-3">
        {banners.map((b) => (
          <BannerRow key={b.id} banner={b} />
        ))}
        {banners.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum banner cadastrado. Clique em “Novo banner” para começar.
          </p>
        )}
      </div>
    </div>
  );
}

function BannerRow({ banner }: { banner: Banner }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Banner>(banner);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.media_url) throw new Error("Envie uma imagem ou informe a URL da mídia.");
      const { error } = await (supabase as any)
        .from("banners")
        .update({
          eyebrow: form.eyebrow,
          title: form.title,
          cta: form.cta,
          href: form.href || null,
          media_url: form.media_url,
          media_type: form.media_type,
          poster_url: form.poster_url || null,
          sort_order: form.sort_order,
          active: form.active,
        })
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner salvo");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("banners").delete().eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner removido");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isVideo = form.media_type === "video";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <Label className="text-xs">Mídia (imagem, GIF ou vídeo)</Label>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Tamanho ideal: <strong>2400 × 1350 px</strong> (16:9), até 2 MB.
            <br />
            Mínimo: 1600 × 900 px. Vídeo: <strong>1920 × 1080 px</strong> (MP4/WebM, até 50 MB).
            <br />A área exibida é recortada em 4:5 (mobile), 16:9 (tablet) e 21:9 (desktop) —
            mantenha o foco no centro.
          </p>
          <SingleMediaUploader
            value={form.media_url || null}
            mediaType={form.media_type}
            folder="banners"
            aspect="wide"
            onChange={({ url, type }) =>
              setForm({
                ...form,
                media_url: url ?? "",
                media_type: type ?? form.media_type,
              })
            }
          />

          {isVideo && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">…ou cole uma URL de vídeo</Label>
              <Input
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                placeholder="https://…/video.mp4"
              />
            </div>
          )}
          <div>
            <Label className="text-xs">Tipo de mídia</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={form.media_type}
              onChange={(e) =>
                setForm({ ...form, media_type: e.target.value as Banner["media_type"] })
              }
            >
              <option value="image">Imagem</option>
              <option value="gif">GIF</option>
              <option value="video">Vídeo (MP4/WebM)</option>
            </select>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Eyebrow (etiqueta)</Label>
            <Input
              value={form.eyebrow}
              onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Texto do botão (CTA)</Label>
            <Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Link ao clicar</Label>
            <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
              <select
                className="rounded-md border border-input bg-background px-2 py-2 text-sm"
                value={
                  INTERNAL_PAGES.some((p) => p.value === (form.href ?? "")) ? (form.href ?? "") : ""
                }
                onChange={(e) => setForm({ ...form, href: e.target.value || null })}
              >
                <option value="">— Página interna —</option>
                {INTERNAL_PAGES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <Input
                value={form.href ?? ""}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="/guia ou https://exemplo.com"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Escolha uma página interna no menu ou digite uma URL personalizada (interna iniciando
              com “/” ou externa com “https://”).
            </p>
          </div>
          <div>
            <Label className="text-xs">Ordem</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end gap-2">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
            <span className="text-xs">{form.active ? "Ativo" : "Inativo"}</span>
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
