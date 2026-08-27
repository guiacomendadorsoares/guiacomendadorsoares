import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";

export function PremiumModal({
  open,
  onOpenChange,
  feature,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  feature?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full gradient-brand text-primary-foreground shadow-elegant">
            <Crown className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display text-xl">Recurso Premium</DialogTitle>
          <DialogDescription className="text-center">
            {feature ? (
              <>
                <strong>{feature}</strong> está disponível apenas para assinantes.{" "}
              </>
            ) : null}
            Este recurso está disponível apenas para assinantes. Faça upgrade do seu plano para
            desbloquear.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Agora não
          </Button>
          <Button asChild>
            <Link to="/planos" onClick={() => onOpenChange(false)}>
              Ver planos
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
