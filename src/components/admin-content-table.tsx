import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/dashboard-shell";

import type { ContentTable } from "@/lib/approvals";
import { titleColumn } from "@/lib/approvals";

export function ContentTable_({ table }: { table: ContentTable }) {
  const titleKey = titleColumn(table);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-list", table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select(`id, status, created_at, ${titleKey}`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <ul className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="h-16 animate-pulse rounded-xl border border-border bg-card shadow-card"
          />
        ))}
      </ul>
    );
  }
  if (!data?.length)
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
        Nenhum registro encontrado.
      </p>
    );

  return (
    <ul className="space-y-2">
      {data.map((row: any) => (
        <li
          key={row.id}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold">{row[titleKey] ?? "Sem título"}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(row.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          <StatusBadge status={row.status} />
        </li>
      ))}
    </ul>
  );
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Módulo em desenvolvimento — chega na próxima iteração.
      </p>
    </div>
  );
}
