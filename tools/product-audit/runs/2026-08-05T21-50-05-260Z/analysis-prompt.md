# Babyora â€” produktreise-audit

Du er en kritisk senior produktdesigner og produktstrateg. Analyser vedlagte skjermbilder som en sammenhengende mobil produktreise for norske smÃ¥barnsforeldre.

Produktprinsipp: **Gratis = i dag hjemme. Plus = fremover, overalt og sammen med familien.**

De vedlagte Mobbin- og UX Peak-prinsippene er **inspirasjon, ikke fasit**. KjÃ¸psvilje er en **ekspertinferens**, ikke mÃ¥lt konvertering. Skill alltid mellom rendered fact, repository fact, inference og uncertainty.

# Babyora product context

Babyora is a Norwegian mobile-first dressing assistant for parents of babies and toddlers. Its core job is immediate: answer what the child should wear for the current weather and situation with less uncertainty and less work.

## Product principle

- **Gratis = i dag hjemme.** One child, one fixed home place, a complete and trustworthy recommendation for today.
- **Plus = fremover, overalt og sammen med familien.** Future planning, automatic/current place, multiple places or children, smart changes, and sharing with caregivers.

Free must never be made unsafe or deliberately incomplete. Plus should sell time, automation, planning, and coordination rather than correctness.

## Target context

- A parent often uses the app one-handed during a busy, low-light morning.
- The answer should be understood before the user needs to read explanatory content.
- User-facing language uses **plagg**. Dressing order communicates layering without requiring the parent to learn a technical model.
- The avatar, clothing list, count, explanation, weather, and activity must agree.
- Health, sleep, temperature, and comfort language should be calm, useful, and appropriately cautious.

## Visual identity

- Warm, dark, editorial and tactile rather than generic SaaS.
- Temperature-reactive backgrounds are a signature on Home, Plan, and Find outfit. They support meaning but never replace labels or contrast.
- Peach/orange communicates warmth and editorial emphasis; mint is primarily action, active state, Plus, or confirmation. Cold hues belong to temperature meaning.
- Illustration families, lighting, material, scale, and avatar clothing should feel internally consistent.

## Commercial roles

- Onboarding gets the parent to first real recommendation before a broad upsell.
- Home proves daily free value.
- Outfit proves precision and trust.
- Plan makes future value concrete.
- Guide and tools build confidence and retention without diluting the core job.
- Paywall sells outcomes: prepared tomorrow, correct local context away from home, and shared understanding among caregivers.

## Known evaluation risks

Repository truth and rendered behavior must be checked before accepting a marketing claim. In particular, verify access rules, automatic location, morning reminders, future recommendations, wardrobe adaptation, learning/feedback, weather notifications, family sharing, and product/price identifiers. A polished promise is not evidence that the feature exists.



# Reference principles — inspiration, not truth

These principles are distilled from the user-provided Mobbin and UX Peak notes. They are prompts for judgment, not universal laws. Causal claims, percentages, and examples are not treated as verified unless independently sourced.

## Useful hypotheses for Babyora

1. **Value before payment.** Let a parent experience a real, personalized outfit before asking for an account, notification permission, or Plus.
2. **Sell the outcome before the feature list.** “Prepared for tomorrow” and “everyone caring for the child sees the same advice” are stronger than a list of tabs.
3. **The paywall is a journey.** Contextual entry points, earlier value proof, plan selection, trial clarity, cancellation expectations, and the final offer all shape the decision.
4. **Reduce perceived risk.** Use transparent billing, exact trial timing, clear reminders, and cancellation language. Trust is more important than pressure in a child-comfort product.
5. **Use smart defaults carefully.** Default to the common safe path, explain what was chosen, and keep overrule simple. A default must not conceal a safety-relevant assumption.
6. **Reduce decision cost.** Prefer one clear recommendation and a small number of meaningful alternatives over ranges, dense choice grids, or duplicated summaries.
7. **Home should be one step ahead.** Show the action the parent should take and the next meaningful change, not a weather dashboard that requires interpretation.
8. **Design for the thumb zone.** Frequent controls belong within comfortable reach, with conventional navigation, labels, safe-area handling, and sufficient targets.
9. **Polish can strengthen trust.** Motion, illustrations, and transitions should explain change or create calm; they do not compensate for contradictory content.
10. **Test radically different commercial stories.** Benchmarking can inspire trial timelines, outcome-led paywalls, and value previews, but only measured behavior can establish a winner.

## Guardrails

- Do not use fake urgency, invented scarcity, manipulative opt-out copy, or shame.
- Do not use loss aversion to frighten parents about child safety.
- Do not add streaks unless there is a healthy recurring behavior worth supporting; daily weather use is not a game obligation.
- Do not force a long onboarding because long flows sometimes perform well elsewhere.
- Do not copy Mobbin aesthetics or treat saves, popularity, or polish as product truth.
- Do not claim that a change will improve conversion by a percentage without Babyora data.
- Do not make free advice less correct to create a paywall.



