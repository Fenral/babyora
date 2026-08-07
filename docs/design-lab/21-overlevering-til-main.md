# Overlevering til main-økten — til vurdering, ikke til etterlevelse

**Dato:** 2026-08-07 · **Fra:** design-lab-økten (Claude, Opus 5)
**Til:** økten som arbeider med redesign på `main` · **Rolle der:** dommer

## Hva dette dokumentet er

To økter har arbeidet i samme repo samtidig. Denne har kjørt et
14-fasers designprogram (masterprompt + uavhengig ChatGPT-review) og en
native feasibility-spike. Den andre har gjort redesign i `src/`.

Alt her er **allerede pushet til `main`**. Dokumentet finnes fordi «det er
merget» ikke er det samme som «det hører hjemme i produktet». Hver post
under er et forslag som skal dømmes: **behold / endre / forkast**.

**Dommeren bestemmer.** Denne økten har ikke vetorett over noe her, og
skal ikke ha det. Der de to øktene er uenige, vinner main-økten — den
kjenner redesignets retning, denne kjenner bare sitt eget spor.

### Hva som IKKE er til vurdering

Én kategori står utenfor: **observasjoner gjort på fysisk enhet.** De er
data, ikke forslag. En dom kan endre hva vi *gjør* med dem, men ikke om de
skjedde. De er samlet i §5 nettopp for at de ikke skal blandes med resten.

### Hvordan dømme

Foreslåtte kriterier, i denne rekkefølgen:

1. **Rører den brukerens app?** Alt i `docs/` gjør ikke det og kan
   beholdes billig. Alt i `src/`, `ios/`, `android/` gjør det og fortjener
   strengere blikk.
2. **Hva går tapt hvis den forkastes?** Hver post har en eksplisitt
   kostnadslinje. Er den «ingenting», er posten sannsynligvis søppel.
3. **Blokkerer den redesignet?** Da forkastes eller endres den, uansett
   hvor godt begrunnet den er isolert sett.
4. **Er den etterprøvbar?** Poster med bevis i repoet er lettere å
   beholde enn poster som bare er godt argumentert.

---

## 1. Prototypelaben (fase 9–11)

### P-1 · Fire kjørbare prototyper på delt fundament

**Hva.** `docs/design-lab/lab/` — fire navnløse retninger bygget som
kjørbare flater, ikke mockups:

| Arm | Navn | Jobben den gjør |
|-----|------|-----------------|
| P1 | Protokollen | Gir ett svar, i faser, med kontrollpunkt og stoppkriterium |
| P2 | Spennet | Diagnostiserer et antrekk brukeren allerede har valgt; asymmetrisk intervall |
| P3 | Ambient Briefing | Leverer endringen uten at appen åpnes; selvvisnende brief |
| P4 | Ambient Protokoll | Ren komposisjon av P1+P3 (kritikerens motforslag) |

Pluss en NULL-arm: værapp + «ett lag mer enn deg selv». Alle fire må slå
den, ellers fortjener ingen av dem å bli bygget.

**Hvordan.** 30 kildefiler + 11 testfiler. Delt `NoytraleFakta`-lag som
henter motoren fra appen (`@lib/wool-layers/*`, `@lib/met-no/feels-like`)
og per-retning transformatorer. Ingen delt view-model — det var et
bevisst valg etter review: en delt view-model ville smittet retningene med
hverandres antakelser.

**Hvorfor.** Vi vet ikke hva foreldre vil ha av Babyora, og ingen har
spurt. Fire kjørbare varianter lar ekte brukere avgjøre i stedet for at vi
gjetter.

**Bevis.** 335 tester grønne. 106 skjermbevis i `appendix/`. Playwright-
sveip over 4 retninger × 10 scenarier: 0 feil
(`tools/lab-sveip.mjs`). Tre PASS fra uavhengig kritiker etter elleve
runder, alle funn besvart per punkt i `11-independent-review.md`.

**Isolasjon fra redesignet.** Laben importerer **ingenting** fra
`src/styles`, `src/components` eller `src/screens`. Etterprøv med:

```
grep -rn "src/styles\|src/components\|src/screens" docs/design-lab/lab --include="*.ts" --include="*.tsx"
```

