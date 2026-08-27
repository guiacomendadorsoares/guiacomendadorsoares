import { supabase } from "@/integrations/supabase/client";
import type { ClaimStatus } from "@/lib/business-claims";

export type AdminClaimRow = {
  id: string;
  business_id: string;
  claimant_user_id: string;
  full_name: string;
  cpf: string;
  role_in_company: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  status: ClaimStatus;
  internal_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  business?: {
    id: string;
    name: string;
    category_label: string | null;
    address: string | null;
    phone: string | null;
  } | null;
};

export type AdminClaimDoc = {
  id: string;
  claim_id: string;
  doc_type: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export async function listAdminClaims(params: {
  status?: ClaimStatus | "all";
  search?: string;
}): Promise<AdminClaimRow[]> {
  let q = (supabase as any)
    .from("business_claims")
    .select(
      "id,business_id,claimant_user_id,full_name,cpf,role_in_company,phone,whatsapp,email,status,internal_notes,rejection_reason,reviewed_by,reviewed_at,created_at,updated_at,business:businesses(id,name,category_label,address,phone)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(300);
  if (params.status && params.status !== "all") q = q.eq("status", params.status);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as AdminClaimRow[];
  const term = params.search?.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter(
    (r) =>
      r.full_name?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.cpf?.toLowerCase().includes(term) ||
      r.business?.name?.toLowerCase().includes(term),
  );
}

export async function listClaimDocs(claimId: string): Promise<AdminClaimDoc[]> {
  const { data, error } = await (supabase as any)
    .from("business_claim_documents")
    .select("id,claim_id,doc_type,file_path,file_name,mime_type,size_bytes,created_at")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminClaimDoc[];
}

export async function getDocSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("business-claims").createSignedUrl(path, 600);
  if (error) return null;
  return data.signedUrl;
}

async function updateClaim(id: string, patch: Record<string, unknown>) {
  const { data: u } = await supabase.auth.getUser();
  const reviewer = u.user?.id ?? null;
  const { error } = await (supabase as any)
    .from("business_claims")
    .update({ ...patch, reviewed_by: reviewer, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function approveClaim(claim: AdminClaimRow): Promise<void> {
  // If business already has a primary owner, mark already_claimed instead.
  const { data: hasOwner } = await (supabase as any).rpc("business_has_owner", {
    _business_id: claim.business_id,
  });
  if (hasOwner) {
    await updateClaim(claim.id, { status: "already_claimed" });
    throw new Error(
      "Esta empresa já possui um proprietário vinculado. Marcada como já reivindicada.",
    );
  }
  // Create membership as primary owner
  const { error: memErr } = await (supabase as any).from("business_members").insert({
    business_id: claim.business_id,
    user_id: claim.claimant_user_id,
    role: "proprietario",
    status: "active",
    is_primary_owner: true,
  });
  if (memErr) throw memErr;
  await updateClaim(claim.id, { status: "approved", rejection_reason: null });
}

export async function rejectClaim(id: string, reason: string): Promise<void> {
  await updateClaim(id, { status: "rejected", rejection_reason: reason });
}

export async function requestDocsClaim(id: string, note: string): Promise<void> {
  await updateClaim(id, { status: "awaiting_docs", internal_notes: note });
}

export async function reopenClaim(id: string): Promise<void> {
  await updateClaim(id, { status: "in_review", rejection_reason: null });
}

export async function setInReview(id: string): Promise<void> {
  await updateClaim(id, { status: "in_review" });
}

export async function saveInternalNotes(id: string, notes: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("business_claims")
    .update({ internal_notes: notes })
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteClaim(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("business_claims")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function transferOwnership(businessId: string, newUserId: string): Promise<void> {
  // Deactivate current primary owners
  const { error: e1 } = await (supabase as any)
    .from("business_members")
    .update({ is_primary_owner: false })
    .eq("business_id", businessId)
    .eq("is_primary_owner", true);
  if (e1) throw e1;
  const { data: existing } = await (supabase as any)
    .from("business_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", newUserId)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await (supabase as any)
      .from("business_members")
      .update({ role: "proprietario", status: "active", is_primary_owner: true, deleted_at: null })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await (supabase as any).from("business_members").insert({
      business_id: businessId,
      user_id: newUserId,
      role: "proprietario",
      status: "active",
      is_primary_owner: true,
    });
    if (error) throw error;
  }
}
