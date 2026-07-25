---
status: accepted
phase: 01-planlegg-dagslinjen
plan: "02"
decision: forecast-acceptance-and-current-point
created: 2026-07-23
accepted: 2026-07-23
accepted_by: owner
blocks: [01-02, 01-03]
---

# ADR: One acceptance clock for forecast currentness

## Context

Plan 01-02 has repeatedly failed independent review because currentness is derived at different times in different layers:

- network source age used request-start time;
- persistent cache used read time for source age but retained original fetch time for cache age;
- memory fallback initially reused committed source currentness;
- `extractNow` had no clock and therefore inferred "now" from array position or period availability.

Local fixes closed individual reproductions but left equivalent bypasses. The architecture needs one explicit clock contract rather than more conditional checks.

MET documents that:

- `meta.updated_at` is the most recent time the forecast data was updated;
- timeseries values are sorted increasing in UTC;
- instant values describe the state at the exact point timestamp;
- `next_1_hours` describes the one-hour period starting at that point timestamp;
- the terminal point can contain only instant data.

Primary references:

- https://docs.api.met.no/doc/ForecastJSON.html
- https://api.met.no/weatherapi/locationforecast/2.0/documentation

## Proposed decision

Introduce an explicit `evaluatedAt` epoch on every returned forecast result.

### Network

1. Start the request without creating evidence timestamps.
2. Receive and parse the response.
3. Validate the full envelope and payload.
4. Capture `acceptedAt = Date.now()` only after validation.
5. Use `acceptedAt` for:
   - source-age validation;
   - the cache commit timestamp;
   - `metadata.fetchedAt`;
   - `metadata.evaluatedAt`;
   - current-point selection.

A response that crosses the source-age boundary while in flight therefore fails closed.

### Persistent cache

On every cache read:

- retain the stored `fetchedAt` only for cache TTL and maximum-stale age;
- capture `evaluatedAt = Date.now()`;
- recompute `sourceUpdatedAt` against `evaluatedAt`;
- select the current point against `evaluatedAt`.

### Memory fallback

On every memory return:

- retain the committed `fetchedAt` for cache TTL;
- capture the caller-supplied `evaluatedAt`;
- recompute source currentness against it;
- never reuse a previously computed ready/offline decision.

### Current-point selection

`extractNow` must receive `evaluatedAt`.

It selects the unique forecast point whose one-hour interval contains the evaluation instant:

```text
point.time <= evaluatedAt < point.time + 1 hour
```

The selected point must then contain valid `next_1_hours` evidence. If no unique interval covers `evaluatedAt`, or the covering point lacks valid one-hour evidence, extraction fails closed.

This permits a later array point only when wall-clock time has genuinely advanced into that point's interval. It forbids:

- substituting a future usable point;
- treating a stale first point as current after an hour boundary;
- publishing an arbitrary 15:00 point at 09:00;
- selecting by period availability alone.

Hourly, daily and coverage extraction may continue to filter period-capable points independently because they do not claim to represent the current instant.

## Required type boundary

`ForecastFetchMetadata` gains:

```ts
evaluatedAt: number
```

`fetchedAt` remains the accepted network/cache-commit time and is used only for cache age.

`sourceUpdatedAt` remains the validated source timestamp or `null`; it is recomputed for every returned result against `evaluatedAt`.

`extractNow` changes from:

```ts
extractNow(forecast)
```

to:

```ts
extractNow(forecast, evaluatedAt)
```

The hook must pass `metadata.evaluatedAt`; no extractor may consult `Date.now()` internally.

## Mandatory RED matrix

1. Network starts at source age 5h59 and resolves two minutes later: offline, not ready.
2. Wall clock 09:00 with first forecast point 15:00: fail closed.
3. Wall clock 09:30 with points 09:00 and 10:00: select 09:00.
4. Wall clock exactly 10:00 with points 09:00 and 10:00: select 10:00.
5. Fresh cache committed at 09:55, read at 10:02 with 09:00 and 10:00 points: select 10:00 while cache TTL still uses 09:55.
6. Covering point lacks `next_1_hours` but a later point has it: fail closed.
7. Memory commit source crosses six hours between returns: second return has null currentness.
8. Network, persistent cache and memory return the same current point for the same forecast and `evaluatedAt`.
9. Current extraction is deterministic under fake time and contains no internal `Date.now()`.
10. The official terminal instant-only point remains valid raw data but can never become current without a covering one-hour period.

## Rejected alternatives

### Always use `timeseries[0]`

Rejected because a still-fresh cache can cross an hourly boundary; index 0 may then describe the previous hour.

### Use the first point containing `next_1_hours`

Rejected because period availability does not prove temporal currentness and can substitute a future forecast.

### Add a broad past/future tolerance

Rejected because an arbitrary tolerance hides gaps and can publish the wrong hour. Interval containment is derived directly from MET's period semantics.

### Use request-start time

Rejected because source validity can expire while the request is in flight.

## Consequences

- Current weather becomes fail-closed and deterministic.
- Cache freshness and source freshness remain distinct.
- One explicit evaluated clock crosses network, cache, memory, hook and extractor boundaries.
- Existing extractor test doubles must accept the new clock argument.
- Plan 01-03 remains blocked until the implementation has two independent PASS verdicts on one exact SHA.

## Approval

The owner approved the recommended architecture on 2026-07-23. Implementation may proceed under the mandatory RED matrix and independent-review gates above.