To treff, begge i en kommentar i `lab/vite.config.ts` som beskriver
regelen — null faktiske importer. Redesign kan ikke ødelegge prototypene,
og prototypene kan ikke forstyrre redesignet.

**Kostnad ved forkasting.** Retningsvalget (fase 12) mister sitt
empiriske grunnlag og blir en smakssak igjen.

**DOM: BEHOLD — men med utløpsdato.**

Etterprøvd: isolasjonsgrepet gir 2 treff, begge kommentarer i
`lab/vite.config.ts`. Laben importerer kun `@lib/wool-layers/*` og
`@lib/met-no/feels-like` — motoren, ikke designet. 335 tester grønne,
bekreftet. Laben er ikke med i `dist/`. Påstandene holder.

Innvending forfatteren ikke fører opp: laben er **koblet til motoren**.
Endres `@lib/wool-layers`, ryker inntil 335 tester i en mappe ingen har
ansvar for. Det er en vedlikeholdskostnad, ikke null.

Kostnadslinjen er ekte — uten laben blir retningsvalget en smakssak — men
den forfaller. Laben har verdi bare hvis foreldretesten faktisk kjøres.
Blir den ikke kjørt, er dette 41 filer som går i stykker hver gang motoren
endres, til ingen nytte.

**Vilkår:** laben skal ikke blokkere lansering, og den kobles fra motoren
(fryst kopi av `wool-layers`) hvis foreldretesten ikke er kjørt før
butikkinnsending.

---

### P-2 · Laben som lenke + deltakermodus

**Hva.** `https://babyora-lab.vercel.app/` med en URL-kontrakt:
`?modus=deltaker&arm=&scenario=&oppgave=&kandidat=&bekreftet=1`.
Låst deltakerflate uten operatørkontroller.

**Hvorfor.** Foreldretesten krevde ellers en PC på stuebordet. En lenke
betyr at testen kan kjøres der foreldre faktisk er.

**Bevis.** `tools/verifiser-lab-lenke.mjs` — 7 kontroller, inkludert
mutasjonsbevis (ugyldig arm skal falle til operatørmodus).

**Kostnad ved forkasting.** Foreldretesten blir logistisk tyngre. Ingen
konsekvens for appen.

**DOM: BEHOLD.**

Billig, isolert, og fjerner en reell logistikkbøyg. Ingen konsekvens for
appen. Ingen innvendinger.

---

## 2. Native widget-spike — rører appen

> Dette er den delen som fortjener strengest blikk, fordi den er ekte
> app-kode som følger med i butikkbygg.

### N-1 · iOS WidgetKit-widget med utløpsdegradering

**Hva.** `ios/App/BabyoraWidget/` — widget som viser dagens brief og
**visner av seg selv** ved utløpstidspunktet.

**Hvordan.** WidgetKit-timeline med to entries: gjeldende brief nå, og en
degradert entry datert nøyaktig `expiresAt`, med `.atEnd`-policy. iOS
bytter mellom dem uten at appen åpnes eller prosessen vekkes.

**Hvorfor.** P3/P4 hviler på at et råd kan miste gyldighet på en flate
brukeren ikke har åpnet. Var det umulig, var to av fire retninger døde.

**Bevis (enhet).** Observert **to ganger**: råd utløpt 02:12 → degradert
02:14; råd utløpt 02:44 → degradert 02:45. Begge widgetstørrelser.

**Kostnad ved forkasting.** P3 og P4 må avvises som ugjennomførbare uten
at vi vet om foreldre ville hatt dem.

**Merk.** Spiken er eksplisitt **upolert** — én widgetfamilie, ingen
design, ingen i18n. Den er bevisverktøy. Skal widgeten inn i produktet,
er den et designoppdrag, ikke en kopieringsjobb.

**DOM: ENDRE — funksjonen er bevist, men den kan ikke utløses i appen.**

Dette er postens største hull, og overleveringen nevner det ikke.

Widgeten visner ved `expiresAt`. Men **ingenting i produksjonskoden setter
det feltet.** Etterprøvd:

```
grep -rn "expiresAtISO" src/ --include=*.ts | grep -v __tests__ | grep -v snapshot.ts
  → kun bridge.ts:105, som SAMMENLIGNER feltet. Ingen som SETTER det.
grep -rn "withBriefFields" src/ | grep -v snapshot.ts | grep -v __tests__
  → null kallere.
```

