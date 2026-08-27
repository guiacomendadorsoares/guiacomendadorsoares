import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutInput = z.object({
  planSlug: z.enum(["destaque", "ouro"]),
  cpfCnpj: z
    .string()
    .min(11)
    .max(20)
    .regex(/^[0-9./-]+$/),
  fullName: z.string().min(2).max(120),
  billingType: z.enum(["PIX", "CREDIT_CARD"]),
});

export const createPlanCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { findOrCreateCustomer, createPayment } = await import("./asaas.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get plan + profile
    const [{ data: plan, error: planErr }, { data: profile }] = await Promise.all([
      supabase.from("subscription_plans").select("*").eq("slug", data.planSlug).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (planErr || !plan) throw new Error("Plano não encontrado");

    // Fallback: get email from JWT claims or auth.users if profile.email is missing
    let email = profile?.email ?? (context.claims as any)?.email ?? null;
    if (!email) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        email = authUser?.user?.email ?? null;
      } catch (e) {
        console.error("getUserById failed", e);
      }
    }
    if (email && !profile?.email) {
      await supabaseAdmin.from("profiles").update({ email }).eq("user_id", userId);
    }
    if (!email) throw new Error("E-mail do usuário não encontrado. Atualize seu perfil.");

    // Customer
    const customer = await findOrCreateCustomer({
      name: data.fullName || profile?.full_name || email,
      email,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ""),
      externalReference: userId,
    });

    // One-time annual payment: PIX (single) or CREDIT_CARD (parcelado em 12x)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const monthly = Number(plan.price);
    const annualTotal = Math.round(monthly * 12 * 100) / 100;

    const payment = await createPayment({
      customer: customer.id,
      billingType: data.billingType,
      value: annualTotal,
      dueDate: dueDateStr,
      description: `Plano ${plan.name} (12 meses) — Guia Comendador Soares`,
      externalReference: userId,
      installmentCount: data.billingType === "CREDIT_CARD" ? 12 : undefined,
    });

    // Persist (admin client — bypass RLS to store cross-table refs safely)
    await supabaseAdmin
      .from("profiles")
      .update({
        asaas_customer_id: customer.id,
        cpf_cnpj: data.cpfCnpj.replace(/\D/g, ""),
        full_name: data.fullName,
      })
      .eq("user_id", userId);

    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      plan_id: plan.id,
      status: "pending",
      asaas_customer_id: customer.id,
      asaas_subscription_id: null,
      asaas_payment_id: payment.id,
      billing_type: data.billingType,
      value: annualTotal,
      next_due_date: dueDateStr,
      invoice_url: payment.invoiceUrl ?? null,
      starts_at: new Date().toISOString(),
    });

    return {
      subscriptionId: payment.id,
      invoiceUrl: payment.invoiceUrl ?? null,
    };
  });

export const listAsaasFinancials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { listSubscriptions, listPayments, isSandbox } = await import("./asaas.server");
    const [subs, pays] = await Promise.all([
      listSubscriptions({ limit: 50 }),
      listPayments({ limit: 50 }),
    ]);
    return {
      sandbox: isSandbox(),
      subscriptions: subs.data,
      payments: pays.data,
      subTotal: subs.totalCount,
      payTotal: pays.totalCount,
    };
  });

export const cancelAsaasSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ subscriptionId: z.string().min(3).max(80) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { cancelSubscription } = await import("./asaas.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await cancelSubscription(data.subscriptionId);
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("asaas_subscription_id", data.subscriptionId)
      .select("user_id")
      .maybeSingle();
    if (sub?.user_id) {
      await supabaseAdmin
        .from("profiles")
        .update({ current_plan: "free" })
        .eq("user_id", sub.user_id);
    }
    return { ok: true };
  });
