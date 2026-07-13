# Babyora Motor 2.0 – designspesifikasjon

**Status:** Godkjent produktretning og kodeklar spesifikasjon. Ingen appkode er endret.

## 1. Beslutning

Babyora v1 skal gi påkledningsråd for `0–24` måneder. Fra og med `25` måneder skal Motor 2.0 v1 avvise anbefaling med en tydelig `unsupported_age`-feil. Utvidelse til eldre barn er utsatt til en separat produkt- og fagfase og skal ikke ligge latent i v1-kontrakter eller markedsføring.

Motoren skal ikke lenger være ullstyrt. Den skal først beregne funksjonelle behov og deretter velge konkrete plagg og materialer. Ull, syntetisk fukttransporterende undertøy, fleece, bomull, skall, syntetisk isolasjon, dun og blandingsmaterialer er legitime alternativer med forskjellige roller.

Produktet skal fortsatt kreve minimal innsats. Brukeren skal ikke registrere garderoben eller velge materiale for hvert plagg.

## 2. Produktløfte

> Ett tydelig antrekk for barnet, basert på vær, alder, aktivitet og materialpreferanser.

Gratis/Plus-modellen endres ikke:

- Gratis: i dag hjemme.
- Plus: fremover, overalt og sammen.

Korrekt råd for dagens situasjon, alle nødvendige aktivitetsvalg og materialalternativer som kreves av allergi/sensitivitet skal aldri låses bak Plus.

## 3. Mål

1. Støtte utendørs anbefalinger for `0–24` måneder.
2. Skille termisk behov fra konkrete plagg og materialer.
3. Gi syntetiske materialer en fullverdig, faglig korrekt rolle.
4. Bevare dagens sikkerhetsregler og testede adferd for `0–24` måneder.
5. Gjøre alders- og materiallogikk deterministisk, forklarbar og testbar.
6. La dagens UI fungere gjennom et kompatibilitetslag mens nye skjermer bygges.
7. Hindre at antall kombinasjoner eksploderer som `temperatur × alder × aktivitet × materiale` i hardkodede tabeller.

## 4. Ikke-mål

- Ingen fotografering eller registrering av garderobe.
- Ingen merkevare- eller produktspesifikke kjøpsanbefalinger.
- Ingen affiliate-lenker eller markedsplass.
- Ingen påstand om eksakt fiberinnhold når appen ikke kjenner plagget.
- Ingen automatisk diagnose av allergi, eksem eller medisinske tilstander.
- Ingen utvidelse av TOG/sovepose til barn over 24 måneder i denne pakken.
- Ingen maskinlæringsmodell eller generativ AI i anbefalingsmotoren.
- Ingen anbefalinger for 25+ måneder i v1.

## 5. Dagens tilstand

Den eksisterende motoren er en ren og deterministisk funksjon med gode sikkerhetsporter, men den har tre strukturelle begrensninger:

1. `baseTable` returnerer konkrete tekststrenger som `tynt ullsett` og `ull-mellomlag` før behovet er modellert.
2. Materialer behandles hovedsakelig som alternative tekststrenger. Fleece og bomull finnes, men er ikke førsteordens motorvalg.
3. Motoren er dokumentert som optimalisert for `0–24` måneder. Den aksepterer opptil 60 måneder, men har nesten ingen aldersspesifikk logikk etter 24 måneder.

Dagens pipeline `base → modifiers → conflicts → soft blocks → safety → calibration` skal ikke rives ut i ett steg. Motor 2.0 bygges parallelt med adapter og sammenligningstester.

## 6. Aldersmodell

```ts
export type AgeStage =
  | 'newborn'          // 0–5 mnd
  | 'mobile_baby'      // 6–11 mnd
  | 'young_toddler';   // 12–24 mnd

export function ageStageFor(ageMonths: number): AgeStage;
```

Grensene er produktgrenser, ikke påstander om individuell utvikling. Motoren bruker observerbar situasjon og intensitet i tillegg til alder.

| Alder | Standard plaggform | Typisk bevegelse | Relevante situasjoner |
|---|---|---|---|
| 0–5 mnd | Body, bukse, heldress | Mest stille | Vogn, bæresele, våken ute |
| 6–11 mnd | Body/sett, heldress | Ruller/krabber | Vogn, bæresele, våken ute |
| 12–24 mnd | Sett eller todelt | Går/veksler | Aktiv lek, vogn, rolig ute og blandet dag |

