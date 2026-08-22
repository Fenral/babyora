# Privacy-safe analytics event schema

Status: **TASK-027 runtime contract**

Owner: `src/lib/analytics/track.ts`

## Boundary

Every product analytics event passes through `track()`. The boundary validates
the event name, the exact property-key set, every property type, and every
allowed categorical value at runtime before calling PostHog. Unknown events,
extra keys, arbitrary strings, arrays, objects, and invalid categories reject
the complete event; partial sanitization is not used.

## Approved events

| Event | Exact properties | Allowed values |
| --- | --- | --- |
| `app_opened` | `source` | `direct`, `push`, `widget`, `deeplink` |
| `onboarding_started` | `locale`, `country` | Locale: `nb-NO`, `sv-SE`, `da-DK`, `other`; country: `NO`, `SE`, `DK`, `other` |
| `onboarding_completed` | `locale`, `country` | Same coarse values as onboarding start |
| `recommendation_requested` | none | — |
| `recommendation_rendered` | none | — |
| `recommendation_failed` | `reason` | `weather`, `location`, `engine`, `unknown` |
| `paywall_viewed` | `trigger` | `generic` or one of the closed product paywall triggers |
| `plan_selected` | `plan` | `monthly`, `yearly` |
| `purchase_result` | `plan`, `status` | Plan above; `success`, `cancelled`, `pending`, `unavailable`, `entitlement_missing`, `error` |
| `restore_result` | `status` | `restored`, `nothing_to_restore`, `unavailable` |
| `trial_result` | `plan`, `status` | Plan above; `started`, `converted`, `expired` |

`trial_result` may be emitted only from an authoritative store/provider result;
selecting a plan or assuming a configured trial is not evidence that a trial
started.

## Always forbidden

The schema has no field for child or household names, birth dates, exact age,
email, phone, account/child/household IDs, city, exact or approximate
coordinates, location labels, garment lists/counts, recommendation content,
free text, receipts, raw errors, or raw safety flags. Adding any such key to an
otherwise valid event rejects the entire event.

## Consent behavior

- Opt-out is checked before SDK initialization and before every capture.
- Opt-out persists `babyora:analytics:opt_out=1`, removes the local anonymous
  distinct ID, calls PostHog opt-out, and resets the SDK identity.
- An in-memory opt-out remains authoritative when browser storage is blocked.
- Opt-in can initialize the SDK again when it was never started because of
  prior opt-out.
- Autocapture, automatic page views, session recording, and person profiles are
  disabled in the client configuration.

## Change rule

Adding an event or property requires updating the TypeScript union, runtime
switch, this document, and fail-closed tests in the same change. A string field
must be a closed enum; analytics free text is never approved.
