import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SingleImageUploader } from "@/components/image-uploader";
import { Loader2, Plus, Trash2, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/popups")({
  component: AdminPopupsPage,
});

type PopupRow = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  active: boolean;
  frequency: "once" | "session" | "always";
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
};

function AdminPopupsPage() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const { data: popups = [], isLoading } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("popups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PopupRow[];
    },
  });

  const [form, setForm] = useState({
    title: "",
    content: "",
    image_url: "",
    link_url: "",
    link_label: "",
    frequency: "session" as "once" | "session" | "always",
    starts_at: "",
    ends_at: "",
    priority: 0,
    active: true,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("popups").insert({
        title: form.title,
        content: form.content || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        link_label: form.link_label || null,
        frequency: form.frequency,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        priority: form.priority,
        active: form.active,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Popup criado");
      setForm({
        title: "",
        content: "",
        image_url: "",
        link_url: "",
        link_label: "",
        frequency: "session",
        starts_at: "",
        ends_at: "",
        priority: 0,
        active: true,
      });
      qc.invalidateQueries({ queryKey: ["admin-popups"] });
      qc.invalidateQueries({ queryKey: ["active-popups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (p: { id: string; active: boolean }) => {
      const { error } = await (supabase as any)
        .from("popups")
        .update({ active: p.active })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-popups"] });
      qc.invalidateQueries({ queryKey: ["active-popups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Popup excluído");
      qc.invalidateQueries({ queryKey: ["admin-popups"] });
      qc.invalidateQueries({ queryKey: ["active-popups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">Popups da tela principal</h1>
          <p className="text-sm text-muted-foreground">Crie avisos que aparecem ao abrir o app.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Novo popup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Mensagem</Label>
            <Textarea
              rows={3}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Imagem (opcional)</Label>
            <SingleImageUploader
              value={form.image_url}
              onChange={(url: string | null) => setForm({ ...form, image_url: url ?? "" })}
              folder="popups"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Link (opcional)</Label>
            <Input
              placeholder="/planos ou https://..."
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Texto do botão</Label>
            <Input
              placeholder="Saiba mais"
              value={form.link_label}
              onChange={(e) => setForm({ ...form, link_label: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Frequência</Label>
            <Select
              value={form.frequency}
              onValueChange={(v) => setForm({ ...form, frequency: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Uma vez por usuário</SelectItem>
                <SelectItem value="session">Uma vez por sessão</SelectItem>
                <SelectItem value="always">Sempre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Input
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Inicia em</Label>
            <Input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Termina em</Label>
            <Input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
            <span className="text-sm">{form.active ? "Ativo" : "Inativo"}</span>
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || form.title.length < 2}
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}{" "}
              Criar popup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Popups ({popups.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popups.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.frequency}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.starts_at ? new Date(p.starts_at).toLocaleDateString("pt-BR") : "—"}
                      {" → "}
                      {p.ends_at ? new Date(p.ends_at).toLocaleDateString("pt-BR") : "∞"}
                    </TableCell>
                    <TableCell>{p.priority}</TableCell>
                    <TableCell>
                      <Switch
                        checked={p.active}
                        onCheckedChange={(v) => toggle.mutate({ id: p.id, active: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Excluir popup "${p.title}"?`)) del.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {popups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum popup criado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
