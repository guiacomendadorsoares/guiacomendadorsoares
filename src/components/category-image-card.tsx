import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/guia-taxonomy";

import alimentacao from "@/assets/categories/alimentacao.jpg";
import saude from "@/assets/categories/saude.jpg";
import belezaEstetica from "@/assets/categories/beleza-estetica.jpg";
import esportesBemEstar from "@/assets/categories/esportes-bem-estar.jpg";
import automotivo from "@/assets/categories/automotivo.jpg";
import casaConstrucao from "@/assets/categories/casa-construcao.jpg";
import pets from "@/assets/categories/pets.jpg";
import educacao from "@/assets/categories/educacao.jpg";
import juridicoProfissional from "@/assets/categories/juridico-profissional.jpg";
import imobiliario from "@/assets/categories/imobiliario.jpg";
import comercio from "@/assets/categories/comercio.jpg";
import servicosGerais from "@/assets/categories/servicos-gerais.jpg";
import financeiro from "@/assets/categories/financeiro.jpg";
import comunidade from "@/assets/categories/comunidade.jpg";
import eventosEntretenimento from "@/assets/categories/eventos-entretenimento.jpg";
import transporteLogistica from "@/assets/categories/transporte-logistica.jpg";
import marketingPublicidade from "@/assets/categories/marketing-publicidade.jpg";

const IMAGE_MAP: Record<string, string> = {
  alimentacao: alimentacao,
  saude: saude,
  "beleza-estetica": belezaEstetica,
  "esportes-bem-estar": esportesBemEstar,
  automotivo: automotivo,
  "casa-construcao": casaConstrucao,
  pets: pets,
  educacao: educacao,
  "juridico-profissional": juridicoProfissional,
  imobiliario: imobiliario,
  comercio: comercio,
  "servicos-gerais": servicosGerais,
  financeiro: financeiro,
  comunidade: comunidade,
  "eventos-entretenimento": eventosEntretenimento,
  "transporte-logistica": transporteLogistica,
  "marketing-publicidade": marketingPublicidade,
};

export function CategoryImageCard({ c, count }: { c: Category; count?: number }) {
  const img = IMAGE_MAP[c.slug];
  return (
    <Link
      to="/guia/$categoria"
      params={{ categoria: c.slug }}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-card ring-1 ring-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elegant"
    >
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
      />
      {img && (
        <img
          src={img}
          alt={`Serviços de ${c.label} em Comendador Soares, Nova Iguaçu`}
          loading="lazy"
          width={768}
          height={576}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {typeof count === "number" && count > 0 && (
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-foreground shadow">
          {count}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 p-3">
        <span className="text-2xl leading-none drop-shadow-lg">{c.emoji}</span>
        <span className="font-display text-sm font-bold leading-tight text-white drop-shadow-md sm:text-base">
          {c.label}
        </span>
      </div>
    </Link>
  );
}
