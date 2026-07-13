# Babyora – klar for implementering

**Status 13. juli 2026:** Alt planarbeid som kan avgjøres internt før koding er ferdigstilt. Ingen appkode er endret i denne fasen.

## Låste produktbeslutninger

- Gratis: i dag hjemme.
- Plus: fremover, overalt og sammen.
- Dagens korrekte anbefaling, nødvendige situasjoner, sikkerhetsinnhold og materialhensyn er gratis.
- Appen bruker eksisterende Babyora-designsystem og løfter det; ingen generisk redesign.
- Brukerbegrepet er `plagg`; rekkefølgen viser lag-på-lag intuitivt.
- Full garderoberegistrering og bilder av egne klær er ute av hovedretningen.
- Motor 2.0 dekker utendørs påkledning 0–71 måneder.
- Syntetiske materialer er fullverdige, funksjonelle valg.
- Materialpreferanse er enkel, gratis og per barn.
- Personlig kalibrering er deterministisk, begrenset til `-1|0|1`, forklarlig og reverserbar.
- Familiedeling bruker roller og én betalende familieprofil.
- Varsler utløses av endret antrekk, ikke små værendringer alene.
- Navn/logo er en egen ekstern beslutningsport; Klarune og logoretning A er arbeidsretning, ikke offentlig låsing.

## Planlagt gjennomføringsrekkefølge

1. Git og grønn baseline.
2. Motor 2.0 kontrakter, adapter og shadow mode.
3. Motor 2.0 faglig scenario-godkjenning og én aldersgruppe om gangen.
4. Kanonisk anbefalingsvisning og UI 90+.
5. Familie, konto, synk og tilgang.
6. Personlig kalibrering mot termisk behov.
7. Smarte varsler og widgets basert på stabil V2-fingerprint.
8. Kommersiell og uavhengig sluttverifikasjon.

## Dokumentdekning

Planpakken dekker motor, arkitektur, datamodell, alder, situasjoner, materialer, UX/UI, fargepalett, haptikk, meny, hver side, gratis/Plus, paywall/pris, familie, synk, personvern, analysehendelser, kalibrering, varsler, widgets, navn/logo, en kostnadsfri åtteukers Instagram-utrulling, tester, uavhengig kontroll og rollback.

## Faktiske gjenværende porter

Dette er ikke uferdig planlegging, men beslutninger/bevis som må komme utenfra:

- Git-mappe eller eksplisitt tillatelse til å initialisere Git.
- Faglig signatur på anbefalingsscenarioene.
- Varemerke-, domene-, uttale- og brukernavnssjekk.
- Fysiske enhetstester.
- App Store/Google Play/RevenueCat/Supabase-konfigurasjon når implementeringen når disse fasene.
- Visuell godkjenning av endelig navn, logo og nye illustrasjoner.

## Første oppgave til kodeagenten

Kodeagenten skal starte med Task 0 i Motor 2.0-planen. Den skal ikke begynne å endre anbefalingsmotor eller UI før Git er bekreftet og eksisterende lint-baseline er gjort grønn uten funksjonsendringer.
