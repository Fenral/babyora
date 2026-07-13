# Babyora – planoversikt

Dette er startpunktet for videre arbeid. Alle dokumentene under er ferdige analyse- og implementeringsplaner. Ingen appkode er endret som del av planarbeidet.

## Nåværende beslutninger

- Produktmodell: **Gratis = i dag hjemme. Plus = fremover, overalt og sammen.**
- Ambisjon: 90+ kvalitet på alle sentrale skjermer og brukerreiser.
- Eksisterende designsystem videreutvikles; det skal ikke erstattes av et generisk nytt system.
- Visuell retning: mørk plomme/natt, mint for handling, fersken for varme og temperatur, temperaturreaktive bakgrunner og rolig, presis bevegelse/haptikk.
- Logo: retning A, **Beskyttet kjerne**, er valgt som konsept. Symbolet holdes navnenøytralt til navnet er endelig valgt.
- Navn: **Klarune** er nå anbefalt arbeidsnavn for visuell godkjenning og formell navnekontroll. Det er ikke offentlig låst før varemerke-, uttale-, domene- og brukernavnsjekk er godkjent. `Babyora` og `Uteklar` skal ikke behandles som endelig beslutning.
- Implementering skal verifiseres mot en egen kontrollprotokoll, ikke bare godkjennes av den samme modellen som skrev koden.
- Motor 2.0: utendørs anbefalinger støtter 0–71 måneder. Syntetiske materialer er fullverdige funksjonelle valg. Brukeren velger eventuelt `best for forholdene`, `foretrekk ull` eller `unngå ull`; ingen garderoberegistrering.
- Motor 2.0 bygges parallelt med dagens motor, testes i shadow mode og aktiveres én aldersgruppe om gangen etter faglig scenario-signering.

## Les i denne rekkefølgen

1. `Babyora-klar-for-implementering.md`
2. `Babyora-implementeringsplaner/2026-07-13-babyora-90-plus-master-plan.md`
3. `Babyora-Motor-2.0-planpakke.md`
4. `Babyora-implementeringsplaner/2026-07-13-babyora-engine-2-plan.md`
5. `Babyora-implementeringsplaner/2026-07-13-babyora-ui-90-plus-plan.md`
6. `Babyora-90-plus-designspesifikasjon.md`
7. `Babyora-visuell-signaturspesifikasjon.md`
8. `Babyora-navn-og-logo-beslutning.md`
9. `Babyora-logo-produksjonsspesifikasjon.md`
10. Funksjonsplanene for kalibrering, familie/synk og varsler/widgets
11. `Babyora-Instagram-kostnadsfri-lanseringsplan.md`
12. `Babyora-implementeringsplaner/2026-07-13-babyora-verification-protocol.md`

## Dokumentene

- **Masterplan:** samlet rekkefølge, avhengigheter, kvalitetsmål og gjennomføring.
- **Motor 2.0:** arkitektur, alder 0–71, situasjoner, materialpolicy, 36 gullscenarioer, sikkerhetsporter, adapter, shadow mode og detaljert TDD-plan.
- **UI 90+:** skjerm-for-skjerm-plan for UI, UX, meny, haptikk, bevegelse og visuell kvalitet.
- **Designspesifikasjon:** designregler og målbildet for 90+.
- **Visuell signatur:** særpreg som løfter Babyora fra god til en av de beste appene i kategorien.
- **Navn og logo:** anbefalt arbeidsnavn, valgt logoretning, kontrollpunkter og egen beslutningsport før navnebytte.
- **Logoressurser:** optisk raffinert Beskyttet kjerne i flerfarge, mørk/lys monokrom og appikonformat; wordmark venter på navneport.
- **Personlig kalibrering:** varm/passe/kald-læringssløyfen.
- **Familie og synk:** deling, roller, invitasjoner og datamodell.
- **Varsler og widgets:** gratis morgenpåminnelse, smarte endringsvarsler og widgets.
- **Instagram:** bilde-først, kostnadsfri åtteukers utrulling med maler, poster, planlegging, måling og nedlastings-CTA.
- **Verifikasjonsprotokoll:** tester, visuell kontroll, tilgjengelighet, regresjoner og uavhengig godkjenning.

## Før implementering

1. Åpne originalrepoet med Git, eller gi eksplisitt godkjenning til å initialisere Git i denne kopien.
2. Gjør eksisterende lint-baseline grønn uten funksjonsendringer.
3. Gjennomfør Motor 2.0-planen med alle visningsflagg av.
4. Få scenarioene signert av relevant fagperson før nye aldersgrupper aktiveres.
5. Gjennomfør UI, familie, kalibrering og proaktive flater i masterplanens rekkefølge.
6. Verifiser hver del mot protokollen før neste del starter.

## Viktig status

Planarbeidet som kan gjøres internt før koding er ferdigstilt. Navn/logo, ekstern faglig signering og fysisk enhetskontroll er eksplisitte eksterne porter. Klarune er anbefalt arbeidsnavn, men må godkjennes visuelt og gjennom formell kontroll før offentlig navnebytte.
