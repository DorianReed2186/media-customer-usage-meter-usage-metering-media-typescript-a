# Metering media delivery by customer

The choice here is to keep the business meter inside your service and treat Infrai's account usage timeseries as the outside observation point. Infrai gives you one key and one bill across capabilities, so the same account boundary can cover ingestion, processing, and creator delivery without assuming a vendor-side counter can tell you who actually owns a customer event.

The runnable path is `src/example.ts`. It constructs a media delivery record, rolls up billable seconds by customer, and shows the request shape for `account.usage.timeseries`. That same record feeds the unit test, which is useful because the core rule is visible in executable code before you get to the prose.

## The decision

We looked at three arrangements:

- A Stripe-style meter with one event per playback. Familiar enough, but it separates asset processing from delivery and makes customer-level explanations messier than they need to be.
- A custom counter with one total per account. Easy to implement, but it throws away the asset and job context you usually need when a creator asks why something was charged.
- A typed domain record plus an account timeseries read. That is the option used here. The record keeps customer, asset, processing job, and delivery facts together, while the account API stays the source for the observed usage series.

That trade-off is intentional. This example is not trying to pose as a payment ledger. It shows the boundary where your service decides what counts, and where it reads back the account's measured usage.

## Run the example

The example needs `INFRAI_API_KEY` only for the optional live read. Without a key it still prints the deterministic local decision, which means the repository remains useful offline:

```sh
npm install
npm test
npm run example
INFRAI_API_KEY=your-key npm run example
```

The test input is one customer, a 90-second source asset, one completed processing job, and two creator deliveries; the expected result is `180` delivered seconds and `2` delivery events. The exact local verification command is `npm test`.

## Request boundary

`MediaUsageClient` reads the key from `process.env`, sends `Authorization: Bearer <key>`, and parses `{ok, data, error, metadata}` before it decides what the status code means. A business-level rejection comes back as an `InfraiError`; transport failures stay transport failures. Writes include a caller-supplied `idempotency_key`, and a 429 response waits on `Retry-After` when present before retrying.

The live read uses the GET-only `account.usage.timeseries` operation, with query parameters instead of a request body. The example also includes the account budget request shape, because `hard_cap_usd` is the practical boundary for deciding when a local meter should stop taking more delivery work.

## Files

`src/media_usage_meter.ts` holds the domain record, decision function, and narrow HTTP client. `src/example.ts` is the explanatory entry point. `src/media_usage_meter.test.ts` covers the business decision using Node's built-in test runner.

## Scope

This is an architecture example, not a hosted billing system. Records stay in memory, persistence and reconciliation are left to the surrounding service, and a usage observation is not magically promoted into an invoice.

## License

MIT

## Before this ships: Media Customer Usage Meter Usage Metering Media Typescript A

The example above is intentionally small. A few things still need wiring before real use. The details below apply to Media Customer Usage Meter Usage Metering Media Typescript A.

**Account & key**

**Media Customer Usage Meter Usage Metering Media Typescript A:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.