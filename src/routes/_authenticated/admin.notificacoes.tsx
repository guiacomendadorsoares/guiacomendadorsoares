import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell, useRequireAnyRole } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Send, Power } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notificacoes")({
  component: AdminNotificacoesPage,
});

type Broadcast = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  image_url: string | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

function AdminNotificacoesPage() {
  const { ready } = useRequireAnyRole(["admin", "editor"]);
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [sending, setSending] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["admin-broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Broadcast[];
    },
    enabled: ready,
  });

  async function send() {
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("broadcasts").insert({
      title: title.trim(),
      body: body.trim() || null,
      link: link.trim() || null,
      image_url: imageUrl.trim() || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true,
    });
    setSending(false);
    if (error) {
      toast.error("Erro ao enviar", { description: error.message });
      return;
    }
    toast.success("Notificação enviada para todos os usuários!");
    setTitle("");
    setBody("");
    setLink("");
    setImageUrl("");
    setExpiresAt("");
    qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    qc.invalidateQueries({ queryKey: ["broadcasts-active"] });
  }

  async function toggleActive(b: Broadcast) {
    const { error } = await supabase
      .from("broadcasts")
      .update({ active: !b.active })
      .eq("id", b.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    qc.invalidateQueries({ queryKey: ["broadcasts-active"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir notificação?")) return;
    const { error } = await supabase.from("broadcasts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removida");
    qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    qc.invalidateQueries({ queryKey: ["broadcasts-active"] });
  }

  if (!ready) return null;

  return (
    <DashboardShell
      role="admin"
      title="Notificações"
      subtitle="Envie avisos e campanhas para todos os usuários"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Formulário */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold">Nova notificação</h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="t">Título *</Label>
              <Input
                id="t"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Ex: Promoção Black Friday"
              />
            </div>
            <div>
              <Label htmlFor="b">Mensagem</Label>
              <Textarea
                id="b"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Descrição curta da notificação"
              />
            </div>
            <div>
              <Label htmlFor="l">Link (opcional)</Label>
              <Input
                id="l"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/noticias ou https://..."
              />
            </div>
            <div>
              <Label htmlFor="i">URL da imagem (opcional)</Label>
              <Input
                id="i"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="e">Expira em (opcional)</Label>
              <Input
                id="e"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <Button onClick={send} disabled={sending} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Enviando..." : "Disparar notificação"}
            </Button>
          </div>
        </section>

        {/* Lista */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold">Histórico ({items.length})</h2>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma notificação enviada ainda.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((b) => (
                <li key={b.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-3">
                    {b.image_url && (
                      <img src={b.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{b.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${b.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          {b.active ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                      {b.body && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{b.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(b.created_at).toLocaleString("pt-BR")}
                        {b.expires_at &&
                          ` · expira ${new Date(b.expires_at).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={b.active}
                        onCheckedChange={() => toggleActive(b)}
                        aria-label="Ativa"
                      />
                      <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
