# Babyora — SAMLET ARBEIDSORDRE med atomisk avsjekking + Fable 5-verifikasjon

> Én selvstendig prompt som samler: byggkjede-fiksen, hele P8
> (forside, rust, utstyr, Guide-hub, TOG), åpne rester — og avsluttes
> med en Playwright-runde som produserer en verifikasjonspakke som
> Sivert laster opp til Fable 5 for uavhengig dobbeltsjekk.
> P9 (widgets/analytics) kjøres separat og røres IKKE her.

## PROTOKOLL

1. Denne filen sjekkes inn som `review/MASTER-CHECKLIST-SAMLET.md` og
   oppdateres i SAMME commit som arbeidet den beskriver.
2. Hver boks lukkes som `[x]` + commit-hash, `[~]` + begrunnelse,
   `[!]` + backlog-oppføring, eller `[?]` + oppføring i
   `review/QUESTIONS-FOR-FABLE.md`. ALDRI stille hopp, ALDRI slett.
3. AUTONOMI-PROTOKOLLEN i CLAUDE.md gjelder: aldri stopp for å spørre
   Sivert; usikkerhet → `[?]` + foreløpig valg + fortsett.
4. Globale regler: ingen terskel-endring i wool-layers uten
   ANOMALIES-oppføring; ingen død UI; all synlig tekst avledet av
   Recommendation/værdata; 430×900 + 360×780; reduced-motion
   respekteres; build + tester grønne mellom faser.
5. Fasene kjøres I REKKEFØLGE. Fase 0 er blokkerende for alt.

---

## FASE 0 — BYGGKJEDEN (blokkerer alt annet)

- [ ] Rapportér i denne filen: `git log origin/redesign/instrument-level
      -3 --oneline` og `git log -1 -- ios/App/App/public`
- [ ] codemagic.yaml har stegene i rekkefølge: `npm ci` →
      `npm run build` → `npx cap sync ios` → arkiver. Mangler noe:
      legg til. Tilsvarende for Android-workflow med `cap sync android`
- [ ] `ios/App/App/public` og `android/app/src/main/assets/public`
      fjernes fra git (.gitignore + `git rm -r --cached`) — CI bygger
      web-assets fersk hver gang, aldri fra committet øyeblikksbilde
- [ ] Verifiser at Codemagic-workflow trigges på riktig branch
      (`redesign/instrument-level` frem til merge)
- [ ] Eventuell dependency-cache i CM inkluderer ALDRI `dist/`
- [ ] **Byggstempel:** injiser `VITE_BUILD_SHA` (git rev-parse --short
      HEAD) + byggdato i Vite-bygget; vis i Innstillinger-versjonen
      (.iz-ver-raden): «v{X} · {sha} · {dato}». Ethvert bygg skal
      kunne verifiseres mot git på to sekunder
- [ ] Lokal røyk-test: `npm run build && npx cap sync ios` kjører
      grønt fra ren klon

## FASE 1 — FORSIDEN (P8.1: gammel ro, ny sannhet)

### Header
- [ ] Liten avatar (88 px) i header, venstre for navn
- [ ] **Ytterste-lag-regelen:** avatar-tier = ytterste KLESPLAGG;
      sovepose/utstyr vises ALDRI på avataren (test: rec med sovepose
      → avatar uten)
- [ ] Avatar-crossfade ~200 ms ved yttertøy-endring; halo/breathe
      gjenbrukes; reduced-motion slår av
- [ ] Navn i DM Serif i `--brand` (rust) + «I DAG» under

### Fjernes fra forsiden
- [ ] Stor avatar i hero — UT (komponent parkeres, ikke slettes)
- [ ] Sover/Våken-toggle — UT (default våken; flyttes, se I vogna)
- [ ] «Skal i bilstol»-toggle — UT av hero (HB-9 trigges kontekstuelt
      av yttertøy; noter hvor toggelen evt. bor)
- [ ] VIS LAG / LayerPeelControl — UT (parkeres m/ README-linje)

### Vær + oppsummering
- [ ] Værpille i dagens form; ikon-mapping fra P0.3 aktiv
- [ ] Live værhenting ende-til-ende (ikke mock): henting, geokoding,
      cache, feiltilstand m/ «Prøv igjen»; met.no-attribusjon i Innst.