## Rubrikk 1.0.0
- taskClarity: 20% â€” Forstår forelderen umiddelbart hva siden svarer på og hva som er viktigst?
- navigationInteraction: 15% â€” Er hovedoppgaven rask, forutsigbar og komfortabel med én hånd?
- visualCraft: 15% â€” Føles siden gjennomarbeidet, sammenhengende og tydelig Babyora?
- colorTemperature: 10% â€” Har fargene tydelige roller, god kontrast og nyttig temperaturrespons?
- copyTrust: 15% â€” Er språket tydelig, rolig, sannferdig og internt konsistent?
- productValue: 20% â€” Beviser siden gratisverdi, retention eller en troverdig Plus-verdi?
- accessibilityRobustness: 5% â€” Håndteres touch, kontrast, dynamisk tekst, bevegelse og feiltilstander?

## Sider og kommersiell rolle
- onboarding (Onboarding, appvekt 10%): Føre en ny forelder til første ekte antrekksverdi før betaling eller tillatelser.
- home (Hjem, appvekt 15%): Bevise løftet om en komplett anbefaling for i dag hjemme.
- outfit (Påkledning, appvekt 12%): Gjøre Babyoras kjerneanbefaling presis, forståelig og tillitsvekkende.
- find-outfit (Juster, appvekt 6%): Bevise at antrekket kan justeres manuelt fra dagens vær og aktivitet uten å forlate den fasit-baserte anbefalingen.
- plan (Uke / Planlegg, appvekt 10%): Gjøre Plus-verdien fremover konkret uten å svekke dagens gratisverdi.
- clothing-library (Plaggbibliotek, appvekt 4%): Vise plagg som informativ referanse når «Bytt» eller plagg-detaljen ikke dekker det brukeren leter etter.
- tog (TOG, appvekt 5%): Gi forsiktig og forståelig søvnveiledning uten å blande TOG inn i utendørspåkledning.
- warm-cold (Varm eller kald, appvekt 5%): Lære forelderen en enkel kontroll som øker trygghet og kan gi personlig tilpasning.
- first-winter (Første vinter, appvekt 5%): Bygge tillit og sesongverdi uten å gjøre tekstinnhold til hele Plus-produktet.
- settings (Innstillinger, appvekt 14%): Gjøre barn, sted, varsler, verktøy, personvern og abonnement forståelig og kontrollerbart.
- paywall (Betalingsvegg, appvekt 14%): Selge fremover, overalt og familie gjennom konkrete utfall, tydelig pris og lav opplevd risiko.

## Skjermbilder
- onboarding/start: screenshots/onboarding--start.png (captured)
- home/default: screenshots/home--default.png (captured)
- outfit/recommendation: CAPTURE_FAILED (failed)
- find-outfit/default: CAPTURE_FAILED (failed)
- plan/default: screenshots/plan--default.png (captured)
- clothing-library/default: CAPTURE_FAILED (failed)
- tog/default: screenshots/tog--default.png (captured)
- warm-cold/default: screenshots/warm-cold--default.png (captured)
- first-winter/overview: screenshots/first-winter--overview.png (captured)
- settings/default: screenshots/settings--default.png (captured)
- paywall/default: screenshots/paywall--default.png (captured)

## Krav
- Vurder alle sider med gyldig capture. Ikke belÃ¸nn kosmetikk som skjuler manglende eller motstridende funksjon.
- Gi heltall 1â€“100 for hver dimensjon.
- Gi nÃ¸yaktig 1â€“3 dokumenterte styrker og maksimalt 3 prioriterte problemer per side.
- Hvert problem mÃ¥ ha severity, evidence, evidenceType, impact og recommendation.
- UnngÃ¥ generiske rÃ¥d som Â«bedre spacingÂ» uten Ã¥ navngi element, forhold og Ã¸nsket effekt.
- Ikke foreslÃ¥ fake urgency, manipulerende tapsbudskap eller Ã¥ svekke gratisrÃ¥det.
- Vurder fargepalettens semantikk, temperaturbakgrunn, enhÃ¥ndsbruk, tillit og kjÃ¸psbidrag.

## OUTPUT_JSON_ONLY
Returner kun gyldig JSON uten markdown-gjerde med denne formen:
{
  "rubricVersion": "1.0.0",
  "productDiagnosis": "3â€“5 setninger",
  "primaryPurchaseBlocker": "Ã©n konkret hovedbarriere",
  "crossScreenFindings": [
    { "title": "...", "detail": "...", "evidence": "...", "evidenceType": "rendered|repository|inference|uncertainty", "severity": "critical|high|medium|low", "impact": "...", "recommendation": "..." }
  ],
  "pages": [
    {
      "pageId": "home",
      "dimensionScores": { "taskClarity": 1, "navigationInteraction": 1, "visualCraft": 1, "colorTemperature": 1, "copyTrust": 1, "productValue": 1, "accessibilityRobustness": 1 },
      "strengths": [{ "title": "...", "detail": "...", "evidence": "...", "evidenceType": "rendered|repository|inference|uncertainty" }],
      "issues": [{ "title": "...", "detail": "...", "evidence": "...", "evidenceType": "rendered|repository|inference|uncertainty", "severity": "critical|high|medium|low", "impact": "...", "recommendation": "..." }],
      "commercialDiagnosis": "hvordan siden pÃ¥virker verdi, retention eller betaling",
      "confidence": "high|medium|low",
      "confidenceReason": "..."
    }
  ]
}
