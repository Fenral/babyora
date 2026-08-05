# 12 — Prototype-spec (Fase 9)

> Utkast 2026-08-05, Claude (CD/TL). **TIL SOLS FØR-IMPLEMENTERINGSREVIEW** (masterprompt:
> Work reviewer spec før bygging når den inneholder vesentlige nye tolkninger — det gjør
> denne: fire prototyper i stedet for én vertikal skive, per eierport 2).

## 1. Hva som bygges

Fire kjørbare, navnløse prototyper (arbeidskoder P1–P4 i test; interne navn brukes aldri
i testmateriell, per Sols runde 7-krav):

| Kode | Retning | Vertikal skive som bygges |
| --- | --- | --- |
| P1 | Protokollen | Onboarding (2 felt + scope-port) → hjem/protokollflate (tilstandslinje + lagstabel) → normalmodus (flow-så-verifiser) → avviksmodus (les-utfør-bekreft m/HB-9-steg) → degradert fallback |
| P2 | Spennet | Onboarding → situasjonsrouter (4 dører) → spennfigur m/kandidatdom → premisshåndtak m/scope-kvittering → degradert. **Spennet er HYPOTESE-MERKET i UI** («veiledende område — ikke fagvalidert») per eierport 2-forbeholdet |
| P3 | Ambient Briefing | Brief-kort (widget-simulert + i-app) → delta-visning m/synlig baseline → utløp/maskering → delbart omsorgskort (statisk web-render) → fallback til full liste |
| P4 | Ambient Protokoll | Brief-handlingen = protokollens første komplette trygge steg → appåpning gir resten av sekvensen + kontrollpunkt + begrunnelse. Ingen router, intet spenn |

**Paywall i prototypene: INGEN** (Sols P0 fase 3 — forurenser testen). Premium-grensen
vises kun som nøytral merking («del av betalt lag») der den er relevant for forståelse.

## 2. Felles fundament (identisk i alle fire — avvik er testforurensning)

1. **Motor:** dagens `wool-layers`-pipeline urørt, med `finalizeSafety` som grense.
   `vognMode` og `context.bilstol` kables (felles sikkerhetsgjeld, aktiveres én gang).
2. **Sikkerhetslag:** identisk i alle fire og alltid synlig — hard/soft blocks i
   farevarsel-anatomi (handling → konsekvens → gyldighet), scope-porter (prematur/feber →
   helsestasjon), degradering som kan ende i «Babyora kan ikke gi råd nå» + konkret neste
   sikre handling.
3. **Scenariodata:** ett delt, deterministisk værsett (fikstur-utvidelse av dagens
   e2e-fikstur) som dekker Sols ti scenarier: normal dag, grensevær, sovende vogn,
   bilstol, manglende værdata, endret vær (delta), utløpt råd, ny omsorgsperson,
   Dynamic Type-tilstand, utendørslys-tilstand.
4. **Tekstgrammatikk:** INV-1 (forhold → konsekvens → plagghandling), norsk klarspråk
   3.–5. trinn, skamfri doktrine, «verifisert»/«2 av 2»-retorikk forbudt.
5. **Ferskhet:** absolutt gyldighet i hvert svar (INV-2); stale = strukturell maskering,
   aldri dimming.
6. **Lik kvalitet:** samme komponentbibliotek-basis, samme illustrasjonsnivå (INGEN nye
   maskot-assets — statisk eksisterende positur kun der retningsspec tillater), samme
   mengde forklaring. Ingen retning får animasjon/gradient/maskot/systemflate som
   differensiator.
7. **Teknisk hjem:** `docs/design-lab/lab/` (Vite-app adskilt fra `src/` — utenfor
   doktrine-skanning = lab-fritaket) med delt `lab/felles/`-lag (motoradapter,
   scenariosett, tekstkomponenter) og én mappe per prototype. Bygges som web-preview
   (samme begrensning som all annen visuell kontroll i dette miljøet); native flater
   (ekte widget/Live Activity) SIMULERES som rammer i P3/P4 og merkes som simulering.

## 3. Måleprotokoll (til review-loopen, fase 10–11)

Primærmål (Sols liste, preferanse er sekundært): korrekt første handling · farlig
utelatelse (nulltoleranse) · tid til beslutning · gjenfortelling av svakeste premiss ·
respons på stoppkriterium · stale-forståelse · opplevd autoritet · uro · return-intent.
**Ikke-kompenserbare porter:** sikkerhet og forståelse — ingen totalscore oppveier én
systematisk farlig feiltolkning. **Nullmodell** (værapp + ni-ords-regel + tekstmelding)
er obligatorisk sammenligningsarm. Claude kjører ekspert-/heuristisk gjennomgang og
skjermbevis i fase 10; test med ekte foreldre er eiervendt og skjer før eierport 3.

## 4. Per-retning P0-forpliktelser (fra runde 7, bindende i bygget)

- **P1:** modusklassifisererens grenser skrives som eksplisitt, testbar regel-tabell
  (hvilke block-/værsignaler gir «følg med» vs. «avvik») FØR UI bygges; kontrollpunkter
  er risikostyrte (normaldag ≠ bekreftelsesritual).
- **P2:** spennet beregnes fra eksisterende bånd + deklarert usikkerhetspåslag og merkes
  hypotese i UI; ANSI-forståelsestesten er porten — én «appen har målt barnet»-lesning
  utløser tekst-først-omdesign.
- **P3/P4:** én autoritativ versjons- og cachekontrakt (briefId, versjon, utløp) på
  tvers av alle simulerte flater; delta viser alltid synlig, versjonert baseline;
  mottakskvittering kalles «åpnet», aldri «forstått».

## 5. DoD for fase 9

Alle fire kjørbare ende-til-ende på delt scenariosett; screenshots + opptak per
scenario; bevisste avvik fra retningsbeskrivelsene loggført; ingen P0-feil i kjerneflyt;
tekniske kompromisser dokumentert. Deretter fase 10: strukturert bevis til Sol.