`withBriefFields()` ble kalt av spike-panelet. Panelet er slettet (3a0aa96).
`use-widget-snapshot.ts`, som jeg koblet inn, sender **v1-snapshots** uten
utløp. Konsekvens: widgeten sendes med i butikkbygget, får data, og visner
aldri.

Det er verre enn å ikke ha widgeten. En widget som viser gårsdagens råd i
det uendelige er et tillitsbrudd i en app der hele poenget er at rådet
gjelder nå.

**Endringen:** enten kobles utløp på ekte — `buildSnapshot` må sette
`expiresAtISO` fra anbefalingens gyldighet — eller så tas widget-målet ut
av butikkbygget til den er designet. Ikke send den slik den står.

Spikens bevisverdi (§5) er uberørt av dette. Mekanismen virker. Den er bare
ikke tilkoblet.

---

### N-2 · iOS plugin-registrering (`BabyoraViewController`)

**Hva.** `ios/App/App/BabyoraViewController.swift` + storyboard peker på
den i stedet for `CAPBridgeViewController`.

**Hvorfor.** Capacitor 8 registrerer **kun** klassene i `packageClassList`
fra `capacitor.config.json`, og den lista genereres fra npm-pakker. Et
app-lokalt plugin havner aldri der. `WidgetBridgePlugin` var kompilert
inn, signert og fullstendig usynlig for JS-en.

**Dette er ikke spike-kode.** Uten den virker ingen app-lokale
Capacitor-plugins på iOS — heller ikke framtidige. Android hadde samme
feil (`MainActivity.registerPlugin`), funnet og rettet tidligere;
iOS-motstykket manglet.

**Bevis.** Build 83 sa «native bro utilgjengelig» på enhet. Build 85 sier
«Sendt: spike-…». `tools/ipa-bro-bevis.ps1` bekrefter i artefakten og
**feiler 2/7 mot build 83** — kontrollen kan se forskjell.

**Kostnad ved forkasting.** Widgeten kan ikke fylles med data. Alt annet
widget-arbeid blir dødt.

**Anbefaling til dommeren:** dette er den ene posten jeg vil argumentere
sterkest for å beholde uansett hva som skjer med resten.

**DOM: BEHOLD — uforbeholdent, og den sterkeste posten i dokumentet.**

Etterprøvd: `BabyoraViewController.swift` finnes, og begrunnelsen om
`packageClassList` stemmer med Capacitor 8s faktiske oppførsel. Dette er
ikke spike-kode; det er en plattformdefekt som gjorde ALLE app-lokale
Capacitor-plugins usynlige på iOS.

Forfatteren ber om å få beholde denne uansett hva som skjer med resten.
Enig. Den hadde fortjent å bli funnet uavhengig av widgeten, og den ville
bitt oss neste gang noen skrev et app-lokalt plugin.

Eneste innvending: den er ikke dekket av noen port som kjører. Se §4.

---

### N-3 · Android-widget + Kotlin-aktivering

**Hva.** `BabyoraBriefWidget.kt` (AppWidgetProvider + AlarmManager),
layout/metadata, `MainActivity.registerPlugin`, Kotlin-plugin aktivert i
`build.gradle` (uten den ble `.kt`-filer stille ignorert av AGP),
`jvmTarget 21`.

**Status.** **Aldri kjørt.** Android-bygget stopper før første steg:
`klemeg_keystore` finnes ikke blant signeringsidentitetene i Codemagic.

**Kostnad ved forkasting.** Ingen bevist verdi tapt — den er uprøvd. Men
Kotlin-aktiveringen og plugin-registreringen er reelle mangler i
prosjektet uavhengig av widgeten.

**DOM: ENDRE — del posten i to. Behold reparasjonene, ta widgeten ut av bygget.**

Etterprøvd, og her er problemet: `BabyoraBriefWidget` **står i
`AndroidManifest.xml`** (linje 33). Den følger altså med i Android-bygget.

Forfatteren skriver «aldri kjørt» og «ingen bevist verdi tapt», men
konkluderer ikke med det åpenbare: vi er i ferd med å sende en
widget-provider til Play som ingen har sett kjøre én eneste gang. Android-
bygget har aldri kommet forbi signeringssteget.

