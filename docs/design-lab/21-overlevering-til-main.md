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

**DOM:** ____

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

**DOM:** ____

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

**DOM:** ____

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

**DOM:** ____

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

**DOM:** ____

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

**DOM:** ____

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

**DOM:** ____

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

**DOM:** ____

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
