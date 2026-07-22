# Decision log

This log records current product decisions that override older exploratory material.

## 2026-07-22

### Master handoff klassifiseres som Babyora UX & Motion Bible

**Decision:** `docs/BABYORA-UX-MOTION-BIBLE.md` er godkjent som Babyoras
styringsdokument for UX-prinsipper, motion, signaturopplevelsen og avgrenset
bruk av Higgsfield. Dokumentet er ikke prosjektets overordnede «single source
of truth» og endrer ikke eksisterende dokumentrangering, produktmodell,
sikkerhetskrav, prosess eller godkjente implementeringsplaner.

**Reason:** Innholdet gir en tydelig og nyttig designlære: rolig intelligens,
forklarende bevegelse, tillit fremfor dekorasjon og Antrekkskartets plagg som
informasjonsbærere. Samtidig må repoets etablerte beslutningshierarki og
produktgrenser forbli styrende. Eier godkjente klassifiseringen eksplisitt:
«UX og Motion bible it is».

## 2026-07-19

### Planlegg låses til «Dagslinjen»

**Decision:** Planlegg skal bygges som ett rolig, sammenhengende
planleggingsinstrument kalt **Dagslinjen**, ikke som et kortbasert dashboard.
Skjermen bruker én vertikal hovedscroll og én kontinuerlig linje direkte på den
eksisterende temperaturreaktive flaten. Den store ytterrammen, repeterte hvite
hendelseskort og duplisert time-for-time-liste skal ikke være
hovedpresentasjonen.

Hierarkiet er låst slik:

1. Synlig skjermtittel «Planlegg» med kompakt barn-/stedskontekst.
2. Én behersket kontroll for «I dag / Uke / Snart».
3. Ett dominant svar, for eksempel «Samme antrekk til kl. 10» og neste
   relevante handling.
4. Dagslinjen viser bare tidspunkter hvor anbefalingen faktisk endres.
5. Bare valgt markør utvides i linjen, med én verbdrevet handling, inntil tre
   relevante plagg og «Se hele antrekket» ved behov.
6. Vær forklarer hvorfor handlingen endres; komplett vær-/timeoversikt er
   sekundær og kan åpnes ved behov.

Linjen er semantisk, ikke dekorativ. I Antrekkskartet kobler linjer plagg til
kroppen; i Planlegg kobler Dagslinjen antrekket gjennom tiden. Markørform og
tekst kommuniserer legg til, ta av, bytt, regnbeskyttelse, sted eller
forberedelse. Farge er sekundær.

Det eksisterende Morgennatt-/temperatursystemet beholdes og raffineres. Mint
reserveres for valg og handling, og lagfarger brukes bare når de forklarer
plaggrekkefølge. Bunnmenyen bruker fylt/forsterket ikon, sterkere tekst og en
rolig mintflate; ingen permanent helomsluttende fokusramme.

**Truth constraints før visuell polering:**

- «Time for time» og «hele dagen» krever faktisk heldekkende timegrunnlag;
  ellers snevres ordlyden inn.
- Byttehendelser skiller eksplisitt mellom plagg som tas av og plagg som tas på;
  systemkomprimering som «+8 til» brukes ikke som hovedhandling.
- En fremtidig rad åpner alltid akkurat radens dato, sted, aktivitet, vær og
  anbefaling.
- Funksjonslignende sted-, varsel- og hendelseskontroller vises bare når de har
  en sann handling.
- Skjermen har én `<main>`, én vertikal scroll-eier, `focus-visible` for
  tastaturfokus, 44-punkts mål og validerte kontraster i lys, mørk og alle
  temperaturtilstander.
- Haptikk: `selection` ved visnings-/datovalg og lett respons når en markør
  åpnes. Bevegelse er rolig, kort og har umiddelbar reduced-motion-variant.

**Reason:** Den eksisterende idéen om å vise bare meningsfulle
antrekksendringer er sterk, men dagens kortstabel begraver svaret og oppleves
som mobil web. Dagslinjen gjør Babyoras intelligens, ikke komponentkromen, til
skjermens hovedperson. Retningen ble eksplisitt godkjent av eier («Kjøper det»)
etter en read-only design- og kildekodegjennomgang. Dagens utførelse ble vurdert
til omtrent 53/100; målet er dokumentert 90+ uten å bytte designsystem.

