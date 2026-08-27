// Server-only Asaas API client (sandbox by default).
// Never import this file from client code.

const SANDBOX_URL = "https://api-sandbox.asaas.com/v3";
const PROD_URL = "https://api.asaas.com/v3";

function baseUrl() {
  const key = process.env.ASAAS_API_KEY ?? "";
  // $aact_hmlg_ = sandbox/homologação, $aact_prod_ = produção
  if (key.includes("_prod_")) return PROD_URL;
  return SANDBOX_URL;
}

async function asaasFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY ausente");
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: key,
      "User-Agent": "GuiaComendadorSoares/1.0",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = body?.errors?.[0]?.description ?? body?.message ?? text ?? `HTTP ${res.status}`;
    throw new Error(`Asaas: ${msg}`);
  }
  return body as T;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
}

export async function findOrCreateCustomer(input: {
  name: string;
  email: string;
  cpfCnpj?: string;
  externalReference?: string;
}): Promise<AsaasCustomer> {
  // Try to find by email first
  const list = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?email=${encodeURIComponent(input.email)}&limit=1`,
  );
  if (list.data?.[0]) return list.data[0];
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      externalReference: input.externalReference,
    }),
  });
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
  billingType: string;
}

export async function createSubscription(input: {
  customer: string;
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  billingType?: "UNDEFINED" | "PIX" | "BOLETO" | "CREDIT_CARD";
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customer,
      billingType: input.billingType ?? "UNDEFINED",
      value: input.value,
      nextDueDate: input.nextDueDate,
      cycle: "MONTHLY",
      description: input.description,
      externalReference: input.externalReference,
    }),
  });
}

export async function getFirstSubscriptionPayment(subscriptionId: string) {
  const r = await asaasFetch<{ data: Array<{ id: string; invoiceUrl?: string; status: string }> }>(
    `/subscriptions/${subscriptionId}/payments?limit=1`,
  );
  return r.data?.[0] ?? null;
}

export interface AsaasPayment {
  id: string;
  invoiceUrl?: string;
  status: string;
  billingType: string;
  value: number;
  dueDate: string;
}

export async function createPayment(input: {
  customer: string;
  billingType: "PIX" | "CREDIT_CARD";
  value: number; // total amount (for installments: total value across installments)
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  installmentCount?: number; // only for CREDIT_CARD installments
}): Promise<AsaasPayment> {
  const payload: Record<string, unknown> = {
    customer: input.customer,
    billingType: input.billingType,
    dueDate: input.dueDate,
    description: input.description,
    externalReference: input.externalReference,
  };
  if (input.billingType === "CREDIT_CARD" && input.installmentCount && input.installmentCount > 1) {
    payload.installmentCount = input.installmentCount;
    payload.totalValue = input.value;
  } else {
    payload.value = input.value;
  }
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return asaasFetch(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}

export async function listSubscriptions(params: { limit?: number; offset?: number } = {}) {
  const q = new URLSearchParams();
  q.set("limit", String(params.limit ?? 50));
  q.set("offset", String(params.offset ?? 0));
  return asaasFetch<{ data: any[]; totalCount: number; hasMore: boolean }>(`/subscriptions?${q}`);
}

export async function listPayments(params: { limit?: number; offset?: number } = {}) {
  const q = new URLSearchParams();
  q.set("limit", String(params.limit ?? 50));
  q.set("offset", String(params.offset ?? 0));
  return asaasFetch<{ data: any[]; totalCount: number; hasMore: boolean }>(`/payments?${q}`);
}

export function isSandbox() {
  return baseUrl() === SANDBOX_URL;
}
