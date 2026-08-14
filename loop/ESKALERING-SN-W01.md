# Eskalering · SN-W01 · Modellruting blokkerer f2

**Tidspunkt:** 2026-08-14T16:10:08Z (`date -u +%Y-%m-%dT%H:%M:%SZ`)
**BATON:** `EIER · SN-W01 · UNDERKJENT`
**Første underkjennelse:** `loop/verdicts/SN-W01-f1.md`
**Kontrollgrunnlag (f1):** `d83836d8cb8e7350b55cea37b02a57eddfbee32a`
**Gren:** `snudly/bygg`

## Hvorfor eskalering allerede etter første underkjennelse

Dette er den første ordinære underkjennelsen av SN-W01 og gir normalt rett til f2.
Codex-dommen inneholder likevel en hard blokker som gjør at f2 ikke kan
gjennomføres av modellen som holder BATON nå:

> **Funn 5 (SYS, obligatorisk modellruting).** Requesten oppgir `Opus 4.7, høy`.
> `docs/CLAUDE-START-HERE.md:17` krever Fable 5 Extra for entitlement- og
> betalingsarbeid; Opus 4.8 Extra er den eneste godkjente fallbacken.

Den samme dommen ber uttrykkelig om at f2 gjennomføres av en tillatt modell:

> «La en modell tillatt for entitlement-/betalingsarbeid gjennomføre f2 og en
> selvstendig kontroll av f1-koden: Fable 5 Extra, eller eksplisitt godkjent
> Opus 4.8 Extra-fallback. Dokumenter modellen og resultatet i f2-requesten.»

Modellrutingen er en systempolicy, ikke en teknisk feil bygger kan rette selv.
Å prøve f2 i Opus 4.7 vil reprodusere Funn 5 og brenne det andre av tre
ordinære forsøk uten faglig verdi. Derfor overleveres BATON til eier for
ruting før f2.

## De fire andre funnene som må rettes i f2

f2 må også adressere følgende, uavhengig av hvem som utfører den:

1. **Funn 1 (V5-brudd, native falsk suksess).** `src/components/PaywallDialog.tsx:915-934`
   slår sammen «ingen RevenueCat-nøkkel» og web/dev. På native med manglende
   nøkkel kalles `setPremium(true)`, konverterings-/trial-event sendes og
   paywallen lukkes som suksess. Den nye `purchasePlan()`-grenen `not_configured`
   i `src/lib/billing/revenuecat.ts:128-132` nås aldri. Dette er reell
   brukerskade og direkte i strid med V5. Krever regresjonstest som feiler på
   dagens native snarvei.
2. **Funn 2 (C3, prøveperiode).** Ingen versjonert portalobservasjon dokumenterer
   at måneds- og årsplanens prøveperioder faktisk er identisk konfigurert. Kode
   og paywall lover 7 dager på begge, `STATUS.md:66-67,114` beskriver den
   uløste motstriden, og SN-008 eier prøveperiode-harmoniseringen. Alternativer:
   (a) legg ved eierverifisert portalbevis og samkjør, (b) gjør SN-W01 avhengig
   av verifisert SN-008-rettelse og lever f2 etterpå.
3. **Funn 3 (G6, admin-commits).** `081d054`, `48e3e8b` og kontroll-HEAD-en
   `d83836d` bruker `[admin]`-prefiks uten `Review-Request`/`Forsoek`-trailere.
   Selv om `.git/hooks/commit-msg` tillater `[admin]` som unntak, sier Codex
   at DoD/protokollen ikke dokumenterer noe slikt unntak. f2 må levere med
   `SN-W01:`-emne + trailere på hver commit i pakken, inkludert evidens/LEDGER/BATON.
   *Eier bør avgjøre om `[admin]`-unntaket i hooken skal bli en dokumentert
   protokollregel eller fjernes fra hooken — Funn 3 blir gjentatt underkjennelse
   ellers.*
4. **Funn 4 (faktapåstander uten dekning).** f1-requesten sa (a) at fallback
   `299/39` stemmer med `babyora_*` og observasjonen, men produktnavnet er
   `babyora_monthly_49` og primærkilden sier at prisene ikke er verifisert; og
   (b) tilskrev portalobservasjonen eier, mens primærkildens linje 4 sier
   AGENTOBSERVASJON på eiers instruks. f2-requesten må si at 39 kr er en
   uverifisert fallback som SN-W03 eier, og at portallesingen er agentobservert.

