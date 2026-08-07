# Onboarding imagery — beslutningsinventar

**Dato:** 2026-08-07

**Scope:** Fase 0–3, isolert mock, stopp ved EIERPORT 1
**Presedens:** `AGENTS.md` → `docs/CLAUDE-START-HERE.md` →
`docs/DECISION-LOG.md` → øvrige aktive dokumenter → faktisk kode for hva
produktet gjør nå.

## Inventar

| Tema | Nåværende løsning | Bevis/kilde | Status | Kan utfordres nå? | Risiko ved endring |
|---|---|---|---|---|---|
| Produktjobb | Råd om påkledning etter vær, sted, alder og aktivitet | `PRODUCT.md`; `AGENTS.md` | **BINDING** | Nei | Produktet blir en vær-, bilde- eller underholdningsapp |
| Aldersscope | 0–24 måneder | `AGENTS.md`; `PRODUCT.md`; `DECISION-LOG.md` | **BINDING** | Nei | Uvalidert fag- og produktomfang |
| Anbefalingsmotor og sikkerhetsgrense | Deterministisk motor; `finalizeSafety` er endelig grense | `AGENTS.md`; prosessdokumentet | **BINDING** | Nei | Sikkerhetsbrudd |
| Første verdi før betalingspress | Første ekte anbefaling skal kunne leses før paywall | `DECISION-LOG.md` 2026-07-15; `AppPaywallGate.tsx` | **BINDING** | Nei | Mørkt mønster og kontraktsbrudd |
| Betalingsmodell | `AGENTS.md` sier Free=today/home; `PRODUCT.md` 2026-07-31 sier hard paywall etter første anbefaling | Konflikt mellom høyere og lavere dokumentnivå | **UNKNOWN** i dette oppdraget | Nei | Inntekt/entitlement; eksplisitt utenfor scope |
| Brukerdata | Barn lagres lokalt; ingen backend i dagens flyt | `children-provider.tsx`; onboarding-copy | **BINDING** | Nei | PII/personvern |
| Faktisk onboarding | Fire profil-/kontrollsteg + velkomst, deretter Hjem og egen beregnings-CTA | `OnboardingScreen.tsx`; baseline-video | **PROVISIONAL** | Ja, som mock | Friksjon og tid til verdi |
| Navn | UI sier valgfritt; steg 4 krever `nameOk` | `OnboardingScreen.tsx:514–560, 856–864`; baseline dead-end | **UNKNOWN / KONFLIKT** | Ja, men isoler fra medietest | Brukeren blir blokkert av et «valgfritt» felt |
| Fødselsdato | Plattformens datovelger; kode tillater omtrent 0–60 måneder | `earliestDob`; `ageInMonths()` | **PROVISIONAL / KONFLIKT** | Ja, men ikke motoren | Eldre barn kommer inn i et 0–24-måneders produkt |
| Hjemsted | Eksplisitt posisjonsknapp eller manuelt søk; ett fast hjemsted | onboarding steg 3; `AGENTS.md` | **BINDING** som nødvendig input | Presentasjonen kan utfordres | Tillit, personvern og ugyldig værgrunnlag |
| Første anbefaling | Velkomst sier «Dagens råd er klart», men Hjem krever deretter ny CTA og 3,2 s scan | steg 5; `HjemMonter.tsx`; baseline | **PROVISIONAL / KONFLIKT** | Ja | Løfte før varen finnes; ekstra venting |
| Launch | Inline espresso/krem-flate med SVG-ordmerke; slipper etter første React-maling, 4 s nødutgang | `index.html`; `launch-handoff.ts` | **BINDING** for robusthet, **PROVISIONAL** visuelt | Bare overgang kan testes | Hvit mellomframe eller kunstig venting |
| Tema | Systemstyrt lys/mørk fra v1; mørk-first art direction | `PRODUCT.md` owner decision round 4; tokens | **BINDING** | Nei | Dårlig dagslysbruk eller inkonsistent app |
| Maskot | Én stående, dekorativ maskot på alle onboardingsteg; plaggliste er fasit | `OnboardingScreen.tsx`; `OnboardingBabyHero.tsx`; UX-bibelen | **PROVISIONAL** i onboarding | Ja | To merkevarer eller maskot som falsk anbefaling |
| Foto i onboarding | Ingen foto i produksjonsflyten | faktisk JSX/assets | **PROVISIONAL** | Ja | Generisk uttrykk, representasjon, rettigheter, feil fasit |
| Video i onboarding | Tidligere MP4 er arkivert; ingen `<video>` i appen | `OnboardingBabyHero.tsx`; testport | **HISTORICAL** | Ja som K2-hypotese | Død kode, størrelse, autoplay, Reduce Motion |
| Motion | Kort 8 px inn-fade; Reduce Motion dreper transitions; CTA er umiddelbar | onboarding CSS | **PROVISIONAL** | Ja | Dekorasjon som forsinker eller distraherer |
| Interaksjonsgulv | Minst 44×44 pt | `DESIGN.md`; plan; HIG | **BINDING** | Nei | Motorisk tilgjengelighet |
| Nåværende 44-pt-etterlevelse | Tilbakeknapp 40×40; editknapp 34×34, ned til 30×30 på lave skjermer | onboarding CSS | **PROVISIONAL / KONFLIKT** | Ja i mock | Bomtrykk; VoiceOver-/motorikkgjeld |
| Analytics | Type finnes for steg 1–3; ingen produksjonskaller funnet; PostHog er no-op uten nøkkel | `track.ts`; repo-søk | **UNKNOWN** | Ja med lokal mocklogging | Falsk påstand om målbar konvertering |
| Partial resume | React-state overlever vanlig bakgrunn/resume; ingen persistens før steg 4, så prosessdød starter på nytt | onboarding + children-provider | **PROVISIONAL** | Ja i mock | Tapt input og frustrasjon |
| Design-lab P1–P4 | Separat produktmodelltest, ikke mediebake-off | `docs/design-lab/21-overlevering-til-main.md` | **HISTORICAL / PARALLELL** | Nei som erstatning for K0–K3 | Feil spørsmål får blokkere onboarding |
| Mockgrense | Ingen produksjonskode eller produksjonsnære assets før EIERPORT 1 | eieroppdrag + `Babyora-plan.md` | **BINDING** | Nei | Prematur binding og vanskelig rollback |

