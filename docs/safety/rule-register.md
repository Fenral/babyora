# Motor 2.0 safety rule register

Ruleset: **v2.1.0**

Recorded: **2026-08-22**

Production status: **blocked for NO, SE, and DK pending external rule review**

This register describes deterministic Snudly product logic. It is not a claim
that Snudly provides medical advice. Every rule is non-overridable: preferences,
calibration, ownership choices, UI state, and feature flags may not weaken or
remove it after recommendation assembly.

## Country status

`pending` means the rule has not been signed for that country's Motor 2.0
scenario package. `assertSafetyRulesApprovedForProduction(country)` fails closed
if any selected rule is not `approved`.

The existing `RELEASE_GATES.NO.safetyReview = approved` applies to today's
contained legacy recommendation path. It does **not** approve Motor 2.0. Sweden
and Denmark remain pilot-only at the broader country gate as well.

| Rule ID | Severity | Sources | Non-override | NO | SE | DK |
|---|---|---|---:|---|---|---|
| HB-9 | CRITICAL | AAP-HC-CARSEAT, NHTSA | yes | pending | pending | pending |
| HB-1 | CRITICAL | AAP-2022, NHS, LT-RT | yes | pending | pending | pending |
| CK-9 | HIGH | RN-AU-CARRIER, AAP-HC-HEAT, POLICY | yes | pending | pending | pending |
| HB-V2-HEAT | HIGH | AAP-HC-HEAT, POLICY | yes | pending | pending | pending |
| HB-V2-POUCH | MEDIUM | RN-AU-PRAM, AAP-HC-HEAT, POLICY | yes | pending | pending | pending |
| SB-7 | HIGH | AAP-HC-HEAT, POLICY | yes | pending | pending | pending |
| HB-V2-EXTREME-HEAT | HIGH | AAP-HC-HEAT, POLICY | yes | pending | pending | pending |
| SB-8 | MEDIUM | AAP-HC-COLD, POLICY | yes | pending | pending | pending |
| HB-V2-EXTREME-COLD | HIGH | AAP-HC-COLD, POLICY | yes | pending | pending | pending |
| HB-V2-NB-COLD | HIGH | AAP-HC-COLD, POLICY | yes | pending | pending | pending |

## Source register

External pages were checked on 2026-08-22. An external source supports the
general safety direction; it does not automatically validate Snudly's exact
temperature or time threshold.

| Source ID | Publisher | Reference |
|---|---|---|
| AAP-2022 | American Academy of Pediatrics | [2022 safe-sleep policy](https://doi.org/10.1542/peds.2022-057990) |
| NHS | National Health Service | [Safe sleep advice for babies](https://www.nhs.uk/best-start-in-life/baby/baby-basics/newborn-and-baby-sleeping-advice-for-parents/safe-sleep-advice-for-babies/) |
| LT-RT | The Lullaby Trust | [Room temperature](https://www.lullabytrust.org.uk/baby-safety/safer-sleep-information/room-temperature/) |
| RN-AU-CARRIER | Red Nose Australia | [Slings and baby carriers](https://rednose.org.au/safe-sleep-and-safer-pregnancy/pregnancy-to-birth/slings-and-baby-carriers/) |
| RN-AU-PRAM | Red Nose Australia | [The dangers of covering your pram](https://rednose.org.au/safe-sleep-and-safer-pregnancy/newborn-to-1-year/the-dangers-of-covering-your-pram/) |
| AAP-HC-HEAT | American Academy of Pediatrics | [Extreme heat guidance](https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Protecting-Children-from-Extreme-Heat-Information-for-Parents.aspx) |
| AAP-HC-COLD | American Academy of Pediatrics | [Cold weather safety](https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Cold-Weather-Safety.aspx) |
| AAP-HC-CARSEAT | American Academy of Pediatrics | [Winter car-seat safety](https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Winter-Car-Seat-Safety-Tips.aspx) |
| NHTSA | National Highway Traffic Safety Administration | [Winter driving tips — car seats](https://www.nhtsa.gov/sites/nhtsa.gov/files/2021-11/Winter%20Driving%20Tips_2021-2022_111721_v2_tag.pdf) |
| POLICY | Snudly | Internal Motor 2.0 threshold policy; no external URL and never accepted as the only source. |

## Review boundary

The external reviewer must assess the exact rule condition, action, Norwegian
copy, severity, and source fit. Sweden and Denmark additionally require native
language and local-country safety review. Approval must update the relevant
rule status in code and pass the production assertion tests; changing the broad
country release gate alone is insufficient.
