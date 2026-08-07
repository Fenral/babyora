# EIERPORT 1 — beslutningsgrunnlag

**Eierstatus 2026-08-07:** GODKJENT.

Eier godkjente K3 + kontraktreparert K0 som finalister, reelt valgfritt navn og håndhevet 0–24 måneder. Foto og Higgsfield holdes ute av neste fase uten nye brukerbevis.

## Siden som vises når appen åpnes

Repoet har tre ulike åpningssituasjoner som ikke skal blandes:

1. **System/launch:** dagens espresso-/kremflate med venstrejustert Babyora-ordmerke beholdes. Den har ingen CTA, maskot, foto eller video og slipper når første ekte React-frame er malt. Den skal ikke bli en intro- eller reklameside.
2. **Ny bruker:** første interaktive side er finalisten K0 eller K3. K3 viser den native minidemonstrasjonen direkte på «Hvem kler vi på?»; det legges ikke inn et ekstra velkomststeg.
3. **Returnerende bruker:** går direkte til Hjem. Onboarding eller K3-demo skal ikke vises igjen.

Dermed er testforløpet: `launch → K0/K3 for ny bruker`, mens normal bruk er `launch → Hjem`.

## Repoet viser

1. Aktiv onboarding er maskot + fire inputsteg + velkomst; ingen foto/video er i produksjonsflyten. Video og eldre illustrasjoner er arkivert.
2. Navn beskrives som valgfritt, men manglende navn blokkerer fullføring. DOB tillater omtrent 60 måneder mot bindende 0–24.
3. «Dagens råd er klart» vises før ny Hjem-CTA og 3,2 s beregning. Baseline fra første handling til stabilt råd var 6,0–6,4 s i web-preview.
4. Tilbake/rediger bryter 44 pt i aktiv onboarding. Delvis oppsett overlever vanlig background-resume, ikke prosessdød før profilskriving.
5. Analytics-typen finnes, men ingen produksjonskall ble funnet; repoet gir derfor ikke feltbaseline for onboarding-effekt.

## Research viser

- 16 Mobbin-referanser ble visuelt inspisert, seks i dybden. De beste mediene viste et ekte produkt, en handling eller årsak–virkning; media uten nødvendig jobb ble pynt, venteteater eller emosjonelt press.
- Minst fire sterke no-photo-mønstre viser at native UI kan bære personalisering og tillit.
- Apple prioriterer rask, valgfri og interaktiv onboarding, umiddelbar launch, kontekstuell tillatelse og full Reduce Motion/VoiceOver-vei.
- Ingen av kildene beviser effekt for Babyora. Brukertest er fortsatt nødvendig.

## Antakelser som falt

1. Fotorealisme er ikke det samme som autentisitet eller tillit; den kan øke ekthets- og sikkerhetsrisiko.
2. Video er ikke en vedtatt Babyora-identitet; aktiv kode tester eksplisitt at videomaskineri er borte.
3. Lasting gjør ikke automatisk rådet grundigere; K0 har allerede mer enn nok synlig venting.
4. Foto er ikke nødvendig for varme; dagens 9,4 kB maskot gir varme, mens K3 kan forklare produktet uten media.
5. Dagens kontroll er ikke en ren gullstandard: tre dokumenterte kontraktfeil må skilles fra medieeksperimentet.

## K0–K3 i én linje

| Kandidat | Styrke | Største risiko | Foreløpig dom |
|---|---|---|---|
| K0 · kontroll | Etablert Babyora-varme, lav drift | Dead-end, feil scope, verdi sent | Finalist etter kontraktreparasjon |
| K1 · autentisk foto | Høyest potensiell situasjonsgjenkjennelse | Generisk/ekskluderende og mulig antrekksfeiltolkning | Stopp |
| K2 · motion | Kan forklare input → lag | Samme forklaring finnes billigere statisk; ekte asset ukjent | Stopp før generering |
| K3 · native no-photo | Tydelig faktisk produkt på første skjerm | Kan føles mindre emosjonell | Ledende finalist |

## Testet og ukjent

**Testet i web-mock:** lys/mørk, stor tekst-proxy, ARIA/VoiceOver-struktur, Reduce Motion, offline, treg asset, error, warm resume, 44 pt, 390×844, seks handlinger og identisk beregningsventing. Konsollfeil: 0.

**Ikke testet:** foreldre, fysisk iPhone, ekte VoiceOver, prosessdød i native app, reell Higgsfield-asset, produksjonsfoto, konvertering eller betalingsvilje. Ingen av disse er påstått gjennomført.

## Rangerte retninger

K3 86/100 (±8), K0 68 (±9), K2 63 (±12), K1 61 (±11). Dette er ekspertproxy; brukerdata kan flytte rekkefølgen. K0 kan fortsatt vinne dersom maskotens varme oppveier sen produktforklaring når kontrollfeilene er reparert.

## Eierens beslutninger — avgjort 2026-08-07

1. **K3 + reparert K0 som finalister:** GODKJENT.
2. **Reelt valgfritt navn og 0–24 måneder i begge testfinalister:** GODKJENT.
3. **Foto og Higgsfield ut uten nye brukerbevis:** GODKJENT.

EIERPORT 1 er lukket. Videre arbeid kan avgrenses til K0/K3 uten produksjonsmedia.