Alle fire krever fagvurderinger av kode, tester og portaltilstand i entitlement-/
betalingsdomenet. Modellrutingen (Funn 5) gjelder derfor for hele f2, ikke bare
for Funn 1.

## Hva eier må avgjøre

1. **Modellruting for f2.** Velg én:
   - **A.** Rut SN-W01 f2 til Fable 5 Extra (foretrukket per CLAUDE-START-HERE.md:17).
   - **B.** Rut SN-W01 f2 til Opus 4.8 Extra (godkjent fallback).
   - **C.** Eksplisitt eierstyrt unntak: godkjenn at Opus 4.7 gjennomfører f2,
     med begrunnelse for hvorfor entitlement-rutingen suspenderes i dette tilfellet.
   - **D.** Del oppgaven: la Funn 1 (kodenær entitlement) og Funn 2 (portalavklaring)
     løftes til separate oppgaver med egen ruting, mens Funn 3/4 (dokumentasjon)
     rettes av Opus 4.7 i egen f2-runde med Type E-scope.

2. **G6 admin-unntak (Funn 3).** Velg én:
   - **A.** Dokumenter `[admin]`-unntaket eksplisitt i `loop/DOD-SNUDLY.md` eller
     `loop/LOOP-PROTOKOLL.md`, så hooken og protokollen samsvarer.
   - **B.** Fjern `[admin]`-unntaket fra `.git/hooks/commit-msg`, så alle
     loop-commits må ha `SN-###:`-prefiks + trailere.
   - **C.** Overlate hooken uendret, men si eksplisitt at f2 skal bruke
     `SN-W01:`-prefiks på alle nye commits i pakken (inkludert evidens/LEDGER/BATON).

3. **C3 prøveperiode (Funn 2).** Velg én:
   - **A.** Utfør portalobservasjon (App Store Connect / RevenueCat dashboard)
     og legg ved versjonert bevis; f2 samkjører kode/paywall med observasjonen.
   - **B.** Gjør SN-W01 avhengig av at SN-008 leveres først, med f2 etter
     harmonisering.
   - **C.** Rul tilbake dagens 7-dager-på-begge-planer i kode/paywall til
     dokumentert tilstand (kun årsplan har prøveperiode per STATUS.md:66-67-snapshot)
     inntil eier vedtar annet.

## Hva som er inne på origin allerede

- `a438a54` (V1/V2/V5 kjernebygg, +527/-152 over 8 filer)
- `081d054` (G1-G4-evidens mot a438a54; Funn 3 gjelder denne)
- `2306126` (rødt-lag-fix: JSDoc, dead export, tautologi, dead try/catch)
- `48e3e8b` (G3-G4 re-fanget mot post-fix HEAD; Funn 3 gjelder denne)
- `1269324` (`loop/requests/SN-W01-f1.md`, 405 linjer; Funn 4 gjelder denne)
- `b5c9b79` (BATON: CODEX)
- `d83836d` (LEDGER overleveringslinje; Funn 3 gjelder denne)

`a438a54` og `2306126` inneholder V5-brudd fra Funn 1 (falsk kjøpssuksess
gjennom PaywallDialog-snarveien). De skal ikke revertes automatisk — f2
bør inneholde en ny materialcommit som stenger snarveien og en regresjonstest
som feiler på dagens gren.

## Hva som IKKE er endret av denne eskaleringen

- Ingen produksjonskode berørt av eskaleringen (bare LEDGER, BATON, denne filen).
- Ingen konsollhandling (C4 uendret).
- Signert f1-historikk (commits `a438a54`..`d83836d` og dom
  `loop/verdicts/SN-W01-f1.md`) omskrives ikke.
- `.git/hooks/commit-msg` er ikke rørt — endring der venter på eierbeslutning
  under punkt 2 over.

## Sporing

- LEDGER-linje appendes med samme UTC.
- BATON.md settes til `EIER · SN-W01 · UNDERKJENT · 2026-08-14T16:10:08Z`.
- Denne eskaleringen er skrevet av Opus 4.7 som loop-admin (Type E,
  dokumentasjon om at videre arbeid ikke kan utføres av samme modell).
  Den er ikke f2 og skal ikke telles som ordinært forsøk.