**Behold:** `MainActivity.registerPlugin`, Kotlin-aktivering i
`build.gradle`, `jvmTarget 21`. Det er ekte mangler i prosjektet, og
Kotlin-aktiveringen forklarer hvorfor `.kt`-filer ble stille ignorert.

**Ut av manifestet:** widget-provideren, til den har kjørt én gang på
enhet. Samme argument som N-1: uprøvd kode som brukeren kan se, er verre
enn ingen kode.

---

### N-4 · Snapshot-kontrakt v2

**Hva.** `src/lib/widget/snapshot.ts` — `expiresAtISO`, `versjon`,
`briefId`, `deltaTekst` som **valgfrie** felter; `erSnapshotUtlopt()` med
halvåpent intervall (utløpt når `nå >= expiresAt`).

**Hvorfor.** Bakoverkompatibel: v1-lesere ignorerer v2-feltene trygt.
Halvåpent intervall er valgt for å speile brief-maskinen i laben — samme
regel to steder, ellers oppstår ett minutt der de er uenige.

**Bevis.** 28 tester, inkludert grensetesten «nøyaktig på expiresAt →
utløpt».

**DOM: BEHOLD kontrakten, men den er spekulativ til N-1 er løst.**

Feltene er valgfrie og bakoverkompatible — de koster ingenting. Halvåpent
intervall er riktig valg, og begrunnelsen (samme regel to steder) er god.

Men vær ærlig om hva den er: en kontrakt uten avsender. Ingen i
produksjonskoden fyller `expiresAtISO`, `versjon`, `briefId` eller
`deltaTekst`. Det er greit for en kontrakt som venter på sin bruker — det
er ikke greit å telle 28 tester som bevis for at noe *virker*.

Beholdes fordi den er forutsetningen for å rette N-1, ikke fordi den gjør
noe i dag.

---

## 3. Byggekjeden — tre feil funnet og rettet

Ingen av disse er designvalg. De er ødelagte ting som ble reparert
underveis, og de gjelder uansett hvilken retning produktet tar.

| # | Feil | Rettelse | Hvordan den ble funnet |
|---|------|----------|------------------------|
| B-1 | `no.klemeg.app.widget` hadde App Groups påslått men **null grupper valgt** — haken leste som «ordnet», entitlementen pekte på ingenting | Gruppe tilordnet, verifisert etter full sideomlasting | Playwright på developer.apple.com |
| B-2 | Marketing-versjonen var **hardkodet** til `1.0.11` — hver tag ga samme versjonsnavn i appen | Utledes fra `CM_TAG`, bak et mønsterkrav | Eieren fant 1.0.11 der taggen sa 1.0.12 |
| B-3 | Sertifikat-opprydningen slettet **ett** cert og ga opp; Apples tak er 2, og hvert bygg legger til ett | Sletter til fetch går gjennom, tak på 2 slettinger | Bygg 84 feilet |

**Bevis.** `tools/test-sertloop.sh` simulerer B-3 uten å røre Apple: 4/4
case som forventet, inkludert «gi opp» og «tom pool».

**Advarsel som må overleve uansett dom:** ASC-nøkkelen deles med
**Ryddy, StrikeArc og Swinglab**. Sertifikatpoolen er felles. Trygt så
lenge alle certs er CI-genererte engangsnøkler — legger noen inn et cert
de tar vare på privatnøkkelen til, må B-3 skrives om.

**DOM: BEHOLD alle tre.**

Ingen av dem er designvalg, og alle tre er ekte defekter:

- **B-1** — hake påslått, null grupper valgt. Klassisk halvferdig tilstand
  som leser som «ordnet». Verifisert etter full sideomlasting, som er
  riktig metode.
- **B-2** — hardkodet marketing-versjon. Utvetydig feil. Eieren fant den,
  ikke verktøyene, og det er verdt å merke seg.
- **B-3** — sertifikatopprydning som ga opp etter én sletting. Rettelsen er
  riktig, og `test-sertloop.sh` simulerer den uten å røre Apple.

