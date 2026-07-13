# Babyora — konsolidert revisjonsplan

**Dato:** 13. juli 2026

**Status:** Styrende revisjon av eksisterende planer. Ingen appkode er godkjent for implementering.

**Formål:** Samle den dype reanalysen, de tidligere detaljplanene og de siste eierbeslutningene i én konsistent gjennomføringsrekkefølge.

## 1. Beslutninger som overstyrer eldre planer

1. **Alder:** v1, Motor V2, UI og avatar avgrenses til **0–24 måneder**. Aldersområdet 25–71 måneder er utsatt og skal ikke implementeres, markedsføres eller inngå i v1-testmatrisen.
2. **Navn:** Vaerni er avvist. Babyora er kun internt arbeidsnavn. Offentlig navn og wordmark er en åpen port.
3. **Avatar:** babyen beholdes som identitetsbærer. Én identitet får to låste positurer: sittende 0–11 måneder og stående 12–24 måneder.
4. **Bildeinnhold:** avataren står eller sitter uten vær-, vogn-, søvn- eller aktivitetskontekst. Bare ytterste synlige kroppsplagg og synlig tilbehør vises. Skjulte underlag vises i den kanoniske plagglisten, ikke på figuren.
5. **Produksjonsmodell:** eksisterende Nano Banana Pro soft-3D/clay-uttrykk videreføres som kontrollerte 2D-komposittbilder med sekvensiell edit-chain. Ingen rigget eller runtime-modulær 2,5D i v1.
6. **Assetomfang:** teknisk minimum er 16 bilder. Produksjonsmålet er **24 godkjente komposittbilder**, 12 per positur. Direkte genereringsbudsjett er maksimalt **1 000 kr**.
7. **Designsignatur:** påkledningsbeslutningen er hovedinstrumentet. Prioriteringen er omtrent 60 % påkledning, 25 % atmosfære og 15 % presisjon. Temperaturkontrollen er en særpreget støttekomponent i relevante verktøy, ikke produktets dominerende merkevaremetafor.
8. **Sikkerhet:** legacy-motorens post-safety-mutasjoner må avgrenses før redesign eller Motor V2. Overrides, kalibrering, garderobebytter og UI-swaps skal aldri kunne omgå en endelig sikkerhetskontroll.
9. **Garderobe:** full garderoberegistrering, bildeinnlesing og en 62-plaggs vedlikeholdsoppgave er ikke kjerneprodukt. Små og enkle «har allerede»-markeringer erstatter dette.
10. **Kommersiell modell:** gratis gir et komplett svar i dag hjemme. Plus selger fremtid, steder, familie, proaktive endringer og kontrollert personalisering. Lifetime-produktet skal ikke publiseres.

## 2. Revidert implementeringsrekkefølge

| Pakke | Leveranse | Obligatorisk port før neste pakke |
|---|---|---|
| **R0 Beslutningsfrys** | Styrende dokumenter, navn, alder, avatar og Plus-kontrakt samsvarer | Ingen aktive dokumenter hevder 0–71, Vaerni som finalist eller lagvis avatar |
| **R1 Fersk baseline** | Clean install, commit-SHA, lockhash, test, audit, build, lint og deterministiske skjermbilder | Reproduserbar baseline fra ren checkout |
| **R2 Legacy safety containment** | Én endelig sikkerhetsgrense etter alle mutasjoner og swaps | Guardrail-matrise, regresjonstester og uavhengig sikkerhetsreview |
| **R3 Grønn arbeidsplattform** | Atferdsbevarende lintopprydding, CI og reelt UI-/E2E-oppsett | Test, audit, build og lint grønne på samme SHA |
| **R4 North-Star-designport** | Tre prototyper av Hjem → Antrekk → Plan → Paywall, inkludert feiltilstander og to avatarpositurer | Fem foreldre består forståelse, tid og tillit; én retning godkjennes før produksjonsassets |
| **R5 Kanonisk kontrakt** | RecommendationV2, sikker fingerprint, RecommendationView og AvatarStateKey | Samme semantiske resultat i browser, Node og Edge; ingen skjerm regner selv |
| **R6 Motor V2 0–24** | Materialbevisst motor, adapter, shadow mode, scenario- og fagpakke | Alle 0–24-scenarioer signert; rollback dokumentert |
| **R7 Core UI 90+** | Hjem, Antrekk, Finn antrekk, Plan, onboarding, Guide og sannferdig paywall | Samme anbefaling/fingerprint på alle flater; gratis svar komplett |
| **R8 Avatarproduksjon** | To godkjente masterpositurer og inntil 24 verifiserte komposittbilder | Identitet, anatomi, plagg, materiale, tilbehør, mapping og mobilformat kontrollert |
| **R9 Familie og synk** | Auth, husholdning, RLS, invitasjoner, migrering og entitlement | To-nøkkel sikkerhetsreview og multi-device-bevis |
| **R10 Kalibrering** | Append-only feedback og begrenset −1/0/+1-justering før endelig safety | Én observasjon endrer ingenting; reset/pause/forklaring fungerer |
| **R11 Varsler og widgets** | Meningsfulle endringer, dedupe, privat snapshot og native flater | Payload-, DST-, stale-, deeplink- og fysisk enhetsbevis |
| **R12 Release** | Audit, beta, tilgjengelighet, ytelse, personvern og capability-review | Ingen åpne P0/P1; 90+ støttes av bruker- og enhetsbevis |

