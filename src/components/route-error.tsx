import { AppShell } from "@/components/app-shell";

/**
 * Error UI shared by route `errorComponent`s.
 *
 * TanStack Router types the caught `error` as `unknown`, so the message is
 * normalised here instead of at each call site.
 */
export function RouteError({ title, error }: { title: string; error: unknown }) {
  const message =
    error instanceof Error && error.message ? error.message : "Algo deu errado ao carregar esta página.";

  return (
    <AppShell title={title}>
      <p className="text-sm text-destructive">{message}</p>
    </AppShell>
  );
}
