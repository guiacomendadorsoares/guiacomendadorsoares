import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const codeSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[A-Za-z0-9_-]+$/);

export const redeemCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: codeSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!coupon) throw new Error("Cupom inválido");
    if (!coupon.active) throw new Error("Cupom inativo");
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      throw new Error("Cupom expirado");
    if (coupon.used_count >= coupon.max_uses) throw new Error("Cupom esgotado");

    // Prevent double redemption per user
    const { data: existing } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) throw new Error("Você já usou este cupom");

    const { data: plan } = await supabaseAdmin
      .from("subscription_plans")
      .select("id, slug, name")
      .eq("slug", coupon.plan_slug)
      .maybeSingle();
    if (!plan) throw new Error("Plano do cupom não encontrado");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + coupon.days * 24 * 60 * 60 * 1000);

    const { data: sub, error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: "trial",
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        value: 0,
        billing_type: "COUPON",
      })
      .select("id")
      .single();
    if (subErr) throw new Error(subErr.message);

    await supabaseAdmin.from("coupon_redemptions").insert({
      coupon_id: coupon.id,
      user_id: userId,
      subscription_id: sub.id,
    });

    await supabaseAdmin
      .from("coupons")
      .update({ used_count: coupon.used_count + 1 })
      .eq("id", coupon.id);

    await supabaseAdmin.from("profiles").update({ current_plan: plan.slug }).eq("user_id", userId);

    return { ok: true, planName: plan.name, days: coupon.days, expiresAt: expiresAt.toISOString() };
  });

async function assertAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const adminListCoupons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        code: codeSchema,
        plan_slug: z.enum(["destaque", "ouro"]),
        days: z.number().int().min(1).max(365),
        max_uses: z.number().int().min(1).max(10000),
        expires_at: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, data: row } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: data.code.toUpperCase(),
        plan_slug: data.plan_slug,
        days: data.days,
        max_uses: data.max_uses,
        expires_at: data.expires_at || null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminToggleCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("coupons")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
