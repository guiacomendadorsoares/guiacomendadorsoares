// Pharmacy comparator — service layer
import { supabase } from "@/integrations/supabase/client";
import { getDisplayImageUrl } from "@/lib/storage";

export type PharmacyBusiness = {
  id: string;
  name: string;
  address: string | null;
  whatsapp: string | null;
  phone: string | null;
  logo_url: string | null;
  banner_url: string | null;
  hours: any;
  verified: boolean | null;
  featured: boolean | null;
  latitude: number | null;
  longitude: number | null;
  subcategory: string | null;
  main_category: string | null;
};

export type PharmacyProduct = {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  brand: string | null;
  active_ingredient: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  promo_price: number | null;
  available: boolean;
  delivery: boolean;
  pickup: boolean;
  updated_at: string;
  business?: PharmacyBusiness | null;
};

export type PharmacyCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
};

const BUSINESS_COLS =
  "id,name,address,whatsapp,phone,logo_url,banner_url,hours,verified,featured,latitude,longitude,subcategory,main_category";

async function hydrateBusiness(b: any): Promise<PharmacyBusiness> {
  return {
    ...b,
    logo_url: await getDisplayImageUrl(b.logo_url),
    banner_url: await getDisplayImageUrl(b.banner_url),
  };
}

async function hydrateProduct(p: any): Promise<PharmacyProduct> {
  return {
    ...p,
    image_url: await getDisplayImageUrl(p.image_url),
    business: p.businesses ? await hydrateBusiness(p.businesses) : null,
  };
}

export async function fetchPharmacyCategories(): Promise<PharmacyCategory[]> {
  const { data, error } = await supabase
    .from("pharmacy_product_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[pharmacies] categories:", error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchPharmacies(): Promise<PharmacyBusiness[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_COLS)
    .eq("status", "approved")
    .eq("subcategory", "Farmácias")
    .order("featured", { ascending: false })
    .order("name", { ascending: true });
  if (error) {
    console.error("[pharmacies] pharmacies:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map(hydrateBusiness));
}

export async function fetchPromoProducts(limit = 12): Promise<PharmacyProduct[]> {
  const { data, error } = await supabase
    .from("pharmacy_products")
    .select(`*, businesses:business_id(${BUSINESS_COLS})`)
    .eq("available", true)
    .not("promo_price", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[pharmacies] promos:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map(hydrateProduct));
}

export async function searchProducts(params: {
  query?: string;
  category?: string | null;
  limit?: number;
}): Promise<PharmacyProduct[]> {
  const q = (params.query ?? "").trim();
  let query = supabase
    .from("pharmacy_products")
    .select(`*, businesses:business_id(${BUSINESS_COLS})`)
    .eq("available", true)
    .limit(params.limit ?? 60);

  if (q.length >= 2) {
    const like = `%${q}%`;
    query = query.or(
      `name.ilike.${like},brand.ilike.${like},active_ingredient.ilike.${like},description.ilike.${like}`,
    );
  }
  if (params.category) query = query.eq("category", params.category);

  const { data, error } = await query;
  if (error) {
    console.error("[pharmacies] search:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map(hydrateProduct));
}

export async function fetchProductsByBusiness(businessId: string): Promise<PharmacyProduct[]> {
  const { data, error } = await supabase
    .from("pharmacy_products")
    .select("*")
    .eq("business_id", businessId)
    .order("promo_price", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  if (error) {
    console.error("[pharmacies] by business:", error.message);
    return [];
  }
  return Promise.all((data ?? []).map(hydrateProduct));
}

export async function logSearchEvent(
  query: string,
  extra: {
    productId?: string;
    businessId?: string;
    type?: "search" | "view" | "contact";
  } = {},
) {
  try {
    await supabase.from("pharmacy_search_events").insert({
      query: query.slice(0, 200),
      product_id: extra.productId ?? null,
      business_id: extra.businessId ?? null,
      event_type: extra.type ?? "search",
    });
  } catch {
    /* fire and forget */
  }
}