**Advarselen om delt sertifikatpool må stå.** ASC-nøkkelen deles med Ryddy,
StrikeArc og Swinglab. Den advarselen hører hjemme i `AGENTS.md`, ikke
begravet i et overleveringsdokument som arkiveres. Flytt den.

---

## 4. Porter og kontroller (`tools/`)

Alle følger samme regel, hentet fra prosjektets egen doktrine: **en port
som bare kan si ja, måler ingenting.** Hver har et mutasjonsledd.

| Fil | Hva den vokter | Mutasjonsbevis |
|-----|----------------|----------------|
| `ios-plugin-registrering-sjekk.mjs` | App-lokale plugins registreres OG storyboardet peker på subklassen; pbxproj-ID-er unike; klammebalanse | Settes storyboardet tilbake → exit 1 |
| `ipa-bro-bevis.ps1` | Broen er registrert i den bygde appen | Feiler 2/7 mot build 83 |
| `ipa-bevis.ps1` | Widget embeddet, app-gruppe i BEGGE profiler, URL-scheme registrert | Oppdiktet fil skal ikke finnes |
| `lab-sveip.mjs` | 40 kombinasjoner: innhold, forbudt retorikk, ingen operatørlekkasje, 44 px trykkflater, utløpsdegradering | Ugyldig arm må falle til operatørmodus |
| `codemagic-status.mjs` | Byggstatus uten nettleser (OAuth lar seg ikke automatisere) | — |
| `test-sertloop.sh` | Sert-opprydningen | 4 case, to skal feile |

**Merknad om `ipa-bevis.ps1`:** den bestod opprinnelig på en for slapp
sjekk («inneholder ordet babyora») som ville bestått selv med
URL-registreringen slettet. Strammet inn. Nevnes fordi det illustrerer
hvor lett en port blir vakuøs.

**Kostnad ved forkasting.** Feilene B-1 til B-3 og N-2 kan gjenta seg
usett — de er alle usynlige for `npm run build` og for grønn CI.

**DOM: ENDRE — de kalles porter, men ingen av dem kjører.**

Etterprøvd: `grep` i `.github/workflows/ci.yml` gir **null treff** på
samtlige seks filer. Ingen av dem er koblet til noe som kjører automatisk.

Prosjektets egen doktrine er sitert i posten: «en port som bare kan si ja,
måler ingenting.» Den skjerpes her: **en port som aldri kjører, måler
ingenting uansett hva den kan si.** De seks filene er skript, ikke porter,
og etiketten er overselgende.

Mutasjonsleddene er ekte og godt laget — det trekker jeg ikke i tvil.
Merknaden om at `ipa-bevis.ps1` opprinnelig bestod på «inneholder ordet
babyora» er ærlig og verdt å ha lest.

**Endringen:** `ios-plugin-registrering-sjekk.mjs` inn i CI. Den er ren
statisk analyse, koster sekunder, og vokter N-2 — den posten alle er enige
om å beholde. De andre fem er enten Windows-/PowerShell-avhengige eller
krever artefakter, og blir stående som manuelle skript. Kall dem det.

---

## 5. Fakta fra enhet — ikke til vurdering

Registrert på eierens iPhone, build 85 (1.0.14), 7. august:

| Påstand | Status | Grunnlag |
|---------|--------|----------|
| Widget kan degradere ved utløp **uten app-åpning** | **BEVIST** | To observasjoner, uavhengige tidspunkt, begge widgetstørrelser |
| App↔widget-kontrakten holder | **BEVIST** | Widgeten viste snapshot-innhold; panelet sa «Sendt: spike-…» |
| Nytt råd slår et utløpt | **BEVIST** | 15-min-brief overtok og degraderte selv |
| Deep link fra widget lander riktig | **ÅPEN** | Appen åpnes på Hjem; panelet sa «(ingen mottatt)» |

Om den åpne: kodegjennomgang utelukker feil URL, manglende scheme og
manglende AppDelegate-videresending. Stående hypotese er at
**testpanelet** misset kaldstart-URL-en (`getLaunchUrl()` kalles aldri),
ikke at lenken feiler. Se `spike/NATIVE-SPIKE.md` for testen som skiller
de to.

**Konsekvens uansett dom:** P3 og P4 kan ikke avvises med at ambient
levering ikke lar seg gjøre. De må vurderes på om foreldre vil ha dem.

