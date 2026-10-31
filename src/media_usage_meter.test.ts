import test from "node:test";
import assert from "node:assert/strict";
import { measureCustomerUsage, type Delivery } from "./media_usage_meter.ts";

test("groups delivered seconds by customer while retaining event count", () => {
  const input: Delivery[] = [
    { customerId: "customer-42", assetId: "asset-a", processingJobId: "job-a", deliveredSeconds: 90 },
    { customerId: "customer-42", assetId: "asset-a", processingJobId: "job-a", deliveredSeconds: 90 },
    { customerId: "customer-99", assetId: "asset-b", processingJobId: "job-b", deliveredSeconds: 30 },
  ];
  assert.deepEqual(measureCustomerUsage(input), [
    { customerId: "customer-42", deliveredSeconds: 180, deliveryEvents: 2 },
    { customerId: "customer-99", deliveredSeconds: 30, deliveryEvents: 1 },
  ]);
});
