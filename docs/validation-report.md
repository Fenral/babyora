# Validation Report — Snudly

_Generated: 2026-08-19_

## Verdict
**Strong**

The problem is frequent, emotionally real, and fast to test because a working app already exists. Proceed with planning, but treat recurring willingness to pay as the primary risk: free alternatives already provide a basic daily answer, so Snudly must win on infant-specific activities, localized safety, and trust.

## Scorecard
| Area | Score | Read |
|---|---:|---|
| Pain intensity | 3/5 | The clothing decision is frequent and emotionally charged, but parents currently resolve it without a direct financial cost. |
| Buyer clarity | 4/5 | First-time dads independently dressing babies aged 0–24 months are a specific, observable audience. |
| Urgency | 3/5 | The need is immediate when leaving home, but it is seasonal and easy to handle through an existing habit. |
| Differentiation | 3/5 | Infant activity modes and hard safety rules are promising, but current competitors overlap with the core recommendation. |
| Speed to validate | 4/5 | The working app shortens concept validation, but TestFlight recruitment remains conditional on clearing the active signing-profile/App Store Connect role blocker and producing a fresh build. |
| Founder advantage | 3/5 | Sivert has lived experience and strong practical communication skills, but needs external safety expertise and technical agents. |

## Core Assumption
Scandinavian dads with babies aged 0–24 months will pay a recurring subscription for a localized, trustworthy clothing recommendation because it removes enough daily uncertainty to beat free advice and competing apps.

## Fatal Flaws
| Risk | Severity | Why It Matters | Fast Test |
|---|---|---|---|
| Free core alternatives | High | Kledd gives one child's daily weather-based recommendation free and reserves planning and multiple children for Plus, while Snudly currently plans to charge for continued access to the core answer after seven days. | Show 20 target dads both value models and collect a genuine first-month payment commitment rather than a stated preference. |
| Existing feature overlap | High | BabyDress already combines outdoor and sleep recommendations, wardrobe substitutions, safety guidance, profiles, and subscriptions, so “weather-aware baby outfits” is not sufficient differentiation. | Let 10 parents use both products and require at least 7 to choose Snudly for the same specific infant-safety or activity reason. |
| Safety localization | Medium | Norwegian and Danish public guidance uses different wording and cold-weather thresholds, so translating one shared rule table risks losing trust or producing unsafe edge cases. | Have qualified reviewers in Norway, Sweden, and Denmark assess 30 boundary scenarios before multi-country release. |

Sources: [Kledd App Store listing](https://apps.apple.com/dk/app/kledd-dress-your-child-right/id6789974230), [BabyDress Swedish App Store listing](https://apps.apple.com/se/app/babydress-weather-outfits/id6758891741), [Helsenorge child-safety guidance](https://www.helsenorge.no/en/forstehjelp/safety-for-newborns-and-young-children/), [Danish newborn guidance](https://www.sundhed.dk/borger/patienthaandbogen/boern/om-boern/det-nyfoedte-barn/gode-raad-naar-man-kommer-hjem/).

## Problem Reality
- **Pain:** Parents face the same question repeatedly and hear conflicting answers when they want one clear decision; the cost is doubt, departure friction, and fear of overheating or underdressing the baby.
- **Early adopter:** A first-time Norwegian dad entering his baby's first cold or wet season who independently prepares the child for stroller walks, daycare, errands, or outdoor sleep.
- **Vitamin or painkiller:** A moderate painkiller in the moment because it ends an immediate safety-related debate, but recurring subscription value remains unproven outside cold or changeable weather.

## Competition
- **Current behavior:** Ask a partner, grandparent, or daycare worker; check a weather app; use general layering advice; then feel the baby's neck or chest afterward.
- **Real enemy:** The free, trusted household habit of asking someone else—not an app download. Kledd, BabyDress, BabyWeather, and WhatToWearBaby make the digital category visibly competitive.
- **Differentiation needed:** Own the 0–24-month decision with stroller, carrier, outdoor play, indoor sleep, and car-seat contexts; show country-specific sources and hard safety overrides; deliver the answer in dressing order with a calm, dad-first voice.

## First 10 Customers
1. Sivert asks 15 dads in his golf, family, and local-parent network for a 15-minute conversation about the last real clothing decision, then recruits the first 5 who experience the problem into TestFlight. Success is installation plus one live recommendation, not a compliment.
2. Ask one health nurse, midwife, or parent-group organizer for introductions to 5 new dads rather than an endorsement. Observe their current decision workflow and recruit 3 who will use Snudly for seven consecutive days.
3. Ask the 8 Norwegian testers for warm introductions to dads with babies in Sweden and Denmark. Recruit one active tester in each country, producing the first 10 manually acquired users and early localization evidence.

## MVP
- **Build:** Use the existing app but expose only today's localized recommendation, activity selection, safety explanations, and a real payment decision in Norwegian, Swedish, and Danish.
- **Cut:** Family sharing, weekly planning, the tools library, widgets, calibration, Android expansion, and further mascot polish do not test the core payment assumption.
- **2-week test:** Recruit 20 dads—10 in Norway, 5 in Sweden, and 5 in Denmark. Pass if at least 12 request recommendations on four or more days and at least 5 make a genuine payment commitment after experiencing the core flow. If payment fails but usage holds, pivot to a free daily answer with paid planning, multi-child, and family features.

MET Norway's Locationforecast covers the world and prioritizes the Nordic region, so weather-data coverage supports the geographic test: [MET Norway data model](https://docs.api.met.no/doc/locationforecast/datamodel.html).

## Edits Applied to product-idea.md
- Created `docs/product-idea.md` from this direct validation run.
- Narrowed the initial early adopter to first-time Norwegian dads entering their baby's first cold or wet season, while preserving Norway, Sweden, and Denmark as the overall market.
- Defined the smallest testable version as a 14-day, 20-dad TestFlight test focused on the core recommendation and real payment behavior.
- Added the three founder-confirmed risky assumptions.
- Marked `Candidates considered` as not applicable because no Idea Generator candidate round preceded validation.

## Next Step
Run the **Product Planner** skill against the synchronized vision, then generate the product vision, PRD, and roadmap with Norway-first validation gates before Sweden and Denmark expansion.
