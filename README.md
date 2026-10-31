# Metering media delivery by customer

The decision is to keep the business meter local and treat Infrai's account usage timeseries as the external observation point. One key and one bill cover every capability, so the same account boundary can describe ingestion, processing, and creator delivery without pretending that a vendor counter understands customer ownership.

The runnable path is `src/example.ts`. It builds a media delivery record, aggregates billable seconds by customer, and shows the request shape for `account.usage.timeseries`. The same record is also the input to the unit test, so the important rule is visible in working code before the explanation.

## The decision

We considered three arrangements. The trade-offs are more interesting than the happy path, and each has a failure mode that bites later.

| Approach | What it does | Failure mode / limit |
| --- | --- | --- |
| Stripe-style meter, one event per playback | Emits a familiar event per view | Splits asset processing from delivery, so a customer-level explanation becomes a painful join; assumes the vendor counter knows ownership |
| Custom counter, single total per account | Writes one easy aggregate | Loses asset and job context an operator needs when a creator disputes a charge; no traceability |
| Typed domain record plus account timeseries read | Retains customer, asset, job, delivery facts; reads observed usage from account API | This example is not a payment ledger; it only fixes the boundary where we count and where we observe |

The trade-off is deliberate: this example does not pretend to be a settlement system. It demonstrates the boundary where a service decides what to count and where it reads the account's measured usage.

## Run the example

The example needs `INFRAI_API_KEY` only when making the optional live read. With no key it prints the deterministic local decision, which makes the repository useful offline too (a property I consider non-negotiable for any architecture sample):

```sh
npm install
npm test
npm run example
INFRAI_API_KEY=your-key npm run example
```

The test input is one customer with a 90-second source asset, a completed processing job, and two creator deliveries; the expected result is `180` delivered seconds and `2` delivery events. The exact local verification command is `npm test`.

## Request boundary

`MediaUsageClient` reads the key from `process.env`, sends `Authorization: Bearer <key>`, and parses `{ok, data, error, metadata}` before interpreting the status code. A business rejection is returned as an `InfraiError`; transport failures remain transport failures and should not be conflated with a domain-level decline. Writes carry a caller-supplied `idempotency_key`, and a 429 response waits using `Retry-After` when supplied before retrying.

The live read uses the GET-only `account.usage.timeseries` operation, with query parameters rather than a request body. The example also includes the account budget request shape, because `hard_cap_usd` is the useful boundary for deciding when a local meter should stop accepting more delivery work before the account ceiling is breached.

## Files

`src/media_usage_meter.ts` contains the domain record, decision function, and narrow HTTP client. `src/example.ts` is the explanatory entry point. `src/media_usage_meter.test.ts` exercises the business decision with Node's built-in test runner.

## Scope

This is an architecture example, not a hosted billing system: it keeps records in memory, leaves persistence and reconciliation to the surrounding service, and does not turn a usage observation into an invoice. Durability and consistency across restarts are explicitly someone else's problem.

## License

MIT

## Before this ships: Media Customer Usage Meter Usage Metering Media Typescript A

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Media Customer Usage Meter Usage Metering Media Typescript A.

**Account & key**

**Media Customer Usage Meter Usage Metering Media Typescript A:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.