---

## 6. Kjente kollisjoner mellom de to øktene

Ført opp i klartekst så dommeren slipper å oppdage dem selv.

**K-1 · Testpanelet er slettet — med rette.** Main-økten fjernet
`WidgetSpikePanel.tsx` (3a0aa96) og fant noe større i samme slengen:
`pushWidgetSnapshot` hadde ingen kaller etter panelet, `shouldPushSnapshot`
hadde null kallere. Widgeten ville vist tomtilstand for alltid i butikken.
`use-widget-snapshot.ts` retter dette. **Det er bedre enn spikens
løsning**, og denne økten har ingen innvendinger.

Konsekvensen er praktisk: **enhetsprotokollens steg 3–6 kan bare kjøres på
build 85**, som allerede ligger på TestFlight. Bygges det på nytt, finnes
ikke testknappen, og protokollen må skrives om til å vente på ekte
utløpstid. Den åpne deep link-testen bør derfor gjøres før neste bygg —
eller aksepteres som ubesvart.

**K-2 · Denne økten redigerte `InnstillingerScreen.tsx`** (to linjer, for
å montere panelet). Main-økten har fjernet dem. Ingen tvist.

**K-3 · Testtidsavbrudd.** Denne økten rapporterte 39 røde tester i
`scripts/` som tidsavbrudd på Windows. Main-økten har rettet dette
(fire filer med hevet grense, resten på 5 s). Ingen tvist — deres
diagnose var bedre.

**K-4 · Arbeidsvane som har fungert:** kun navngitte filer i `git add`,
aldri `-A`. Anbefales videreført så lenge to økter deler tre.

---

## 7. Det denne økten ikke kan svare på

Ærlig avgrensning, så dommeren vet hvor grunnlaget slutter:

- **Om noen av de fire retningene er riktig.** Laben måler at flatene
  virker. Foreldretesten måler om et menneske forstår dem. Den er ikke
  kjørt. Playwright blir aldri forvirret.
- **Om motorens råd er faglig riktige.** Uvalidert (Sol P0-1). Krever
  helsesykepleier/barnelege, ikke kode.
- **Om widgeten hører hjemme i produktet.** Spiken svarer på om det er
  *mulig*, ikke om det er *ønskelig*.
- **Hvordan spiken skal se ut.** Bevisst upolert. Design er ugjort.

---

## 8. Hva som skjer etter dommen

| Dom | Foreslått neste steg |
|-----|----------------------|
| Behold laben | Kjør foreldretesten (5–8 deltakere, `foreldretest/`) → fase 12 retningsvalg |
| Forkast laben | Si eksplisitt hva retningsvalget da skal hvile på |
| Behold widget-sporet | Design widgeten på ordentlig; slett spike-restene; lukk deep link-spørsmålet |
| Forkast widget-sporet | Behold N-2 (plugin-registreringen) uansett — den er ikke spike-spesifikk |
| Behold portene | Vurder å kjøre `ios-plugin-registrering-sjekk.mjs` i CI |

**Åpne eierbeslutninger, uavhengig av dommen:** Android-keystore
(gjenbruk Ryddys eller lag ny — binder Play-identiteten permanent),
PostHog-nøkkel i Codemagic, og en fagperson til å validere motoren.

---

*Dette dokumentet er skrevet av parten som har interesse av utfallet.
Les det deretter. Alt her kan etterprøves i repoet — `docs/design-lab/`
for prosessen, `tools/` for kontrollene, og commit-historikken for
begrunnelsene, som er skrevet for å forklares, ikke for å forsvares.*

---

## 9. Dommerens tillegg — funn overleveringen ikke har

Skrevet av main-økten 2026-08-07 etter etterprøving. Alt under er kjørt,
ikke lest.

### D-1 · Widgeten kan ikke visne i produktet (blokkerende for N-1)

Se dommen på N-1. Kort: `withBriefFields()` har null kallere etter at
spike-panelet ble slettet, og ingenting setter `expiresAtISO`. Widgeten
sendes med, får data fra `use-widget-snapshot.ts`, og viser samme råd for
alltid. Dette er ikke en mangel ved spiken — mekanismen er bevist — det er
en manglende kobling som oppstod da de to øktenes arbeid møttes.