- [ ] Motor-drevet summary; ALLE kategorier i bruk nevnes; «TOG»
      med store bokstaver i UI-tekst

### Den grupperte listen
- [ ] Rader = LAG (innerst → lag 2 → lag 3 → lag 4, kun de som
      finnes) → «Topp til tå» → «I vogna»
- [ ] Hvert plagg i raden: mini-thumbnail + displayName(), klikkbart
      → plaggside med dynamisk «hvorfor»
- [ ] Nummer-badge per rad (1, 2, 3 …), tabular-nums
- [ ] Kategorifarge-markør (4 px venstrekant) per rad
- [ ] «Topp til tå»-rad vises kun ved relevante plagg (lue, votter,
      lugger, sko); lite værhint i raden («−6° — lue og votter»)
- [ ] «I vogna»-rad (sovepose m/TOG, regntrekk, pledd): kun ved
      relevant utstyr; label «Ekstra» ved andre aktiviteter
- [ ] «Sover {navn} ute?»-chip INNE i «I vogna»-raden styrer
      sover-modus
- [ ] A11y: rader som liste, plagg som buttons m/ aria-label,
      fokus-retur fra plaggside
- [ ] 430×900 ved 4 lag: header + vær + summary + AKTIVITET + hele
      listen synlig uten scroll (maks ett lett trinn)

## FASE 2 — RUST-PALETTEN (P8.3)

- [ ] tokens.css (OKLCH + hex-fallback på kritiske):
      --brand oklch(42% .11 35) · --brand-cta oklch(60% .15 35) ·
      --brand-tint oklch(94% .03 35) · --bg oklch(97.5% .008 85) ·
      --surface white · --ink oklch(22% .015 35) ·
      --mute oklch(50% .02 35) · --cold oklch(62% .10 240) ·
      --warm oklch(72% .13 75) · --ok oklch(58% .10 150) ·
      garment-innerst/mellomlag/ytterst uendret ·
      **--garment-ekstra FLYTTES korall→rav oklch(70% .13 35→75)**
- [ ] Kommentar i tokens.css: ekstra og --warm deler rav-familien
      bevisst; rav ALDRI på knapper/CTA
- [ ] --terra/--terra-deep aliases → --brand-cta/--brand
- [ ] theme-color i index.html → --bg-verdien
- [ ] Avledede tilstander (hover L−4 %, press L−8 %) oppdatert
- [ ] Grep-bevis i denne filen: null `#d9651f`, null `--terra-light`,
      null blå brand-rester i dist etter build
- [ ] AA-kontrast: brand på bg, ink på flater, hvit på brand-cta —
      resultat logget
- [ ] COLOR-DEBT.md oppdatert

## FASE 3 — WOOL-LAYERS: UTSTYR (P8.2)

- [ ] Ny kategori `utstyr` (regntrekk, vognpose, kjørepose, pledd);
      sovepose-modell valgt og dokumentert i ANOMALIES
- [ ] Regntrekk anbefales ved nedbør + vogn (tetthet før isolasjon)
- [ ] A-1-terskelen røres KUN hvis godkjent av Sivert; ellers `[!]`
- [ ] Guardrail: utstyr aldri på avatar-tier
- [ ] Topp-til-tå-mapping definert i data (lue, votter, lugger, sko,
      solhatt)
- [ ] MATRIX.md regenerert med utstyrskolonne; guardrail-suiten grønn

## FASE 4 — GUIDE-HUB (P8.4)

- [ ] `/guide` åpner på FEM kort: Finn antrekk · Plaggbiblioteket ·
      TOG-guiden · Søvn inne · Varm eller kald?
- [ ] Ruter m/ tilbakenavigasjon som husker opphav
- [ ] «Varm eller kald?» ALDRI premium-låst
- [ ] Finn antrekk: Våken/Søvn-toggle fjernet
- [ ] Plaggbiblioteket: GarmentDetailScreen `mode: library |
      recommendation`; gruppert etter kategorifarger; én datakilde
- [ ] **TOG-kompletthetssjekk:** diff alle TOG-verdier i plaggdata mot
      TOG-guidens liste; rapportér funn her (mistanke: 2,5 mangler)