### Antrekkskartet erstatter den delvise ringen på antrekksdetaljen

**Decision:** Antrekksdetaljen skal bruke et skalerbart **Antrekkskart** med
barnet som visuelt sentrum. Hvert anbefalte plagg vises samtidig som en
nummerert node i rekkefølgen innerst først. En forbindelseslinje fra hver node
til riktig kroppsområde er en obligatorisk del av informasjonsmodellen, ikke
dekorasjon. Valgt plagg får tydeligere linje og utvidet navn; øvrige linjer er
lavkontrast, men fortsatt synlige. Den gamle delvise/dekorative orbit-ringen
brukes ikke på antrekksdetaljen.

Ved 1–4 plagg kan nodene vise bilde, nummer og kort navn. Ved 5–10 plagg går
kartet over til to kompakte noderekker rundt avataren: alle plagg, nummer og
kroppskoblinger forblir synlige, mens bare valgt node viser fullt navn. Ingen
`+N flere` eller skjulte plagg tillates. Trykk på node og tilsvarende listrad
skal kryssmarkere hverandre. Farge er sekundær; nummer, plaggform, tekst og
tilgjengelig navn bærer betydningen.

Avataren viser fortsatt bare det verifiserte ytterste synlige antrekket og
tilbehøret. Skjulte inner- og mellomplagg forklares av Antrekkskartet og den
ordnede listen; de animeres aldri gjennom yttertøyet. Listen under kartet bruker
overskriften «Ta på innerst først». `Se alternativ` er en eksplisitt handling
kun når et reelt alternativ finnes; plaggraden åpner forklaringen. Ingen død
alternativhandling vises. Bakgrunnen bruker eksisterende temperaturreaktive
tokens basert på opplevd temperatur.

**Reason:** Dagens ring viste bare deler av anbefalingen og gjorde skjulte lag
usynlige, mens en død/uklar alternativhandling svekket tilliten. Antrekkskartet
gjør avatar, kroppsområde, plagg og påkledningsrekkefølge til ett sammenhengende
system som skalerer fra lette sommerantrekk til plaggintensive vinterantrekk.

## 2026-07-15

### Ny styringsprosess: risikobasert plan→kode (erstatter uniform verifikasjon)

**Decision:** Eier godkjente `docs/PROSESS-PLAN-TIL-KODE.md` som gjeldende
prosess («Bruk dette som plan fremover»). Kjernen er **risikoløyper** — lett /
standard / høy — der kontrollmengden følger risikoen i stedet for å være lik for
alle endringer. Lett løype (dok, copy, dev-only) kan egenverifiseres og samles i
pakke-gaten; standard får fresh-context review av et sammenhengende kandidat-sett;
høy (safety, RLS/auth, betaling, migrering, PII, produksjonsaktivering) beholder
full uavhengig to-nøkkel-verifikasjon per oppgave. PASS knyttes alltid til en
uforanderlig kandidat-SHA. Re-verifikasjon etter FAIL skaleres etter påvirkning,
ikke full runde uansett. Automatisk eskalering til høy risiko er definert.

**Reason:** Den forrige prosessen behandlet alt likt (dobbel modell-runde + full
bevis-seremoni + full re-review per FAIL), som ga treghet uten ekstra sikkerhet
på lavrisiko-arbeid. Ny prosess bevarer de harde høyrisikogatene (safety-motor,
RLS, betaling, avatar-sannhet) uendret, men fjerner seremoni der feil ikke kan
skade brukere/data/inntekt/tillit. Synkronisert: `AGENTS.md` (governing-process-
peker), `verification-protocol.md` (SUPERSEDED-banner — beholdt som referanse for
høyrisiko-verdiktstruktur og sikkerhets-/avatar-gater). Prosessen har egen
måle-loop (§14) for å justere løypene empirisk.

### Prismodell: behold juni-provisjoneringen (39/99/299), kode alignet

