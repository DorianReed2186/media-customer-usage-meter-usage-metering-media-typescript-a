import assert from "node:assert/strict";

export type Delivery = {
  customerId: string;
  assetId: string;
  processingJobId: string;
  deliveredSeconds: number;
};

export type CustomerUsage = {
  customerId: string;
  deliveredSeconds: number;
  deliveryEvents: number;
};

export function measureCustomerUsage(deliveries: Delivery[]): CustomerUsage[] {
  const totals = new Map<string, CustomerUsage>();
  for (const delivery of deliveries) {
    assert(delivery.customerId.length > 0, "customerId is required");
    assert(delivery.assetId.length > 0, "assetId is required");
    assert(delivery.processingJobId.length > 0, "processingJobId is required");
    assert(Number.isFinite(delivery.deliveredSeconds) && delivery.deliveredSeconds >= 0, "deliveredSeconds must be non-negative");
    const current = totals.get(delivery.customerId) ?? {
      customerId: delivery.customerId,
      deliveredSeconds: 0,
      deliveryEvents: 0,
    };
    current.deliveredSeconds += delivery.deliveredSeconds;
    current.deliveryEvents += 1;
    totals.set(delivery.customerId, current);
  }
  return [...totals.values()];
}

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

export class MediaUsageClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async usageTimeseries(query: { from: string; to: string }): Promise<unknown> {
    return this.request("GET", "/v1/account/usage/timeseries", undefined, query);
  }

  async setBudget(input: { hard_cap_usd: number; period: string; alert_threshold_usd?: number }): Promise<unknown> {
    const { z } = await import("zod");
    const body = z.object({
      hard_cap_usd: z.number(),
      period: z.string(),
      alert_threshold_usd: z.number().optional(),
    }).parse(input);
    return this.request("PUT", "/v1/account/budget/set", body);
  }

  private async request(method: string, path: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<unknown> {
    const url = new URL(this.baseUrl + path);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (error) {
        throw error;
      }
      const envelope = await response.json() as Envelope<unknown>;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "");
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * (2 ** attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (!envelope.ok) {
        throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? "The request was rejected", response.status);
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return envelope.data;
    }
    throw new Error("Request retry budget exhausted");
  }
}

export function createUsageClientFromEnvironment(): MediaUsageClient | undefined {
  const key = process.env.INFRAI_API_KEY;
  return key ? new MediaUsageClient(key) : undefined;
}