- [ ] Guiden dekker 0,2 · 0,5 · 1,0 · 1,5 · 2,0 · 2,5 · 3,5 med
      romtemp-intervall + «hva under», kilder synlig
- [ ] **Permanent guardrail-test:** hver TOG i plaggdata SKAL ha
      guide-oppføring — bygget feiler ellers
- [ ] Søvn inne: romtemp-slider + alder → TOG + bekledning; konservativ
      < 3 mnd; kilder + disclaimer på siden; overheat-kort nederst
- [ ] Varm eller kald?: nakkesjekken, overoppheting, nedkjøling/
      frostskade (aldersjustert, kilder), bilstol/HB-9

## FASE 5 — RESTER OG OPPRYDDING

- [ ] Alle åpne punkter fra CSS-AUDIT (A/B/C) og gamle MASTER-
      CHECKLIST verifisert lukket; åpne rester kopieres HIT med boks
- [ ] P7-punkter som erstattes av Fase 1 markert `[~]` i gammel liste
- [ ] Død kode ut av dist: orbit-keyframes, .hero-pin, dressup-CSS
      utenfor sandkasse, Tailwind hvis ubrukt
- [ ] Språkvask: «TOG» versalt, displayName() overalt, én kanonisk
      form per plaggnavn

## FASE 6 — PLAYWRIGHT + FABLE 5-PAKKEN (siste fase, obligatorisk)

### 6.1 Shots (430×900 OG 360×780, navngitt nøyaktig slik)
- [ ] 01-hjem-vogn-3lag (typisk dag)
- [ ] 02-hjem-utelek-vinter (6+ plagg: topp-til-tå-rad synlig m/ værhint)
- [ ] 03-hjem-vogn-sover (I vogna-rad m/ sovepose; avatar UTEN sovepose)
- [ ] 04-hjem-regn (I vogna m/ regntrekk; vær-partikler)
- [ ] 05-plaggside-fra-rec (dynamisk «hvorfor» synlig)
- [ ] 06-plaggside-fra-bibliotek (uten «hvorfor»)
- [ ] 07-guide-hub (fem kort)
- [ ] 08-guide-tog (full stige synlig)
- [ ] 09-guide-sovn (kilder + overheat-kort)
- [ ] 10-guide-sjekk (Varm eller kald?)
- [ ] 11-uke-10dager + 12-uke-timeforTime (klikkbar → TimeShift)
- [ ] 13-innstillinger (byggstempel synlig nederst)
- [ ] 14-onboarding-steg3 (sted-pille, CTA m/ farge)

### 6.2 Selvsjekk før pakken
- [ ] Hver shot vurdert mot relevante bokser; avvik → fiks → nytt shot
      (maks 3 interne runder)
- [ ] Grep-bevis kjørt og limt inn: #d9651f=0, --terra-light=0,
      TOG-diff-resultat, build-SHA

### 6.3 FABLE-PAKKEN (det Sivert laster opp til Fable 5)
- [ ] Generér `review/FABLE-PACKAGE.md` med:
      (a) build-SHA + dato, (b) status-sammendrag: antall [x]/[~]/
      [!]/[?] per fase, (c) full liste over [!] og [?] med kontekst,
      (d) grep-bevisene, (e) shot-indeks med én linje per bilde om
      hva som skal vurderes
- [ ] Alle shots i `review/shots/SAMLET/` med navnene over
- [ ] Avslutt kjøringen med beskjed: «Pakken er klar — last opp
      FABLE-PACKAGE.md + shots til Fable 5.» IKKE merge.

## MERGE-GATE

- [ ] **Fable 5 har gitt GO** på pakken (Siverts bekreftelse i ny
      melding teller som GO-formidling)
- [ ] Eventuelle Fable-funn fra pakken er fikset og re-verifisert
- [ ] Ingen tomme `[ ]`; alt er [x]/[~]/[!]-m-backlog/[?]-besvart
- [ ] MATRIX, ANOMALIES, COLOR-DEBT, QUESTIONS-FOR-FABLE oppdatert

## OPPDAGET UNDERVEIS
(nye funn her, med dato og egen boks)
