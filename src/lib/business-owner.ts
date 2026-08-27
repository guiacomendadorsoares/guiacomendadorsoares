import { supabase } from "@/integrations/supabase/client";

export type MemberRole = "proprietario" | "gerente" | "editor" | "financeiro";

export const ROLE_LABEL: Record<MemberRole, string> = {
  proprietario: "Proprietário",
  gerente: "Gerente",
  editor: "Editor",
  financeiro: "Financeiro",
};

export const ROLE_DESC: Record<MemberRole, string> = {
  proprietario: "Controle total. Gerencia equipe e transfere titularidade.",
  gerente: "Edita a empresa e gerencia a equipe (exceto proprietário).",
  editor: "Edita conteúdo da empresa (posts, fotos, dados).",
  financeiro: "Somente leitura + acesso a plano e cobrança.",
};

export const ASSIGNABLE_ROLES: MemberRole[] = ["gerente", "editor", "financeiro"];

export type MyBusiness = {
  id: string;
  name: string;
  category_label: string | null;
  status: string | null;
  cover_url: string | null;
  role: MemberRole;
  is_primary_owner: boolean;
};

export type TeamMember = {
  id: string;
  business_id: string;
  user_id: string;
  role: MemberRole;
  status: string;
  is_primary_owner: boolean;
  created_at: string;
  profile?: { email: string | null; full_name: string | null; avatar_url: string | null } | null;
};

