import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  adminListCoupons,
  adminCreateCoupon,
  adminToggleCoupon,
  adminDeleteCoupon,
} from "@/lib/coupons.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cupons")({
  component: CuponsPage,
});

function CuponsPage() {
  const list = useServerFn(adminListCoupons);
  const create = useServerFn(adminCreateCoupon);
  const toggle = useServerFn(adminToggleCoupon);
  const del = useServerFn(adminDeleteCoupon);
  const qc = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => list(),
  });

  const [code, setCode] = useState("");
  const [planSlug, setPlanSlug] = useState<"destaque" | "ouro">("destaque");
  const [days, setDays] = useState(30);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          code: code.toUpperCase().trim(),
          plan_slug: planSlug,
          days,
          max_uses: maxUses,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        },
      }),
    onSuccess: () => {
      toast.success("Cupom criado");
      setCode("");
      setDays(30);
      setMaxUses(1);
      setExpiresAt("");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (p: { id: string; active: boolean }) => toggle({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Cupom excluído");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Cupons de Teste Grátis</h1>
        <p className="text-sm text-muted-foreground">
          Crie cupons que liberam um plano por X dias, sem passar pelo Asaas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo cupom</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Código</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TESTE30"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Plano</Label>
            <Select value={planSlug} onValueChange={(v) => setPlanSlug(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="destaque">Destaque</SelectItem>
                <SelectItem value="ouro">Ouro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Dias</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Usos máx.</Label>
            <Input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Expira em (opc.)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="md:col-span-5">
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || code.length < 3}
            >
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}{" "}
              Criar cupom
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-primary"
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          toast.success("Código copiado");
                        }}
                      >
                        {c.code} <Copy className="h-3 w-3" />
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.plan_slug}</Badge>
                    </TableCell>
                    <TableCell>{c.days}</TableCell>
                    <TableCell>
                      {c.used_count}/{c.max_uses}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.active}
                        onCheckedChange={(v) => toggleMut.mutate({ id: c.id, active: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Excluir cupom ${c.code}?`)) delMut.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {coupons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum cupom criado.
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