`canRoll` beholdes for spedbarnssikkerhet. Det påvirker ikke aldersstadiet.

## 7. Situasjonsmodell

```ts
export type Situation =
  | 'stroller_awake'
  | 'carrier'
  | 'awake_low_mobility'
  | 'active_play'
  | 'calm_outdoors'
  | 'mixed_day'
  | 'indoor_sleep';

export type ActivityIntensity = 'resting' | 'mixed' | 'active';

export type SituationProfile = {
  id: Situation;
  intensity: ActivityIntensity;
  validAgeStages: AgeStage[];
  exposureKind: 'outdoor' | 'indoor';
};
```

Tilgjengelighet:

| Situasjon | 0–5 | 6–11 | 12–24 |
|---|:---:|:---:|:---:|
| Vogn | Ja | Ja | Ja |
| Bæresele | Ja | Ja | Etter eksplisitt valg |
| Våken, lite bevegelse | Ja | Ja | Nei |
| Aktiv lek | Nei | Ja | Ja |
| Rolig ute | Nei | Nei | Ja |
| Blandet dag | Nei | Nei | Ja |
| Søvn inne | Ja | Ja | Ja |

UI skal bare vise gyldige valg. Direkte eller migrert input med ugyldig kombinasjon gir `invalid_situation_for_age`; motoren skal ikke gjette.

`indoor_sleep` er gyldig for alle tre v1-stadier, men søvn/TOG presenteres som et separat verktøy med egne sikkerhets- og copyporter.

## 8. Materialmodell

```ts
export type MaterialPreference =
  | 'best_for_conditions'
  | 'prefer_wool'
  | 'avoid_wool';

export type MaterialFamily =
  | 'wool'
  | 'synthetic_wicking'
  | 'fleece'
  | 'cotton'
  | 'shell'
  | 'synthetic_insulation'
  | 'down'
  | 'blend';
```

Brukervendt tekst:

- `best_for_conditions`: **Velg etter forholdene** – anbefalt standard.
- `prefer_wool`: **Foretrekk ull når det passer**.
- `avoid_wool`: **Unngå ull**.

Preferansen er gratis og lagres per barn. `avoid_wool` er en hard begrensning for plagg mot huden og mellomlag. Den kan ikke overstyres av kommersielle hensyn. `prefer_wool` er en myk preferanse; den skal aldri erstatte nødvendig skall eller annen funksjon med ull.

### 8.1 Rollebasert materialpolicy

| Rolle | Standardvalg | Gyldige alternativer | Regler |
|---|---|---|---|
| Innerst, kaldt/fuktig/aktivt | Ull eller fukttransporterende syntet | Begge | Bomull er ikke standard når våthet/svette sannsynligvis blir relevant. |
| Innerst, varmt/tørt/rolig | Lett bomull, ull eller fukttransporterende syntet | Alle | Velg letteste løsning som dekker solen og situasjonen. |
| Mellomlag | Ull eller fleece | Begge | Fleece er fullverdig ved `avoid_wool`, budsjett og høy vaskefrekvens. |
| Vind/regn | Syntetisk skall | Skallvarianter | Materialpreferanse påvirker ikke behovet for skall. |
| Isolasjon, tørt/kaldt | Dun eller syntetisk isolasjon | Begge | Velges etter fukt, volum, aktivitet og produkttype. |
| Isolasjon, vått/skiftende | Syntetisk isolasjon | Dun med tydelig beskyttelse | Motoren prioriterer robust varme ved fukt. |
| Hode/hender/føtter | Ull, fleece, syntet, skall eller blend | Rolleavhengig | Vind- og vannbeskyttelse modelleres separat fra isolasjon. |

Motoren skal aldri presentere syntet som et dårligere valg bare fordi det er syntetisk. Fordeler og ulemper knyttes til funksjon: fukttransport, tørketid, vind, vann, isolasjon, volum, vask og hudkontakt.

## 9. Termisk behov før plagg

```ts
export type WarmthLevel = 0 | 1 | 2 | 3 | 4;

export type ThermalIntent = {
  ageStage: AgeStage;
  situation: Situation;
  intensity: ActivityIntensity;
  tempBand: TempBand;
  baseWarmth: WarmthLevel;
  insulationWarmth: WarmthLevel;
  needsWindShell: boolean;
  needsWaterproofShell: boolean;
  needsSunProtection: boolean;
  needsHeadwear: boolean;
  needsHandwear: boolean;
  needsFootwear: boolean;
  equipment: EquipmentNeed[];
  explanationCodes: ExplanationCode[];
};
```

