# Eiervedtak · betaling og abonnementsplaner — 14.08.2026

Fattet av eier i chat 14.08.2026, etter agentobservasjon av App Store Connect og
RevenueCat dokumentert i `loop/referanse/EIER-FUNN-PROVISJONERING-2026-08-14.md`.

Dette vedtaket overstyrer `docs/DECISION-LOG.md` 2026-07-15 «Prismodell: behold
juni-provisjoneringen», som bygget på en portaltilstand som ikke lenger finnes.

---

## V1 · To planer: måned og år. Kvartal utgår.

Appen skal tilby **månedsabonnement** og **årsabonnement**. Kvartalsplanen
(«pappaperm», 99 kr / 3 mnd) **fjernes** — den finnes ikke hos Apple, og eier har
besluttet å ikke opprette den.

Konsekvens: `PLAN_ORDER`, `PRODUCT_IDS` og paywall-visningen skal ikke lenger ha en
kvartalsvariant. Spar-badgen mellom måned og år må regnes om fra de faktiske prisene.

## V2 · RevenueCat er fasit. Appen skal ikke kjenne Apples produktnavn.

Dagens feil: `PaywallDialog` kaller `purchasePackage(PRODUCT_IDS[plan])` med Apples
produkt-ID (`no.klemeg.app.yearly`), og `purchasePackage` leter etter en pakke i
RevenueCat-tilbudet med det navnet. Navnet finnes ikke i noen butikk. Kjøpet feiler.

Vedtatt retning: **appen spør etter plantype** (månedlig / årlig), ikke etter et
butikk-produktnavn. RevenueCat-tilbudet avgjør hvilket faktisk produkt det er, per
plattform. Da kan produkter, priser og butikker endres uten kodeendring, og Android
kobles senere uten å røre appen.

Dette er ikke en omskriving av betalingsintegrasjonen — RevenueCat beholdes. Det er å
bruke den slik den er ment.

## V3 · Faktisk butikktilstand som arbeidet skal måles mot

Verifisert i portalene 14.08.2026 (se funnfilen):

| Plan | Produkt-ID hos Apple | Status hos Apple |
| --- | --- | --- |
| År | `babyora_yearly_299` | Prepare for Submission |
| Måned | `babyora_monthly_49` | Prepare for Submission |
| (engangskjøp «Barnetiden») | `babyora_barnetiden_499` | Kladd — utenfor abonnementsvedtaket |

Abonnementsgruppe: «Babyora Pluss», gruppe-ID `22131969`. Entitlement i RevenueCat:
`premium`. Play Store: ingen produkter opprettet.

**`no.klemeg.app.monthly/quarterly/yearly` finnes ikke.** Ikke i App Store Connect, ikke
i RevenueCat, verken aktive eller inaktive.

## V4 · Priser skal LESES, ikke antas

Koden har i dag ankerpriser 299 / 99 / 39 kr. Produktnavnene hos Apple antyder 299 og
49. **Ingen av delene er verifisert mot prisfeltene i portalen.**

Ankerprisene i koden er kun fallback når butikken ikke har svart; ekte pris skal alltid
komme fra RevenueCat. Men fallback-tallene skal likevel stemme med faktisk butikkpris,
og de må derfor leses av i App Store Connect før de skrives inn. Ingen skal gjette.

## V5 · Kjøp skal aldri feile stille

`purchasePackage` returnerer i dag `{ success: false }` uten forklaring når ingen pakke
matcher. En kunde trykker «kjøp» og ingenting skjer. Dette er den mekanismen som skjulte
hele feilen.

Krav: når tilbudet mangler den etterspurte planen, skal det logges tydelig og vises en
ærlig feiltilstand til brukeren. Stille `false` er ikke akseptabelt for betaling.

## V6 · To dokumenter er beviselig usanne og skal rettes

1. **`DOD-SNUDLY.md` regel C2** sier at `no.klemeg.app.monthly/quarterly/yearly` er
   «uforanderlige hos Apple» og aldri skal endres. Regelen verner om ID-er som ikke
   finnes, og vil underkjenne enhver retting mot virkeligheten. Den skal endres til å
   verne om de faktisk provisjonerte ID-ene.
   **C1 (bundle-id `no.klemeg.app`) er korrekt og skal stå urørt.**
2. **`docs/DECISION-LOG.md` 2026-07-15** har fått SUPERSEDED-banner på
   produkt-ID-påstanden, men mangler fortsatt selve retningsvalget. Dette vedtaket er
   retningen og skal føres inn.

## Utenfor dette vedtaket

- Om kvartalsplanen skal gjenopplives senere som markedsføringsgrep.
- Om «Barnetiden»-engangskjøpet skal beholdes, endres eller slettes.
- Play/Android-produktene — hører til fase 7 og er fortsatt urørt.
- Bekreftelse på at et kjøp faktisk går gjennom. Det kan bare bevises på fysisk enhet
  (SN-033) og forblir en eieroppgave.