### D-2 · Android-widgeten står i manifestet

`AndroidManifest.xml:33` registrerer `BabyoraBriefWidget`. Den følger med i
Android-bygget selv om den aldri har kjørt. Overleveringen sier «aldri
kjørt» uten å trekke konsekvensen.

### D-3 · Laben er koblet til motoren

`docs/design-lab/lab/` importerer `@lib/wool-layers/*`. Isolasjonen mot
DESIGN er ekte og verifisert — isolasjonen mot MOTOREN finnes ikke. Endres
anbefalingsmotoren, ryker inntil 335 tester i en mappe uten eier.

### D-4 · «Porter» som ikke kjører

Null av de seks kontrollene i §4 er koblet til CI. Se dommen der.

### Den åpne deep link-testen — avgjort: **la den stå ubesvart**

Testknappen finnes bare i build 85, som ligger på telefonen nå. Argumentet
for å teste før neste bygg er ekte, men svaret ville vært svakt uansett:
den stående hypotesen er at **testpanelet** misset kaldstart-URL-en. Å måle
med instrumentet man mistenker, på et bygg som uansett skal erstattes,
gir ikke et svar man kan bygge på.

Kostnaden ved å ikke svare er nær null. P3 og P4 hviler på ambient
levering, som er bevist (§5). Deep link avgjør hvor et trykk lander — et
spørsmål som uansett må stilles på nytt når widgeten designes for ekte og
`getLaunchUrl()` håndteres riktig.

### Scope creep

To ting har fått løpe:

- **`tools/` vokste med seks filer** som ingen kjører automatisk. Nyttige
  som engangsverktøy, men de er dokumentert som om de vokter noe.
- **Widget-sporet nådde butikkbygget uten å ha passert et designoppdrag.**
  Spiken skulle svare på om ambient levering var mulig. Den gjorde det —
  og etterlot samtidig widget-mål i to plattformbygg. Bevisverktøy skal
  ikke kunne bli med i butikken ved et uhell.

---

## 10. Eieravklaring 2026-08-07 — hvilken dom som gjelder

Tre parter skrev i dette repoet samme dag: main-økten (dommeren),
design-lab-økten (parten som ble dømt), og en Codex-økt.

Design-lab-økten skrev sin EGEN dom over sitt eget arbeid (`c9cd32b`).
Codex-økten merget de to og valgte den (`03a5c41`, «Resolve concurrent
handoff judgment by owner mandate»). Dommen i §1-§9 — main-øktens — ble
dermed borte fra fila.

Eieren ble forelagt konflikten og avgjorde: **main-øktens dom gjelder.**
Den er gjenopprettet her i sin helhet.

Det er verdt å merke seg HVORFOR de to dommene skilte lag, for uenigheten
er reell og kan komme tilbake:

| Post | Denne dommen | Design-lab-øktens |
|------|--------------|-------------------|
| N-1 iOS-widget | ENDRE — koble utløpet, så virker den | FORKAST — ut av butikkbygget |
| N-2 plugin-registrering | BEHOLD uforbeholdent | FORKAST |

Deres kjede henger sammen isolert sett: forkastes widgeten, mister
plugin-registreringen sin eneste bruker i dag. Innvendingen mot den kjeden
er at N-2 ikke er widget-kode — den er en plattformdefekt. Uten den er ALLE
app-lokale Capacitor-plugins usynlige på iOS, også de som skrives om et år.
Å slette en reparasjon fordi dagens eneste bruker forsvinner, er å legge
igjen fellen til neste gang.

**ENDRE-dommen på N-1 er nå utført** (`e8d0cb6`): utløpet er koblet til
`CACHE_TTL_MS`, appens egen definisjon av værdataenes ferskhet. To feil ble
funnet i samme slengen — `shouldPushSnapshot` sammenlignet tidsstempler som
om de var innhold, og `deltaTekst` var påkrevd uten at noen kunne beregne
den. Begge rettet.

**Arbeidsvane som må gjelde så lenge flere økter deler treet:** ingen økt
skriver om en annen økts dom. Er man uenig, skriver man uenigheten som en
egen post og lar eieren avgjøre. En merge som velger side uten at eieren
har sagt noe, er ikke en avgjørelse — det er et tap av informasjon.
