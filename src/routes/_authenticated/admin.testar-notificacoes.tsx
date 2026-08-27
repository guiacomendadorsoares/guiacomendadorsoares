import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/testar-notificacoes")({
  component: TestNotificationsPage,
  head: () => ({
    meta: [{ title: "Testar Notificações" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function TestNotificationsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Testar notificações</h1>
        <p className="text-sm text-muted-foreground">
          Toasts in-app via Sonner. Aparecem no topo da tela.
        </p>
      </div>

      <div className="grid gap-2">
        <Button onClick={() => toast("Notificação simples")}>Simples</Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.success("Tudo certo!", { description: "Operação concluída com sucesso." })
          }
        >
          Sucesso
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.error("Ops!", { description: "Algo deu errado, tente novamente." })}
        >
          Erro
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.info("Nova notícia publicada", {
              description: "Confira as últimas novidades do bairro.",
            })
          }
        >
          Com ação
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const id = toast.loading("Enviando...");
            setTimeout(() => toast.success("Enviado!", { id }), 1500);
          }}
        >
          Loading → Sucesso
        </Button>
      </div>
    </div>
  );
}