**Decision:** Kodens produkt-IDer/priser (F81-forslaget `babyora_*`, 49/299/499 + «Barnetiden») matchet ikke det som faktisk er provisjonert i App Store Connect + RevenueCat (`no.klemeg.app.monthly/quarterly/yearly`, 39/99/299 — STATUS.md, juni 2026). Eier valgte å **beholde juni-provisjoneringen**. Koden er alignet tilbake: `PRODUCT_IDS` → `no.klemeg.app.*`, priser 39/99/299, «Barnetiden»-engangskjøp droppet, kvartal («pappaperm», 99/3 mnd) definert men ikke surfaced i paywallen (`PLAN_ORDER` = årlig + månedlig). Spar-badge 49 % → 36 %.

**Reason:** Ekte kjøp feilet fordi `purchasePackage('babyora_yearly_299')` ikke fant en RevenueCat-package (kun `no.klemeg.app.*` finnes). Å endre koden er raskest til fungerende kjøp; alternativet (re-provisjonere ASC/RC) ga mer portal-arbeid + ny IAP-review. `no.klemeg.app`-bundle beholdes uansett (provisioning-kontinuitet).

### Offentlig navn: Babyora (naming-porten lukket)

**Decision:** Eier beholder **Babyora** som endelig offentlig navn («Behold navn», 2026-07-15). Den åpne naming-porten er dermed lukket. `Vaerni`, `Klarune` og `Uteklar` er avvist underveis. Ingen kode-endring nødvendig — appen bruker allerede «Babyora» i UI-copy og assets. En formell tilgjengelighetssjekk (varemerke, `.no`-domene, App Store-navn, håndtak) anbefales fortsatt før innsending, men blokkerer ikke videre arbeid.

**Reason:** Fjerner den største åpne v1-blokkeren (App Store-tittel, domene). AGENTS.md oppdatert tilsvarende.

### v1 lanseres på dagens motor med veiledende-disclaimer (uten fagsignatur)

**Decision:** Eier velger å lansere v1 på den **containede legacy-motoren** (som allerede gikk gjennom R2 sikkerhets-containment) med en tydelig veiledende-disclaimer, i stedet for å vente på ekstern fagsignatur. Fagsignaturen forblir porten for **Motor V2-aktivering** + R8-avatar-manifest (fast-follow, ikke v1-blokker) — V2 aktiveres IKKE på disclaimer alene (ny, uvalidert sikkerhetslogikk).

**Disclaimer (én kilde: `src/lib/copy/disclaimer.ts`):** kort linje ved anbefalingen på Hjem + full formulering i onboarding og Innstillinger/juridisk. Ordlyd rammer inn som veiledende — «ikke en erstatning for ditt eget skjønn eller helsepersonell» — aldri «det kan være feil» (svakere dekning + undergraver tillit). Passerer produkt-copy-lint (ingen absolutte trygghetspåstander).

**Restrisiko (dokumentert, akseptert av eier etter risikogjennomgang):** motorens sikkerhetsgrenser er internt satt, ikke fag-sertifisert; overoppheting/kuldeeksponering er lav-sannsynlig/høy-alvorlighet. Mitigert av harde guardrails (`finalize-safety.ts`), gratis sikkerhetsinnhold, ingen absolutte påstander, og disclaimeren. **Anbefalt fast-follow:** fagvurdering (helsesykepleier) som gjør disclaimeren om fra «usikker» til «fagvurdert».

### R8 avatar-produksjon fullført via Gemini (Nano Banana Pro) + rembg

**Decision:** De 24 verifiserte komposittene er produsert og ligger i `public/avatars/verified/` (12 stående 12–24 mnd, 12 sittende 0–11 mnd). Metode (eiergodkjent): én låst identitet (`f79-poc` — store øyne, rosa kinn, personlighet) kledd fra appens `garments-clay`-illustrasjoner som referanser, slik at plaggenes farge/form matcher plagg-lista eksakt. Pipeline: Gemini `gemini-3-pro-image` (Nano Banana Pro) → `rembg` (u2net) for ekte alfa. Skall-varianter viser kun ytterste plagg (planregel) og bruker appens faktiske regn/vind-skall-farger (blått, ikke gult). Verktøy: `tools/avatar-gen/{generate,batch,finalize}.ts`. Direkte API-kostnad ~$5 (godt under 1000 kr-taket). Gemini-nøkkel i `.env.local` (gitignorert).