`ThermalIntent` kan ikke inneholde plaggtekst eller merkenavn. Vær, alder, situasjon, intensitet, eksponering og kalibrering produserer behovet. Materialresolver og plaggresolver kjører etterpå.

## 10. Strukturert plaggkatalog

```ts
export type GarmentRole =
  | 'base_top'
  | 'base_bottom'
  | 'base_fullbody'
  | 'mid_top'
  | 'mid_bottom'
  | 'mid_fullbody'
  | 'shell_top'
  | 'shell_bottom'
  | 'shell_fullbody'
  | 'insulated_fullbody'
  | 'headwear'
  | 'handwear'
  | 'footwear'
  | 'equipment';

export type GarmentVariant = {
  id: string;
  role: GarmentRole;
  material: MaterialFamily;
  warmth: WarmthLevel;
  windproof: boolean;
  waterproof: boolean;
  moistureManagement: 'low' | 'medium' | 'high';
  validAgeStages: AgeStage[];
  legacyNameNb: string;
  illustrationId: string | null;
};
```

Katalogen skal være eksplisitt data, ikke regex-gjetting. Dagens `materialFor()` kan brukes som midlertidig presentasjonsfallback, men kan ikke være kilde til sannhet i Motor 2.0.

## 11. Motorpipeline

```text
validate input
  → derive age stage
  → validate situation for age
  → derive temperature band and exposure context
  → calculate ThermalIntent
  → apply weather/activity modifiers
  → resolve material families from preference and conditions
  → resolve age-appropriate garment variants
  → apply conflicts and safety invariants
  → build explanations
  → build RecommendationV2
  → optional legacy adapter for current UI
```

Sikkerhet kjører etter konkrete plagg er valgt. Kalibrering kan justere `ThermalIntent` maksimalt ett kontrollert varmetrinn før plaggvalg; sikkerhet kan alltid overstyre kalibreringen.

Dette endrer rekkefølgen fra dagens motor, hvor kalibrering skjer etter sikkerhetsstegene. Migreringen er bevisst: kalibrering skal påvirke det termiske behovet, mens sikkerhetsreglene skal vurdere og eventuelt overstyre det ferdige, kalibrerte antrekket. Egen regresjonstest skal bevise at en kalibrering aldri fjerner et sikkerhetspåkrevd plagg eller utstyr.

## 12. Utdata

```ts
export type RecommendationV2 = {
  schemaVersion: 2;
  ageStage: AgeStage;
  situation: Situation;
  tempBand: TempBand;
  intent: ThermalIntent;
  garments: ResolvedGarment[];
  equipment: ResolvedEquipment[];
  explanations: Explanation[];
  safetyFlags: SafetyFlag[];
  severity: Severity;
  fingerprint: string;
};

export type ResolvedGarment = {
  conceptId: string;
  variantId: string;
  role: GarmentRole;
  material: MaterialFamily;
  labelNb: string;
  illustrationId: string | null;
  required: boolean;
};
```

Fingerprint inkluderer bare semantiske motorfelt, aldri navn, fødselsdato, koordinater eller kontoidentitet.

## 13. Kompatibilitetslag

`toLegacyRecommendation(v2)` skal produsere dagens `Recommendation` med kategoriene `innerst`, `mellomlag`, `yttertoy`, `ekstra` og `utstyr`. Den bruker `legacyNameNb` og eksisterende illustrasjons-ID-er.

Krav:

- Dagens Home, Påkledning, Uke, widget og varsler skal kunne fortsette uendret i første implementeringsfase.
- Adapteren skal ha snapshot-tester.
- Ingen ny Motor 2.0-logikk skal implementeres inne i adapteren.
- Adapteren fjernes først når alle forbrukere bruker `RecommendationV2`.

## 14. Lagring og migrering

Barnets profil utvides med:

```ts
materialPreference?: MaterialPreference;
```

Manglende verdi migreres gjennom en eksplisitt `parseStoredChild()`-funksjon til `best_for_conditions`. Den eksisterende lagringsnøkkelen beholdes, og lokal lagring skal ikke nullstilles. Ugyldige eller fremtidige enum-verdier faller tilbake til standard uten å forkaste resten av profilen. Supabase-planens barnemodell får samme felt med standard `best_for_conditions` og en databasebegrensning på de tre gyldige verdiene.

