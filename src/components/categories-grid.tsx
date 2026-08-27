import { Link } from "@tanstack/react-router";
import {
  Scale,
  Dumbbell,
  UtensilsCrossed,
  Building2,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Dog,
  Scissors,
  Wrench,
  LifeBuoy,
} from "lucide-react";
import type { ComponentType, MouseEvent } from "react";
import { useState } from "react";

type Cat = {
  label: string;
  slug: string;
  icon: ComponentType<{ className?: string }>;
  from: string;
  to2: string;
};

const cats: Cat[] = [
  {
    slug: "juridico-profissional",
    label: "Advogados",
    icon: Scale,
    from: "#1f3a2e",
    to2: "#3b6b54",
  },
  {
    slug: "esportes-bem-estar",
    label: "Academias",
    icon: Dumbbell,
    from: "#1a4d3a",
    to2: "#34c781",
  },
  {
    slug: "alimentacao",
    label: "Alimentação",
    icon: UtensilsCrossed,
    from: "#b8842b",
    to2: "#f0c068",
  },
  { slug: "imobiliario", label: "Imóveis", icon: Building2, from: "#1f3a2e", to2: "#4a8a6b" },
  { slug: "educacao", label: "Educação", icon: GraduationCap, from: "#b8842b", to2: "#e8b85a" },
  { slug: "saude", label: "Saúde", icon: HeartPulse, from: "#1a4d3a", to2: "#5dd6a1" },
  { slug: "pets", label: "Pet Shop", icon: Dog, from: "#2a5444", to2: "#6ec79a" },
  { slug: "beleza-estetica", label: "Beleza", icon: Scissors, from: "#8a5e1f", to2: "#e8b85a" },
  { slug: "servicos-gerais", label: "Serviços", icon: Wrench, from: "#1f3a2e", to2: "#4a8a6b" },
  {
    slug: "servicos-publicos",
    label: "Utilidade Pública",
    icon: LifeBuoy,
    from: "#7a1f1f",
    to2: "#d64545",
  },
];

type Ripple = { id: number; x: number; y: number };

function CategoryTile({ cat }: { cat: Cat }) {
  const { label, slug, icon: Icon, from, to2 } = cat;
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function onPointerDown(e: MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
  }

  return (
    <Link
      to="/guia/$categoria"
      params={{ categoria: slug }}
      onMouseDown={onPointerDown}
      className="group flex flex-col items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl motion-reduce:transition-none"
    >
      <span
        className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl text-white transition-all duration-200 ease-out will-change-transform group-hover:-translate-y-0.5 group-hover:scale-[1.04] group-active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
        style={{
          background: `linear-gradient(135deg, ${from} 0%, ${to2} 100%)`,
          boxShadow: `0 10px 22px -10px ${from}cc, inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -3px 6px rgba(0,0,0,0.18)`,
        }}
      >
        <span className="pointer-events-none absolute inset-x-1.5 top-1 h-2.5 rounded-full bg-white/35 blur-[2px]" />
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 30%, rgba(255,255,255,0.35), transparent 70%)",
          }}
        />
        <Icon className="relative h-6 w-6 drop-shadow" />
        {ripples.map((r) => (
          <span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{
              left: r.x,
              top: r.y,
              width: 8,
              height: 8,
              transform: "translate(-50%, -50%)",
              animation: "cat-ripple 550ms ease-out forwards",
            }}
          />
        ))}
      </span>
      <span className="text-center text-[10.5px] font-medium leading-tight text-foreground transition-colors group-hover:text-primary">
        {label}
      </span>
      <style>{`@keyframes cat-ripple { to { width: 96px; height: 96px; opacity: 0; } }`}</style>
    </Link>
  );
}

export function CategoriesGrid() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {cats.map((c) => (
        <CategoryTile key={c.label} cat={c} />
      ))}
    </div>
  );
}