**Gjenstår (presist, senere):** koble `APPROVED_COMPOSITES`-manifestet i `src/lib/recommendation/avatar-state.ts` mot `AvatarStateKey`-ID-ene. `public/avatars/verified/index.json` mapper hvert asset → positur + plagg-sett som input. Gjøres mot motoren ved V2-aktivering (fagsignatur, som er sist) — til da viser Hjem nøytral silhuett uendret. Se [[paywall-verdi-seksjon]].

### Paywall verdi-seksjon lover kun leverbare Plus-funksjoner (R7 Task 7)

**Decision:** PaywallDialog får en verdi-seksjon (`PlusExpansionPreview`) som viser Free→Plus som én 500–700ms ekspansjon (instant slutt-tilstand ved reduced-motion). Hvilke løfter som vises styres av `PLUS_FEATURE_AVAILABILITY` i `src/lib/premium/plus-features.ts`: `future_plan`, `automatic_location` og `extra_children` er på (bygget); `family_sharing` (R9) og `personal_calibration` (senere fase) er **av** og vises derfor aldri i paywallen. Når disse funksjonene lander flippes flagget, og en test fanger regresjon.

**Reason:** Paywallen skal aldri love funksjoner som ikke finnes. Familiedeling og kalibrering er ikke bygget, så «Fremover, overalt og sammen»-løftet leder med det som faktisk er leverbart nå, og «sammen» (familie) forblir skjult til R9. Speiler engine-v2 feature-flags-mønsteret. Autonomt valg per «kjør gjennom med dokumenterte defaults». Se [[omsorgssirkel-dev-preview]].

### Omsorgssirkel som dev-only forhåndsvisning (R7 Task 7)

**Decision:** `CareCircle` (barn i sentrum + inntil 4 omsorgspersoner + «+N flere», solid forbindelse = deler / stiplet = ventende invitasjon) legges inn i Familie-roten som en «De som passer»-seksjon, men KUN bak `import.meta.env.DEV` med statiske eksempeldata. Den skjules helt i produksjon (verifisert: prod-bundle uendret) og har en tydelig «Forhåndsvisning — kommer med familiedeling. Ikke aktiv ennå»-caption. Statusspråket er «Deler»/«Venter på svar» — aldri tilstedeværelse, posisjon eller sporing. SVG-klyngen er dekorativ (aria-hidden); rollelisten bærer den tilgjengelige informasjonen.

**Reason:** Familiedeling krever auth/RLS/backend (R9) og er ikke bygget. Planen tillater en dev-only designforhåndsvisning for å låse IA/uttrykk uten å love en funksjon som ikke finnes. Autonomt valg per «kjør gjennom med dokumenterte defaults». Se [[onboarding-forste-anbefaling-for-paywall]].

### Onboarding viser første anbefaling før paywall (R7 Task 7)

**Decision:** Paywall-teaseren (tidligere onboarding-steg 6, «Se hva Pluss gir deg» → «Prøv 7 dager gratis») fjernes fra onboarding-flyten. Velkomst-steget tar brukeren rett inn i appen, slik at den første ekte anbefalingen på Hjem vises FØR noen paywall. Plus introduseres kontekstuelt inne i appen (eksisterende triggere: imorgen, garderobe_tilpasning, barn_2, forste_vinter), ikke som et pre-verdi-steg.

**Reason:** UI-90-plus-planens Task 7 låser «first recommendation before paywall» og «contextual paywall». Den gamle F81.5-W2 Flate 5-teaseren sto mellom onboarding og første anbefaling og brøt dette. Teaseren listet dessuten morgenvarsel som Plus-gode, som nå er gratis (jf. [[morgenvarsel-gratis]]-endringen 2026-07-15). Autonomt valg per eiers «kjør gjennom med dokumenterte defaults».

## 2026-07-14

### North-Star designretning

**Decision:** Retning **B «Scenen»** (atmosfærisk morgenritual) er valgt av eier («Kjør B») som North-Star for redesignet: avataren står i den temperatur-reaktive atmosfæren på Hjem, ytterplaggene som stille orbital-ankre, ett dominant serif-svar, presisjon som liten glass-chip. Retning C sin listeanatomi (hvorfor-chips, redaksjonell «innerst først»-disiplin) tas inn i Antrekk-drillen. Retning A er dokumentert fallback hvis avatar-assetkvaliteten ikke bærer B. Prototyper: `docs/mocks/north-star/`.

