import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Building2, Home, Megaphone } from "lucide-react";
import { requestSelfRole } from "@/lib/admin.functions";
import type { AppRole } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Guia Comendador Soares" },
      { name: "description", content: "Acesse sua conta no Guia Comendador Soares." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
});

type Profile = "user" | "partner" | "broker" | "influencer";

const PROFILES: {
  id: Profile;
  label: string;
  desc: string;
  icon: typeof User;
  redirect: string;
}[] = [
  {
    id: "user",
    label: "Visitante",
    desc: "Favoritar, avaliar e acompanhar o Guia",
    icon: User,
    redirect: "/minha-conta",
  },
  {
    id: "partner",
    label: "Empresa",
    desc: "Cadastrar negócio, vagas e promoções",
    icon: Building2,
    redirect: "/painel-empresa",
  },
  {
    id: "broker",
    label: "Corretor",
    desc: "Anunciar e gerenciar imóveis",
    icon: Home,
    redirect: "/painel-imoveis",
  },
  {
    id: "influencer",
    label: "Imprensa",
    desc: "Publicar notícias, eventos e curiosidades",
    icon: Megaphone,
    redirect: "/portal-imprensa",
  },
];

async function redirectForUser(userId: string, fallback: string, userEmail?: string): Promise<string> {
  if (userEmail?.toLowerCase() === "douglas288@gmail.com") return "/admin";
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as AppRole);
  if (roles.includes("admin") || roles.includes("editor")) return "/admin";
  if (roles.includes("partner")) return "/painel-empresa";
  if (roles.includes("broker")) return "/painel-imoveis";
  if (roles.includes("influencer")) return "/portal-imprensa";
  return fallback;
}

function AuthPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>("user");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const to = await redirectForUser(data.user.id, "/minha-conta", data.user.email);
        navigate({ to });
      }
    });
  }, [navigate]);

  const selected = PROFILES.find((p) => p.id === profile)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data: signUp, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${selected.redirect}`,
            data: { full_name: fullName.trim() || null, requested_profile: profile },
          },
        });
        if (error) throw error;
        if (signUp.session && profile !== "user") {
          try {
            await requestSelfRole({ data: { role: profile } });
          } catch {
            /* ignore */
          }
        }
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        if (signUp.session) {
          const to = await redirectForUser(signUp.user!.id, selected.redirect, signUp.user?.email);
          navigate({ to });
        }
      } else {
        const { data: signIn, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        if (profile !== "user") {
          try {
            await requestSelfRole({ data: { role: profile } });
          } catch (e) {
            console.error("requestSelfRole failed", e);
            toast.error("Não foi possível ativar este perfil. Verifique sua conta.");
          }
        }
        toast.success("Bem-vindo!");
        const to = await redirectForUser(signIn.user!.id, selected.redirect, signIn.user?.email);
        navigate({ to });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    if (profile !== "user") {
      sessionStorage.setItem("pending_profile", profile);
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + selected.redirect,
    });
    if (result.error) {
      toast.error("Falha no login com Google");
      setLoading(false);
      return;
    }
    if (!result.redirected) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const to = await redirectForUser(data.user.id, selected.redirect, data.user.email);
        navigate({ to });
      }
    }
  }

  async function handleForgot() {
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) {
      toast.error("Informe seu e-mail acima para receber o link de recuperação.");
      return;
    }
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // intentionally swallow to prevent user enumeration
    } finally {
      setLoading(false);
      toast.success("Se este e-mail estiver cadastrado, enviaremos as instruções em instantes.");
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-br from-background via-background to-secondary px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-7 shadow-elegant">
        <Link
          to="/"
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          ← Guia CS
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          {mode === "signin" ? "Entrar como…" : "Criar conta como…"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha o perfil que melhor representa você.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PROFILES.map((p) => {
            const Icon = p.icon;
            const active = p.id === profile;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfile(p.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition",
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl",
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-foreground">{p.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{selected.desc}</p>

        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continuar com Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          ou
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "signin" ? (
              `Entrar como ${selected.label}`
            ) : (
              `Criar conta como ${selected.label}`
            )}
          </Button>
        </form>

        {mode === "signin" && (
          <button
            type="button"
            onClick={handleForgot}
            disabled={loading}
            className="mt-3 w-full text-center text-xs font-medium text-primary-vibrant hover:underline"
          >
            Esqueci minha senha
          </button>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