Ingen valgt materialpreferanse sendes til analyseverktøy. Analytics kan registrere at innstillingen ble endret, uten gammel eller ny verdi, og at et anonymt materialalternativ ble åpnet som grov materialfamilie og plaggrolle. Hendelser må ikke knyttes til barn eller inneholde en eksakt alder.

## 15. UX

### 15.1 Onboarding

Materialspørsmålet skal ikke forsinke første anbefaling. Etter første verdi kan appen vise en valgfri profilrad:

> **Materialer**
> Velg etter forholdene

Trykk åpner de tre alternativene med én setning hver. Standard er allerede valgt.

### 15.2 Hjem

Situasjonsvalgene er aldersadaptive:

- 0–11 mnd: `I vogn`, `I bæresele`, `Våken ute`.
- 12–24 mnd: `Aktiv lek`, `I vogn`, `Blandet dag`.

Maks tre valg vises. Gyldige sekundærvalg kan ligge under `Flere situasjoner`.

### 15.3 Antrekk

Plagget vises først som handling, ikke materialforedrag:

> **Tynt mellomlag**
> Fleece

En sekundær handling `Se alternativer` kan vise ullalternativet og hvorfor motoren valgte fleece. Ved `avoid_wool` skal ull ikke presenteres som anbefalt bytte.

### 15.4 Profil

Materialpreferansen ligger per barn under Familie → barnets profil → Materialer. Endringen regenererer anbefalingen og viser hva som faktisk ble annerledes.

## 16. Forklaringer

Forklaringer genereres fra stabile koder, ikke sammensatte fritekstheuristikker:

```ts
export type ExplanationCode =
  | 'ACTIVE_CHILD_LESS_INSULATION'
  | 'RESTING_CHILD_MORE_INSULATION'
  | 'RAIN_REQUIRES_SHELL'
  | 'WIND_REQUIRES_SHELL'
  | 'WOOL_PREFERENCE_APPLIED'
  | 'WOOL_AVOIDED'
  | 'FLEECE_FAST_DRYING'
  | 'WICKING_SYNTHETIC_FOR_ACTIVITY'
  | 'COTTON_ONLY_WARM_DRY'
  | 'AGE_APPROPRIATE_GARMENT_FORM';
```

Eksempel:

> Fleece er valgt fordi barnet skal være aktivt og været er fuktig. Det tørker raskt og fungerer godt under skall.

Ingen forklaring skal bruke absolutte ord som `alltid trygg`, `perfekt` eller `garantert riktig`.

## 17. Feil og fallback

| Feil | Adferd |
|---|---|
| Alder 25+ måneder | Ingen anbefaling; forklar at v1 foreløpig gjelder til og med 24 måneder. |
| Ugyldig situasjon for alder | UI ber om nytt valg; motoren gjetter ikke. |
| Ukjent materialpreferanse | Valideringsfeil i utvikling; trygg fallback til `best_for_conditions` ved migrert lagring. |
| Ingen gyldig ullfri variant | Returner tydelig `unresolved_material_constraint`; aldri skjul ull i labelen. |
| Manglende illustrasjon | Vis nøytralt plaggikon; aldri vis en ullillustrasjon som om den var fleece. |
| Motor 2.0 feature flag av | Bruk dagens motor uendret. |
| Motorene er uenige under shadow mode | Logg anonym scenario-ID lokalt/testmiljø; bruk dagens motor i produksjon. |

## 18. Analysehendelser

Tillatte hendelser:

- `engine_v2_shadow_compared` med `same_fingerprint`, `age_stage`, `situation` og temperaturbånd.
- `material_preference_changed` uten gammel eller ny enum.
- `material_alternative_opened` med materialfamilie og plaggrolle.
- `situation_changed` med situasjon og aldersstadium.
- `engine_v2_fallback_used` med grov årsakskode.

Forbudt innhold: navn, fødselsdato, eksakt alder, koordinater, by, konto-ID, husholdnings-ID, konkrete fritekstnotater eller kombinasjoner som kan identifisere et barn.

## 19. Utrulling