**Utestående evidens:** Fem-foreldre-forståelsestesten (alle fem gjengir antrekk + hovedårsak, median ≤ 5 s) gjenstår og kreves fortsatt som dokumentert evidens før avatarproduksjon (R8) og release (R12) — eiers retningsvalg erstatter valg-delen av porten, ikke test-delen.

**Reason:** B er den eneste retningen som forener de to allerede låste signaturene (avatar som identitetsbærer + temperatur-reaktiv atmosfære) til én scene, leder med følelse for målgruppen (den nysgjerrige forelderen), og gir delbare flater for image-first-markedsføringen.

### Fem-foreldre-porten frafalt av eier (2026-07-14 kveld)

**Decision:** Eier frafaller fem-foreldre-forståelsestesten som forhåndsport for R7-produksjons-UI («Hopp over foreldretest»). Retning B implementeres direkte. ≤ 5 sekunders forståelse beholdes som internt verifiseringskrav i R7 Task 8-evidensen, og en forenklet brukersjekk anbefales fortsatt før App Store-release (R12).

**Restrisiko (dokumentert):** designretningen er valgt uten brukerevidens; oppdages forståelsesproblemer i R7-verifiseringen, kan flate-omarbeid bli nødvendig.

**Merk:** Den eksterne faglige signaturen (Task 17/kohortaktivering) står UENDRET — den blokkerer ingen R7-fremdrift (all UI konsumerer dagens motor til kohortflagg aktiveres), og sikkerhetsråd til spedbarn skal ikke aktiveres uten faglig blikk, jf. AGENTS.md.

### Avatar-/asset-budsjett (reviderer 2026-07-13-beslutningen)

**Decision:** Den harde grensen på NOK 1 000 for direkte bildegenerering oppheves (eier, 2026-07-14: «Ikke lås deg til 1000kr»). Ny regel: før asset-produksjon (R8) eller annen kostnadsdrivende fase legges en konkret kostnadsplan frem for eier, og **eier godkjenner planen før den overskrider store summer**. Løpende autonom pengebruk følger den stående rammen (≤ 100 kr autonomt, alltid deklarert; over det kreves eksplisitt godkjenning). 24-bilders produksjonsmål og 16-bilders teknisk minimum står uendret som kvalitets-/omfangsramme.

**Reason:** Kvalitet på avatar-assets er bærende for valgt retning B; en for stram hard grense skal ikke tvinge kvalitetsreduksjon, men kostnader skal aldri komme som overraskelse.

### R8 avatar-kostnadsplan godkjent (2026-07-14 kveld)

**Decision:** Eier godkjente den konkrete R8-kostnadsplanen («Kjør på»), som oppfyller kravet fra budsjettbeslutningen over om å legge frem en plan før asset-produksjon. Godkjente rammer:

- **Verktøy:** Nano Banana Pro, sekvensiell edit-chain (aldri ny generering fra bunn).
- **Omfang:** produksjonsmål **24 godkjente komposittbilder** (12 sittende 0–11 mnd + 12 stående 12–24 mnd); teknisk minimum 16.
- **Oppløsning:** **2K mobiltilpasset som standard; 4K kun ved dokumentert flatebehov.**
- **Forventet kostnad:** ~150–500 kr (edit-chain, 3–8 forsøk per godkjent bilde). Ingen hard grense, men eier varsles før uventet opptrapping utover dette; eksakt Nano Banana Pro-tariff verifiseres mot gjeldende prisliste før første batch.
- **Kvalitetsport uendret:** hvert godkjent bilde kontrolleres manuelt for identitet, anatomi, plaggtype, materiale, synlig tilbehør, bakgrunn/alpha, skygge, mobilutsnitt og recommendation-fingerprint-samsvar. Manglende verifisert bilde → plagglisten er fasit.

**Merk:** R8-porten er nå åpen. Selve genereringen forutsetter fortsatt at retning B-skjermene (R7 Task 3+) finnes, men er ikke lenger blokkert av fem-foreldre-porten (frafalt over).

**Reason:** Kostnadsplanen er beskjeden mot verdien av bærende avatar-assets for retning B, og oppfyller «ingen kostnad kommer som overraskelse»-regelen.

## 2026-07-13

### Product model

