import type { ContentTable } from "@/lib/approvals";
import type { BusinessFeatures } from "@/lib/plans";
import { CATEGORY_OPTIONS } from "@/lib/guia-taxonomy";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "number"
  | "boolean"
  | "datetime"
  | "url"
  | "image"
  | "gallery"
  | "location"
  | "subcategory";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  max?: number;
  placeholder?: string;
  half?: boolean;
  /** when set, field is gated behind this business plan feature */
  premium?: keyof BusinessFeatures;
  /** image/gallery only — sub-folder inside the storage bucket */
  folder?: string;
  /** image only — aspect ratio of the preview */
  aspect?: "square" | "wide";
  /** gallery only — which plan section drives the max count */
  limitFrom?: "business" | "properties";
  /** location only — sibling field with address text used for geocoding */
  addressKey?: string;
  /** location only — db columns for lat/lng */
  latKey?: string;
  lngKey?: string;
  /** subcategory only — sibling field whose value selects which subcat list to show */
  dependsOn?: string;
}

export interface TableSchema {
  label: string;
  titleKey: string;
  subtitleKey?: string;
  fields: FieldDef[];
  defaults: Record<string, any>;
}

export const SCHEMAS: Record<ContentTable, TableSchema> = {
  businesses: {
    label: "Empresa",
    titleKey: "name",
    subtitleKey: "address",
    defaults: { status: "approved" },
    fields: [
      { key: "name", label: "Nome *", type: "text", required: true, max: 120 },
      {
        key: "main_category",
        label: "Categoria *",
        type: "select",
        required: true,
        half: true,
        options: CATEGORY_OPTIONS,
      },
      {
        key: "subcategory",
        label: "Subcategoria *",
        type: "subcategory",
        required: true,
        half: true,
        dependsOn: "main_category",
      },
      { key: "address", label: "Endereço *", type: "text", required: true, max: 255, half: true },
      { key: "description", label: "Descrição", type: "textarea", max: 2000 },
      { key: "phone", label: "Telefone", type: "text", max: 40, half: true },
      { key: "email", label: "E-mail", type: "text", max: 255, half: true },
      {
        key: "whatsapp",
        label: "WhatsApp",
        type: "text",
        max: 40,
        half: true,
        premium: "whatsapp",
      },
      {
        key: "instagram",
        label: "Instagram",
        type: "text",
        max: 120,
        half: true,
        premium: "social",
      },
      {
        key: "logo_url",
        label: "Logo",
        type: "image",
        folder: "businesses/logo",
        aspect: "square",
        half: true,
      },
      {
        key: "banner_url",
        label: "Banner",
        type: "image",
        folder: "businesses/banner",
        aspect: "wide",
        half: true,
        premium: "banner",
      },
      {
        key: "gallery_urls",
        label: "Galeria de fotos",
        type: "gallery",
        folder: "businesses/gallery",
        limitFrom: "business",
      },
      {
        key: "__location",
        label: "Localização no mapa",
        type: "location",
        addressKey: "address",
        latKey: "latitude",
        lngKey: "longitude",
      },
    ],
  },
  jobs: {
    label: "Vaga",
    titleKey: "title",
    subtitleKey: "company",
    defaults: { type: "emprego", urgent: false, active: true, status: "approved" },
    fields: [
      { key: "title", label: "Título *", type: "text", required: true, max: 120 },
      { key: "company", label: "Empresa *", type: "text", required: true, max: 120 },
      {
        key: "type",
        label: "Tipo *",
        type: "select",
        required: true,
        options: [
          { value: "emprego", label: "Emprego" },
          { value: "estagio", label: "Estágio" },
          { value: "jovem-aprendiz", label: "Jovem Aprendiz" },
          { value: "freelancer", label: "Freelancer" },
        ],
      },
      { key: "location", label: "Local *", type: "text", required: true, max: 160, half: true },
      { key: "salary", label: "Salário", type: "text", max: 60, half: true },
      { key: "description", label: "Descrição", type: "textarea", max: 4000 },
      { key: "apply_url", label: "Link para candidatura", type: "url", max: 500, half: true },
      { key: "whatsapp", label: "WhatsApp", type: "text", max: 40, half: true },
      { key: "urgent", label: "Urgente", type: "boolean" },
      { key: "expires_at", label: "Expira em", type: "datetime" },
    ],
  },
  properties: {
    label: "Imóvel",
    titleKey: "title",
    subtitleKey: "address",
    defaults: {
      listing_type: "venda",
      kind: "casa",
      active: true,
      featured: false,
      status: "approved",
    },
    fields: [
      { key: "title", label: "Título *", type: "text", required: true, max: 160 },
      {
        key: "listing_type",
        label: "Modalidade *",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "venda", label: "Venda" },
          { value: "aluguel", label: "Aluguel" },
        ],
      },
      {
        key: "kind",
        label: "Tipo *",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "casa", label: "Casa" },
          { value: "apartamento", label: "Apartamento" },
          { value: "terreno", label: "Terreno" },
          { value: "comercial", label: "Comercial" },
        ],
      },
      { key: "price", label: "Preço (R$)", type: "number", half: true },
      {
        key: "price_label",
        label: "Texto do preço",
        type: "text",
        max: 60,
        half: true,
        placeholder: "Sob consulta",
      },
      { key: "bedrooms", label: "Quartos", type: "number", half: true },
      { key: "bathrooms", label: "Banheiros", type: "number", half: true },
      { key: "parking", label: "Vagas", type: "number", half: true },
      { key: "area_m2", label: "Área (m²)", type: "number", half: true },
      { key: "address", label: "Endereço *", type: "text", required: true, max: 255 },
      { key: "description", label: "Descrição", type: "textarea", max: 4000 },
      {
        key: "cover_url",
        label: "Foto principal",
        type: "image",
        folder: "properties/cover",
        aspect: "wide",
      },
      {
        key: "gallery_urls",
        label: "Galeria de fotos",
        type: "gallery",
        folder: "properties/gallery",
        limitFrom: "properties",
      },
      { key: "video_url", label: "URL do vídeo (YouTube)", type: "url", max: 500 },
      {
        key: "__location",
        label: "Localização no mapa",
        type: "location",
        addressKey: "address",
        latKey: "latitude",
        lngKey: "longitude",
      },
      { key: "featured", label: "Destaque", type: "boolean" },
    ],
  },
  news: {
    label: "Notícia",
    titleKey: "title",
    defaults: { category: "bairro", published: true, status: "approved" },
    fields: [
      { key: "title", label: "Título *", type: "text", required: true, max: 200 },
      {
        key: "category",
        label: "Categoria *",
        type: "select",
        required: true,
        options: [
          { value: "bairro", label: "Bairro" },
          { value: "seguranca", label: "Segurança" },
          { value: "transito", label: "Trânsito" },
          { value: "obras", label: "Obras" },
          { value: "saude", label: "Saúde" },
          { value: "educacao", label: "Educação" },
        ],
      },
      { key: "summary", label: "Resumo", type: "textarea", max: 500 },
      { key: "content", label: "Conteúdo", type: "textarea", max: 20000 },
      {
        key: "cover_url",
        label: "Foto da capa",
        type: "image",
        folder: "news/cover",
        aspect: "wide",
      },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
  },
  events: {
    label: "Evento",
    titleKey: "title",
    subtitleKey: "location",
    defaults: { is_free: false, active: true, status: "approved" },
    fields: [
      { key: "title", label: "Título *", type: "text", required: true, max: 200 },
      { key: "starts_at", label: "Início *", type: "datetime", required: true, half: true },
      { key: "ends_at", label: "Término", type: "datetime", half: true },
      { key: "location", label: "Local", type: "text", max: 255 },
      { key: "summary", label: "Resumo", type: "textarea", max: 500 },
      { key: "description", label: "Descrição", type: "textarea", max: 4000 },
      { key: "price", label: "Preço (R$)", type: "number", half: true },
      { key: "is_free", label: "Gratuito", type: "boolean", half: true },
      { key: "url", label: "Link de inscrição", type: "url", max: 500 },
      {
        key: "cover_url",
        label: "Foto da capa",
        type: "image",
        folder: "events/cover",
        aspect: "wide",
      },
      {
        key: "__location",
        label: "Localização no mapa",
        type: "location",
        addressKey: "location",
        latKey: "latitude",
        lngKey: "longitude",
      },
    ],
  },
  curiosities: {
    label: "Curiosidade",
    titleKey: "title",
    defaults: { status: "approved" },
    fields: [
      { key: "title", label: "Título *", type: "text", required: true, max: 200 },
      { key: "body", label: "Conteúdo *", type: "textarea", required: true, max: 8000 },
      {
        key: "cover_url",
        label: "Foto da capa",
        type: "image",
        folder: "curiosities/cover",
        aspect: "wide",
      },
    ],
  },
};

export function selectColumns(table: ContentTable): string {
  const s = SCHEMAS[table];
  const cols = new Set<string>(["id", "status", "created_at", "submitted_by", s.titleKey]);
  if (s.subtitleKey) cols.add(s.subtitleKey);
  for (const field of s.fields) {
    if (field.type === "location") {
      if (field.latKey) cols.add(field.latKey);
      if (field.lngKey) cols.add(field.lngKey);
      continue;
    }
    if (field.type !== "subcategory") cols.add(field.key);
    else cols.add(field.key);
  }
  return Array.from(cols).join(",");
}