## Dokumenterte konflikter før endring

1. `CLAUDE-START-HERE.md` og eldre handoff sier at navnet er åpent;
   `AGENTS.md` og nyere beslutningslogg låser **Babyora**. Babyora gjelder.
2. `CURRENT-HANDOFF.md` beskriver onboardingfilm i drift; faktisk kode og
   test sier filmen er arkivert og aldri spilte. Koden gjelder for baseline.
3. `aapningskontrakt-2026-08-01.md` sier «ikke implementert»; `index.html` og
   `launch-handoff.ts` implementerer store deler. Statuslinjen er foreldet.
4. `PRODUCT.md` og `AGENTS.md` er uenige om hard paywall kontra Free. Dette
   oppdraget rører ikke betaling og legger ikke noen av variantene til grunn.
5. Designhandoffet peker på `public/illustrations/onboarding/`; mappen finnes
   ikke. Gamle medier ligger under `docs/mocks/arkiv/illustrations-onboarding/`.

## Komponentklassifisering for dette oppdraget

| Del | Klassifisering | Begrunnelse |
|---|---|---|
| Motor, safety, værgrunnlag, profilpersistens, betaling | **KEEP** | Utenfor mandat og bindende sannhet |
| Launch-fallback og kontekstuell posisjonsforespørsel | **KEEP** | Robusthet og personvernmekanisme |
| K0-flyten | **KEEP som kontroll** | Må kunne vinne på faktisk ytelse |
| Maskotens mengde og velkomststegets løfte | **TEST** | Kan gi varme, men kan også forsinke/overlove |
| Foto/video/ekstra intro | **TEST, ikke implementer** | Hypoteser uten brukerbevis |
| 44-pt-brudd, valgfritt-navn-blokkering og 0–60-måneders input | **REFACTOR senere** | Reelle funn, men produksjonsretting ligger utenfor denne mockpakken |

## Fase-0-konklusjon

Dagens onboarding er ikke en tom kontroll: den er raskt interaktiv, lokal,
uten medieavhengighet og har en etablert Babyora-identitet. Utfordrerne må slå
den på forståelse eller tillit uten å øke de allerede dokumenterte ni
automatiserte handlingene og den separate 3,2-sekunders scannen.
