import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Popup = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  frequency: "once" | "session" | "always";
  priority: number;
};

function wasSeen(p: Popup) {
  if (p.frequency === "always") return false;
  const key = p.frequency === "once" ? `popup-seen-${p.id}` : `popup-seen-session-${p.id}`;
  const store = p.frequency === "once" ? localStorage : sessionStorage;
  try {
    return store.getItem(key) === "1";
  } catch {
    return false;
  }
}
function markSeen(p: Popup) {
  if (p.frequency === "always") return;
  const key = p.frequency === "once" ? `popup-seen-${p.id}` : `popup-seen-session-${p.id}`;
  const store = p.frequency === "once" ? localStorage : sessionStorage;
  try {
    store.setItem(key, "1");
  } catch {}
}

export function HomePopup() {
  const { data } = useQuery({
    queryKey: ["active-popups"],
    queryFn: async (): Promise<Popup[]> => {
      const { data, error } = await (supabase as any)
        .from("popups")
        .select("id,title,content,image_url,link_url,link_label,frequency,priority")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const [current, setCurrent] = useState<Popup | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const next = data.find((p) => !wasSeen(p));
    if (next) {
      const t = setTimeout(() => setCurrent(next), 800);
      return () => clearTimeout(t);
    }
  }, [data]);

  function close() {
    if (current) markSeen(current);
    setCurrent(null);
  }

  if (!current) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {current.image_url && (
          <img src={current.image_url} alt="" className="w-full max-h-64 object-cover" />
        )}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{current.title}</DialogTitle>
            {current.content && (
              <DialogDescription className="whitespace-pre-line">
                {current.content}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="mt-5 gap-2 sm:gap-2">
            <Button variant="ghost" onClick={close}>
              Fechar
            </Button>
            {current.link_url && (
              <Button asChild variant="premium" onClick={close}>
                <a
                  href={current.link_url}
                  target={current.link_url.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                >
                  {current.link_label || "Saiba mais"}
                </a>
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