export async function listMyBusinesses(userId: string): Promise<MyBusiness[]> {
  // Businesses via membership
  const { data: memberships, error: mErr } = await (supabase as any)
    .from("business_members")
    .select(
      "business_id, role, is_primary_owner, status, businesses:business_id(id,name,category_label,status,cover_url)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null);
  if (mErr) throw mErr;

  const rows: MyBusiness[] = [];
  const seen = new Set<string>();
  for (const m of memberships ?? []) {
    const b = (m as any).businesses;
    if (!b?.id || seen.has(b.id)) continue;
    seen.add(b.id);
    rows.push({
      id: b.id,
      name: b.name,
      category_label: b.category_label ?? null,
      status: b.status ?? null,
      cover_url: b.cover_url ?? null,
      role: (m as any).role as MemberRole,
      is_primary_owner: !!(m as any).is_primary_owner,
    });
  }

  // Legacy: businesses submitted by the user without a membership yet
  const { data: legacy } = await supabase
    .from("businesses")
    .select("id,name,category_label,status,cover_url")
    .eq("submitted_by", userId)
    .limit(200);
  for (const b of legacy ?? []) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    rows.push({
      id: b.id,
      name: b.name,
      category_label: (b as any).category_label ?? null,
      status: (b as any).status ?? null,
      cover_url: (b as any).cover_url ?? null,
      role: "proprietario",
      is_primary_owner: true,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listTeam(businessId: string): Promise<TeamMember[]> {
  const { data, error } = await (supabase as any)
    .from("business_members")
    .select("id,business_id,user_id,role,status,is_primary_owner,created_at")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("is_primary_owner", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as TeamMember[];
  if (!rows.length) return [];
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profs } = await (supabase as any)
    .from("profiles")
    .select("user_id,email,full_name,avatar_url")
    .in("user_id", ids);
  const byId = new Map<string, any>((profs ?? []).map((p: any) => [p.user_id, p]));
  return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
}

export async function inviteMemberByEmail(params: {
  businessId: string;
  email: string;
  role: MemberRole;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  if (!email) throw new Error("Informe o e-mail.");
  const { data: prof, error } = await (supabase as any)
    .from("profiles")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw error;
  if (!prof?.user_id)
    throw new Error("Usuário não encontrado. Peça para essa pessoa criar uma conta primeiro.");

  const { data: existing } = await (supabase as any)
    .from("business_members")
    .select("id,status,role")
    .eq("business_id", params.businessId)
    .eq("user_id", prof.user_id)
    .maybeSingle();

  if (existing?.id) {
    const prevRole = existing.role;
    const { error: upErr } = await (supabase as any)
      .from("business_members")
      .update({ role: params.role, status: "active", deleted_at: null })
      .eq("id", existing.id);
    if (upErr) throw upErr;
    await logBusinessAudit({
      businessId: params.businessId,
      entityType: "business_members",
      entityId: existing.id,
      action: "member_reactivated",
      previousValue: { role: prevRole },
      newValue: { role: params.role, email },
    });
    return;
  }

  const { data: u } = await supabase.auth.getUser();
  const { data: inserted, error: insErr } = await (supabase as any)
    .from("business_members")
    .insert({
      business_id: params.businessId,
      user_id: prof.user_id,
      role: params.role,
      status: "active",
      is_primary_owner: false,
      invited_by: u.user?.id ?? null,
    })
    .select("id")
    .maybeSingle();
  if (insErr) throw insErr;
  await logBusinessAudit({
    businessId: params.businessId,
    entityType: "business_members",
    entityId: inserted?.id ?? null,
    action: "member_invited",
    newValue: { email, role: params.role },
  });
}

export async function updateMemberRole(memberId: string, role: MemberRole): Promise<void> {
  const { data: prev } = await (supabase as any)
    .from("business_members")
    .select("role,business_id")
    .eq("id", memberId)
    .maybeSingle();
  const { error } = await (supabase as any)
    .from("business_members")
    .update({ role })
    .eq("id", memberId);
  if (error) throw error;
  if (prev?.business_id) {
    await logBusinessAudit({
      businessId: prev.business_id,
      entityType: "business_members",
      entityId: memberId,
      action: "member_role_changed",
      fieldName: "role",
      previousValue: prev.role,
      newValue: role,
    });
  }
}

export async function removeMember(memberId: string): Promise<void> {
  const { data: prev } = await (supabase as any)
    .from("business_members")
    .select("role,business_id,user_id")
    .eq("id", memberId)
    .maybeSingle();
  const { error } = await (supabase as any)
    .from("business_members")
    .update({ status: "removed", deleted_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw error;
  if (prev?.business_id) {
    await logBusinessAudit({
      businessId: prev.business_id,
      entityType: "business_members",
      entityId: memberId,
      action: "member_removed",
      previousValue: { role: prev.role, user_id: prev.user_id },
    });
  }
}

export function canManageTeam(role: MemberRole, isPrimary: boolean): boolean {
  return isPrimary || role === "proprietario" || role === "gerente";
}

export function canEditBusiness(role: MemberRole, isPrimary: boolean): boolean {
  return isPrimary || role === "proprietario" || role === "gerente" || role === "editor";
}

// ============= Audit =============
export type AuditEntry = {
  id: string;
  business_id: string | null;
  actor_user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  field_name: string | null;
  previous_value: any;
  new_value: any;
  action: string;
  metadata: any;
  created_at: string;
  actor?: { email: string | null; full_name: string | null } | null;
};

export async function logBusinessAudit(params: {
  businessId: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  fieldName?: string | null;
  previousValue?: any;
  newValue?: any;
  metadata?: any;
}): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return;
  await (supabase as any).from("business_audit_log").insert({
    business_id: params.businessId,
    actor_user_id: u.user.id,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    action: params.action,
    field_name: params.fieldName ?? null,
    previous_value: params.previousValue ?? null,
    new_value: params.newValue ?? null,
    metadata: params.metadata ?? null,
  });
}

export async function listBusinessAudit(businessId: string, limit = 100): Promise<AuditEntry[]> {
  const { data, error } = await (supabase as any)
    .from("business_audit_log")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as AuditEntry[];
  const ids = Array.from(new Set(rows.map((r) => r.actor_user_id).filter(Boolean))) as string[];
  if (!ids.length) return rows;
  const { data: profs } = await (supabase as any)
    .from("profiles")
    .select("user_id,email,full_name")
    .in("user_id", ids);
  const byId = new Map<string, any>((profs ?? []).map((p: any) => [p.user_id, p]));
  return rows.map((r) => ({
    ...r,
    actor: r.actor_user_id ? (byId.get(r.actor_user_id) ?? null) : null,
  }));
}

// ============= Ownership transfer =============
export async function transferOwnership(params: {
  businessId: string;
  newOwnerUserId: string;
  reason?: string;
}): Promise<void> {
  const { error } = await (supabase as any).rpc("transfer_business_ownership", {
    _business_id: params.businessId,
    _new_owner_user_id: params.newOwnerUserId,
    _reason: params.reason ?? null,
  });
  if (error) throw error;
}
