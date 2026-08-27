import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { DesktopNav } from "./desktop-nav";
import { SiteFooter } from "./site-footer";

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DesktopNav />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {title && (
          <header className="sticky top-0 z-40 border-b border-border bg-background/85 px-5 pb-3 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-lg md:px-8 lg:px-12">
            <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground md:text-base">{subtitle}</p>
            )}
          </header>
        )}
        <main className="flex-1 px-5 pb-28 pt-4 md:px-8 md:pb-12 lg:px-12">{children}</main>
      </div>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