1. `engine_v2_shadow`: Motor 2.0 kjører i test/demo og sammenlignes med dagens motor; dagens svar vises.
2. `engine_v2_infant`: Motor 2.0 vises for 0–11 måneder etter regresjonsport.
3. `engine_v2_young_toddler`: 12–24 måneder aktiveres etter egen faglig scenariogodkjenning.
5. Dagens motor fjernes først når alle porter, forbrukere og rollback-testen består.

Feature flags skal være lokale konstanter i første fase og flyttes til prosjektets valgte feature-flag-løsning senere. Flagg skal ikke brukes til å skjule manglende sikkerhetstester.

## 20. Faglig kontroll

Fagpersonen skal godkjenne prinsipper og scenarioer, ikke kildekode. Kontrollpakken skal inneholde:

- aldersgrenser og relevante situasjoner;
- alle temperaturgrenseoverganger;
- aktiv kontra hvilende anbefaling;
- vått, vind, ekstrem varme og streng kulde;
- materialpolicy for ull, fukttransporterende syntet, fleece, bomull, skall, dun og syntetisk isolasjon;
- bilstol, vogn, sol, spedbarn og søvnrelaterte sikkerhetsporter;
- alle tekster med `HIGH` eller `CRITICAL` alvorlighet;
- minst 30 navngitte gullscenarioer fra valideringsdokumentet.

Faglig status per scenario er `approved`, `approved_with_copy_change` eller `rejected`. Bare `approved` kan aktivere en ny aldersgruppe.

## 21. Akseptansekriterier

- `0–24` måneder er eneste godkjente utendørsområde i v1; 25+ avvises eksplisitt.
- Alle aldersgrenser har tosidige boundary-tester.
- Ugyldige situasjoner avvises deterministisk.
- `avoid_wool` produserer ingen ullvariant.
- `prefer_wool` kan fortsatt produsere skall, fleece eller syntetisk isolasjon når funksjonen krever det.
- Aktiv lek gir aldri mer isolasjon enn rolig/stillesittende situasjon med ellers identiske data, med mindre en eksplisitt sikkerhetsregel forklarer avviket.
- Dagens 0–24-måneders guardrails består.
- Ingen plassholderillustrasjon fremstiller feil materiale som sannhet.
- Ingen anbefaling avhenger av nettverk, klokkeslett eller generativ AI.
- Samme input gir samme fingerprint.
- Alle nye tekster finnes på norsk og har stabile i18n-nøkler.
- Motor 2.0 kan deaktiveres uten datatap.

## 22. Dokumenterte kilder og avgrensning

Kildegrunnlaget inkluderer Helsenorges råd om lag-på-lag, aktivitetsnivå, vind, fukt og kontroll av nakke; American Academy of Pediatrics' råd om flere tynne, tørre lag og bilstol; og produsent-/friluftskilder for funksjonelle materialroller. Disse kildene støtter prinsippene, men kan ikke validere hver temperatur/plagg-kombinasjon. Derfor kreves faglig scenariogjennomgang før nye aldersgrupper aktiveres.

- https://www.helsenorge.no/forstehjelp/sikkerhet-for-sma-barn/
- https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Winter-Safety.aspx
- https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx
- https://shopify-ca-test.reima.com/category/warm-layers

## 23. Avhengigheter

Motor 2.0 skal gjennomføres etter Git/baseline-porten og før UI 90+-planens kanoniske RecommendationView. Familie/synk kan legge materialpreferansen til profilen, men må ikke blokkere lokal Motor 2.0. Personlig kalibrering integreres mot `ThermalIntent`, ikke direkte mot plaggstrenger.

```text
Git + baseline
  → Motor 2.0 kontrakter og adapter
  → Motor 2.0 shadow/regresjon
  → UI 90+ RecommendationView og aldersadaptive situasjoner
  → Familie/synk av materialpreferanse
  → Personlig kalibrering av ThermalIntent
  → Varsler/widgets på V2-fingerprint
```

## 24. Eksterne porter som ikke kan ferdigstilles i kodeplanen

Følgende krever handling utenfor repoet:

1. Navn/varemerke og domene må kontrolleres før offentlig navnebytte.
2. En relevant fagperson må signere scenariomatrisen separat før 0–11- og 12–24-månederskohortene aktiveres.
3. Fysiske iOS-/Android-enheter må brukes for haptikk, widget og tilgjengelighetskontroll.
4. Nye illustrasjoner og avatar-kompositter må visuelt godkjennes mot assetmanifestet før de erstatter nøytrale fallback-ikoner.
