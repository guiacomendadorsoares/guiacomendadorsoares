import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Broadcast = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  image_url: string | null;
  created_at: string;
};

const STORAGE_KEY = "broadcasts:read";

function getReadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setReadIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-200)));
}

export function NotificationsBell({ variant = "card" }: { variant?: "card" | "ghost" }) {
  const [open, setOpen] = useState(false);
  const [readIds, setRead] = useState<string[]>(() => getReadIds());

  const { data } = useQuery({
    queryKey: ["broadcasts-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("id,title,body,link,image_url,created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Broadcast[];
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const items = useMemo(() => data ?? [], [data]);
  const unread = useMemo(
    () => items.filter((b) => !readIds.includes(b.id)).length,
    [items, readIds],
  );

  useEffect(() => {
    if (open && items.length) {
      const ids = Array.from(new Set([...readIds, ...items.map((i) => i.id)]));
      setRead(ids);
      setReadIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const triggerClass =
    variant === "card"
      ? "relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-card"
      : "relative grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-secondary";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button aria-label="Notificações" className={triggerClass}>
          <Bell className={variant === "card" ? "h-[18px] w-[18px]" : "h-4 w-4"} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-gold px-1 text-[10px] font-bold leading-[18px] text-primary-foreground ring-2 ring-card">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-bold">Notificações</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Sem notificações no momento.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((b) => {
                const isUnread = !readIds.includes(b.id);
                const Inner = (
                  <div className="flex gap-3 px-4 py-3 hover:bg-secondary/50">
                    {b.image_url && (
                      <img
                        src={b.image_url}
                        alt=""
                        role="presentation"
                        aria-hidden="true"
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
                        <span className="truncate">{b.title}</span>
                      </p>
                      {b.body && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{b.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(b.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={b.id}>
                    {b.link ? (
                      b.link.startsWith("http") ? (
                        <a href={b.link} target="_blank" rel="noopener noreferrer">
                          {Inner}
                        </a>
                      ) : (
                        <Link to={b.link} onClick={() => setOpen(false)}>
                          {Inner}
                        </Link>
                      )
                    ) : (
                      Inner
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
