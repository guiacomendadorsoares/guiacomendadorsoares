import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlans, type Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/planos")({
  component: AdminPlanosPage,
});

function AdminPlanosPage() {
  const { data: plans = [], isLoading } = usePlans();
  if (isLoading) return <p>Carregando…</p>;
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground">
          <Crown className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold">Planos de assinatura</h1>
          <p className="text-sm text-muted-foreground">
            Edite nome, descrição, preço e disponibilidade.
          </p>
        </div>
      </header>
      <div className="grid gap-3">
        {plans.map((p) => (
          <PlanRow key={p.id} plan={p} />
        ))}
      </div>
    </div>
  );
}

function PlanRow({ plan }: { plan: Plan }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: plan.name,
    description: plan.description ?? "",
    price: plan.price,
    active: plan.active,
  });
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("subscription_plans")
        .update({
          name: form.name,
          description: form.description,
          price: form.price,
          active: form.active,
        })
        .eq("id", plan.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto_auto] md:items-end">
        <div>
          <Label className="text-xs">Nome</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea
            rows={1}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Preço (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          <span className="text-xs">{form.active ? "Ativo" : "Inativo"}</span>
        </div>
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          Salvar
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Slug: <code>{plan.slug}</code>
      </p>
    </div>
  );
}
