# TASK-021 — RevenueCat configuration evidence

**Date:** 2026-08-22

**Status:** LOCAL CONTRACT PASS; SANDBOX EVIDENCE BLOCKED ON OWNER CONSOLE/DEVICE

**Scope:** entitlement, offering, and monthly/annual package mapping

## Clone-verifiable evidence

| Requirement | Evidence | Result |
| --- | --- | --- |
| Entitlement is `premium` | Exported `REVENUECAT_ENTITLEMENT_ID`; used by check, purchase, and restore paths | PASS |
| Offering is `default` | `getOfferings()` selects `offerings.all.default`; it does not trust a targeted `current` offering | PASS |
| Only monthly and annual plans are purchasable | `PLAN_TO_PACKAGE_TYPE` maps `monthly` to `PACKAGE_TYPE.MONTHLY` and `yearly` to `PACKAGE_TYPE.ANNUAL` | PASS |
| Components do not select hard-coded product IDs | Runtime search under `src/` found purchase selection only by `packageType` in the billing adapter | PASS |
| Missing `default` fails closed | Adapter returns no offering even if RevenueCat supplies another `current` offering | PASS |

Focused adapter verification:

```text
npx vitest run src/lib/billing/__tests__/revenuecat.test.ts
1 file passed; 17 tests passed
```

Repository verification also passed: ESLint, TypeScript plus main/bare
production builds, and 217/217 test files with 3,316 passing tests and 1 todo.

The repository also declares empty public SDK-key placeholders in
`.env.example`, and both native Codemagic workflows reference the team-level
`klemeg_revenuecat` group. Key values were not read or copied during this
audit.

## External evidence still required

The clone cannot prove current RevenueCat, App Store Connect, Codemagic, or
device sandbox state. TASK-021 remains open until an owner-authenticated native
sandbox run proves all of the following:

1. The RevenueCat project contains entitlement ID `premium`.
2. Offering ID `default` is available to the test user and contains one
   `MONTHLY` and one `ANNUAL` package.
3. Both packages return a localized store price on the native test build.
4. The build identifies its platform and build number without exposing SDK
   keys, receipts, or App Store credentials.

Acceptable evidence is a redacted RevenueCat offering screenshot plus native
diagnostic output, or a native test log that records only offering ID, package
types, localized price presence, platform, and build number. Do not paste SDK
keys, receipts, issuer IDs, or private key material into this file.

## Stop condition

The remaining verification requires Sivert's authenticated RevenueCat/App
Store environment or a physical native sandbox build. This is the explicit
owner-console stop required by the Phase 2 prompt; it is not treated as a pass.