## 3. Kanoniske kontrakter

### RecommendationView

Alle flater bruker samme presentasjonsobjekt. Ingen skjerm teller plagg, lager forklaring eller utleder fingerprint på egen hånd.

```ts
export type RecommendationView = {
  recommendation: RecommendationV2;
  garmentCount: number;
  orderedGarments: string[];
  summary: string;
  explanation: string[];
  fingerprint: string;
  avatarStateKey: AvatarStateKey | null;
};
```

### AvatarStateKey

`AvatarStateKey` beskriver bare det som faktisk er synlig: positur, ytterste kroppsplagg, hodeplagg, håndbeskyttelse, hals og relevant fottøy. Skjulte base- og mellomlag inngår ikke i assetnøkkelen, men forblir del av anbefalingens sikkerhets- og forklaringsdata.

Hvis ingen godkjent asset matcher nøkkelen, brukes en eksplisitt nøytral fallback. Det er forbudt å vise nærmeste plausible, men feil antrekk.

## 4. Avatarproduksjon

### Matrise

| Gruppe | Per positur | Totalt |
|---|---:|---:|
| Seks grunnnivåer fra sommer til ekstrem vinter | 6 | 12 |
| To varme/milde hodeplaggvarianter | 2 | 4 |
| Regnskall og vindskall | 2 | 4 |
| To synlige vinter-/vindvarianter | 2 | 4 |
| **Produksjonsmål** | **12** | **24** |

Fottøyreglene under 9 måneder, 9–15 måneder og 16+ måneder håndteres i relevant synlig variant og tekst uten en tredje kroppspositur.

### Arbeidsflyt

1. Frys eksisterende stående master etter identitets- og anatomikontroll.
2. Lag én sittende master gjennom redigering av samme identitet, ikke ny generering fra bunnen.
3. Godkjenn fast kamera, lys, proporsjoner, ansikt, skygge og mobilutsnitt.
4. Produser én positur om gangen gjennom edit-chain.
5. Kontroller hver kandidat mot `AvatarStateKey` og den kanoniske plagglisten.
6. Eksporter 2K master, mobiltilpasset WebP/AVIF og dokumentert fallback.
7. Stopp produksjonen ved 1 000 kr; reduser til 16 sannferdige assets før kvaliteten senkes.

## 5. North-Star-port før kode og assets

Tre prototypevarianter skal vise de samme virkelige tilstandene:

- Hjem med umiddelbart svar og korrekt ytterantrekk;
- Antrekk med endelig avatar øverst og full «innerst først»-liste under;
- Plan med bare meningsfulle endringer;
- paywall som demonstrerer fremtid, sted og familie uten å love utilgjengelige funksjoner;
- loading, cached/offline, manglende sted, ekstrem kulde/varme, største tekst og redusert bevegelse.

Fem representative foreldre testes. Med denne utvalgsstørrelsen går retningen videre bare dersom alle fem kan gjengi antrekket og hovedårsaken, median tid til forstått svar er ≤5 sekunder, og ingen oppfatter avataren som kontekst, lek eller pynt fremfor råd.

## 6. Dokumentansvar

| Dokument | Revidert ansvar |
|---|---|
| 90+ masterplan | Rekkefølge, avhengigheter, pakkeporter og kommersiell release |
| Motor V2-plan/design/validering | Kun 0–24 måneder, legacy containment først, faglig scenarioport |
| UI 90+-plan og current-app-design | Påkledning først, umiddelbart Hjem, meningsfull Plan, sannferdig paywall |
| Visual-signature-design | Beskyttende morgeninstrument, endelig ytterantrekk, to positurer, kontrollert motion |
| Family/sync | Lokal-først, RLS, roller, migrering og husholdningsentitlement |
| Personal calibration | Begrenset termisk offset før endelig sikkerhet; transparent og reverserbar |
| Notifications/widgets | Semantiske endringer fra samme fingerprint; ingen PII eller skjult motor |
| Verification protocol | Uavhengig PASS, fem-foreldre-port og full avatar-assetkontroll |

## 7. Første implementeringspakke som kan godkjennes senere

Kun følgende bør startes først når eier eksplisitt sier «implementer»:

1. R1 fersk baseline.
2. R2 legacy safety containment.
3. R3 grønn arbeidsplattform.

North-Star-prototyping kan planlegges parallelt som en separat, eksplisitt godkjent designoppgave, men produksjonsassets og redesignkode venter på porten.
