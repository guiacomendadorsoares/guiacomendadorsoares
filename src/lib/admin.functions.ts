import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CONTENT_TABLES = [
  "businesses",
  "jobs",
  "properties",
  "news",
  "events",
  "curiosities",
] as const;
const ROLES = ["admin", "editor", "partner", "broker", "influencer", "user"] as const;

async function assertAdminOrEditor(context: { supabase: any; userId: string }, allowEditor = true) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (isAdmin) return;
  if (allowEditor) {
    const { data: isEditor } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "editor",
    });
    if (isEditor) return;
  }
  throw new Error("Forbidden");
}

const approveSchema = z.object({
  table: z.enum(CONTENT_TABLES),
  id: z.string().uuid(),
});

export const approveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => approveSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context);
    const { error } = await context.supabase
      .from(data.table)
      .update({
        status: "approved",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const rejectSchema = approveSchema.extend({
  reason: z.string().trim().min(1).max(500),
});

export const rejectContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rejectSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context);
    const { error } = await context.supabase
      .from(data.table)
      .update({
        status: "rejected",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
        rejection_reason: data.reason,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLES),
});

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => roleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false); // admin only
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => roleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false); // admin only
    if (data.userId === context.userId && data.role === "admin") {
      throw new Error("Você não pode remover seu próprio perfil de admin.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SELF_ROLES = ["partner", "broker", "influencer"] as const;
const selfRoleSchema = z.object({ role: z.enum(SELF_ROLES) });

export const requestSelfRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => selfRoleSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: data.role });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
    return { ok: true };
  });

const PLAN_SLUGS = ["free", "destaque", "ouro"] as const;
const PLAN_STATUSES = ["active", "suspended", "canceled", "trial"] as const;
const PLAN_SOURCES = ["manual_admin", "asaas", "promotion", "courtesy", "migration"] as const;

const setPlanSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(PLAN_SLUGS),
});

export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setPlanSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ current_plan: data.plan })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Manual plan management ---------------------------------------------

const updatePlanSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(PLAN_SLUGS).optional(),
  status: z.enum(PLAN_STATUSES).optional(),
  source: z.enum(PLAN_SOURCES).optional(),
  startedAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  reason: z.string().max(500).optional(),
});

async function applyPlanPatch(userId: string, patch: Record<string, any>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await (supabaseAdmin as any)
    .from("profiles")
    .update(patch)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export const updateUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updatePlanSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false);
    const patch: Record<string, any> = {};
    if (data.plan !== undefined) patch.current_plan = data.plan;
    if (data.status !== undefined) patch.plan_status = data.status;
    if (data.source !== undefined) patch.plan_source = data.source;
    if (data.startedAt !== undefined) patch.plan_started_at = data.startedAt;
    if (data.expiresAt !== undefined) patch.plan_expires_at = data.expiresAt;
    if (data.reason !== undefined) patch.plan_notes = data.reason;
    if (Object.keys(patch).length === 0) return { ok: true };
    await applyPlanPatch(data.userId, patch);
    return { ok: true };
  });

const quickActionSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(PLAN_SLUGS).optional(),
  days: z.number().int().positive().max(3650).optional(),
  reason: z.string().max(500).optional(),
});

export const promoteUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quickActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false);
    await applyPlanPatch(data.userId, {
      current_plan: data.plan ?? "destaque",
      plan_status: "active",
      plan_source: "manual_admin",
      plan_started_at: new Date().toISOString(),
      plan_notes: data.reason ?? null,
    });
    return { ok: true };
  });

export const demoteUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quickActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false);
    await applyPlanPatch(data.userId, {
      current_plan: "free",
      plan_status: "active",
      plan_expires_at: null,
      plan_notes: data.reason ?? null,
    });
    return { ok: true };
  });

export const suspendUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quickActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false);
    await applyPlanPatch(data.userId, {
      plan_status: "suspended",
      plan_notes: data.reason ?? null,
    });
    return { ok: true };
  });

export const reactivateUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quickActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false);
    await applyPlanPatch(data.userId, {
      plan_status: "active",
      plan_notes: data.reason ?? null,
    });
    return { ok: true };
  });

export const grantTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quickActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false);
    const days = data.days ?? 15;
    const expiresAt = new Date(Date.now() + days * 86400_000).toISOString();
    await applyPlanPatch(data.userId, {
      current_plan: data.plan ?? "destaque",
      plan_status: "trial",
      plan_source: "courtesy",
      plan_started_at: new Date().toISOString(),
      plan_expires_at: expiresAt,
      plan_notes: data.reason ?? null,
    });
    return { ok: true };
  });

export const renewUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quickActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context, false);
    const days = data.days ?? 30;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("plan_expires_at")
      .eq("user_id", data.userId)
      .maybeSingle();
    const base = prof?.plan_expires_at ? new Date(prof.plan_expires_at as string) : new Date();
    const from = base.getTime() < Date.now() ? new Date() : base;
    const expiresAt = new Date(from.getTime() + days * 86400_000).toISOString();
    await applyPlanPatch(data.userId, {
      plan_status: "active",
      plan_expires_at: expiresAt,
      plan_notes: data.reason ?? null,
    });
    return { ok: true };
  });