**Decision:** Free solves today at one fixed home location. Plus expands the product to the future, automatic/multiple locations, and family collaboration.

**Reason:** The free product must fully solve the core daily problem. Plus should sell planning, automation, and coordination rather than a deliberately incomplete recommendation.

### User language

**Decision:** Use `plagg` as the primary user-facing concept. The recommendation list communicates dressing order. Layer classifications remain internal to the engine where useful.

**Reason:** `Plagg` is easier to understand than `lag`, while ordered presentation preserves the intuitive layering model.

### Wardrobe and computer vision

**Decision:** Do not make wardrobe registration or photographs of owned clothes a core feature.

**Reason:** High setup and maintenance effort for limited daily value. The product should perform more work than it asks the parent to perform.

### Engine 2.0 scope

**Decision:** Limit the first release and Engine 2.0 v1 to ages 0-24 months. Ages 25-71 are deferred to a later product phase. Treat synthetic materials and blends as valid functional choices, not exceptions. Keep the current engine available while V2 is validated in parallel.

**Reason:** The narrower age scope reduces recommendation, safety, footwear, activity, and avatar complexity while the core product is proven. Material performance, activity, weather protection, age, and situation still matter more than a wool-versus-cotton binary.

### Design system

**Decision:** Keep and refine the existing visual system. Use temperature-reactive backgrounds as a signature on relevant surfaces. Preserve the semantic direction of night/plum foundations, mint actions, peach warmth/editorial emphasis, and restrained motion and haptics.

**Reason:** The app already has a distinctive foundation. Consistency, hierarchy, feedback, and content accuracy create more value than replacing it with a generic system.

### Navigation and premium story

**Decision:** Organize the product around Home, Plan, Guide, and Family as the target information architecture. The final implementation sequence remains governed by the master plan.

**Reason:** This structure maps to now, future preparation, learning/tools, and shared care better than a top-level Settings destination.

### Name

**Decision:** Remove Klarune and Vaerni from the final shortlist. The public name remains open; Babyora is an internal working name only.

**Reason:** Vaerni did not create a natural enough association with clothing when spoken. A new name must pass pronunciation, association, trademark, domain, app-store, and handle gates before approval.

### Avatar scope and production model

**Decision:** Keep the baby as a central identity element. For the 0-24 month first release, use one child identity with two locked poses: sitting for 0-11 months and standing for 12-24 months. The image has no weather, stroller, sleep, or activity context. It shows only the outermost visible clothing and accessories; hidden underlayers remain in the canonical garment list and explanation.

**Decision:** Use the existing Nano Banana Pro soft-3D/clay avatar and sequential edit-chain workflow. Do not build a rigged or runtime-modular 2.5D avatar for v1.

**Decision:** Plan for 24 approved composite images: 12 per pose. Six base warmth states, warm-weather headwear variants, distinct rain/wind shells, and visible strong-wind accessories form the controlled visual matrix. Sixteen images is the technical minimum; 24 is the production target. Exact footwear remains governed by the engine's under-9, 9-15, and 16+ month rules without requiring a third body pose.

**Decision:** Direct image-generation spend is capped at NOK 1,000 for this asset phase. The owner and AI workflow provide art direction, prompting, selection, and QA; no external studio cost is assumed.

**Reason:** The existing avatar already establishes product identity. Restricting the system to two master poses, outermost visible garments, and canonical states avoids combinatorial asset growth while preserving visual truth and premium consistency.

### Logo

**Decision:** Continue with concept A, `Beskyttet kjerne / Protected core`, while keeping it independent of the final name.

**Reason:** The protected center and surrounding arcs communicate the child, care, clothing, weather adaptation, and a broader family assistant without becoming a literal baby illustration.

### Marketing

**Decision:** Prioritize a cost-free, image-first Instagram rollout. Video is optional rather than mandatory. Paid acquisition is not part of the initial plan.

**Reason:** The initial budget is approximately NOK 0-1,000, and the product's clothing/weather advice can be communicated with reusable visual formats before investing in paid media.

### Repository continuity

**Decision:** Store code, plans, decisions, handoffs, and relevant assets in a private GitHub repository. Push at meaningful milestones.

**Reason:** The project must remain recoverable and usable from a laptop or mobile device even if access to a desktop session or chat is lost.

