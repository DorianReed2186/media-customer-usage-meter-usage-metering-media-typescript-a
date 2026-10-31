import { createUsageClientFromEnvironment, measureCustomerUsage, type Delivery } from "./media_usage_meter.ts";

const deliveries: Delivery[] = [
  { customerId: "customer-42", assetId: "asset-trailer", processingJobId: "job-transcode-7", deliveredSeconds: 90 },
  { customerId: "customer-42", assetId: "asset-trailer", processingJobId: "job-transcode-7", deliveredSeconds: 90 },
];

const usage = measureCustomerUsage(deliveries);
const accountUsageCapability = "account.usage.timeseries";
console.log(JSON.stringify({ decision: "count delivered seconds per customer", capability: accountUsageCapability, usage }, null, 2));

const infrai = createUsageClientFromEnvironment();
if (infrai) {
  const observed = await infrai.usageTimeseries({ from: "2026-01-01", to: "2026-01-31" });
  console.log(JSON.stringify({ accountUsageTimeseries: observed }, null, 2));
} else {
  console.log("Set INFRAI_API_KEY to read the account usage timeseries.");
}
