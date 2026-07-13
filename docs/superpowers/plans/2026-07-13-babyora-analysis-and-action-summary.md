# Babyora — analyse og prioritert tiltaksplan

**Dato:** 13. juli 2026

**Status:** Beslutningsgrunnlag, ikke implementeringsgodkjenning

**Omfang:** Analyse og plan. Ingen appkode skal endres før eksplisitt godkjenning.

## Kort konklusjon

Babyora har et godt premiumfundament, men opplevelsen fremstår fortsatt som flere designgenerasjoner samlet i ett produkt. Den eksisterende 90+-planen er sterk som visjon, men er for stor, har enkelte motstridende avhengigheter og bør ikke gjennomføres uendret.

Det viktigste produktgrepet er å gjøre **påkleingsbeslutningen** — barnet, plaggene, lagrekkefølgen og begrunnelsen — til appens visuelle og funksjonelle signatur. Været skal forklare anbefalingen, ikke dominere produktet.

Det viktigste tekniske funnet er en **P0-sikkerhetsrisiko**: overrides, kalibrering og skjermbaserte plaggbytter kan utføres etter dagens sikkerhetskontroll. Denne risikoen må avgrenses før redesign, Motor V2 eller nye premiumfunksjoner implementeres.

**Navnestatus:** Vaerni er avvist. Babyora er kun internt arbeidsnavn. Offentlig navn og wordmark forblir en åpen beslutningsport.

**Aldersstatus:** Første produkt- og motorversjon er avgrenset til 0-24 måneder. Tidligere planer om 0-71 måneder er ikke lenger styrende og må revideres før implementering.

## Scorebilde

| Vurdering | Score | Tolkning |
|---|---:|---|
| Dagens produkt, samlet | **74,0/100** | Godt fundament, men mangler helhet, sannhet og robusthet |
| Visuell/UX-kvalitet mot toppnivå | **65,4/100** | Flere gode flater, men fragmentert illustrasjons- og designsystem |
| Eksisterende plans gjennomførbarhet | **56/100** | Sterk ambisjon, men for store pakker og uklare porter |
| Forventet nivå etter planen uendret | **89,3/100** | Betydelig løft, men sannsynligvis under troverdig 90+-nivå |
| Mål med revidert plan | **92,2/100** | Realistisk toppnivå dersom sikkerhet og brukerbevis styrer portene |

## Viktigste analysefunn

1. **Sikkerhet må komme først.** Dagens legacy-motor kjører sikkerhet før enkelte etterfølgende endringer. En rollback fra Motor V2 til legacy er derfor ikke automatisk trygg.
2. **Hjem skjuler kjerneverdien.** Brukeren må trykke før dagens antrekk blir synlig. En returnerende bruker skal forstå antrekket og hovedårsaken innen fem sekunder.
3. **Plan viser for mye repetisjon og for lite endring.** Fremtidige tidspunkt må åpne korrekt kontekst og fremheve når plagganbefalingen faktisk endres.
4. **Illustrasjonssystemet mangler én sannhet.** Akvarell, clay/3D, flate plagg og fallback-SVG-er blandes. Noen materialer bruker dessuten illustrasjoner av andre materialer.
5. **Plus demonstreres for svakt.** Paywall viser pris før den viser transformasjonen fra «nå» til fremtid, automasjon og deling. Lifetime-produktet strider mot den nye produktretningen.
6. **Planen har doble sannhetskilder.** Fingerprint, plaggkatalog og recommendation-kontrakt må ha én cross-runtime-eier som brukes av app, backend, varsler og widget.
7. **Full garderoberegistrering bør ikke være en kjerneavhengighet.** Den krever mye vedlikehold fra brukeren og gir svakere verdi enn et raskt, sannferdig standardsvar.

## Anbefalt designretning

### Beskyttende morgeninstrument

Appens «instrument» skal være den ferdige påkleingsbeslutningen, ikke et stort glasstermometer.

- **60 % påkledning:** påkledd barn eller kontrollert plaggstabel, lagrekkefølge og trygghetsbeskjed.
- **25 % atmosfære:** værforhold og meningsfulle endringer gjennom dagen.
- **15 % presisjon:** temperaturspor, datatidspunkt, gyldighet og usikkerhet.
- Én visuell grammatikk på tvers av Hjem, Antrekk, Plan, push og widget.
- Vanlige overganger under 320 ms; forklarende sekvenser under 900 ms; redusert bevegelse gir umiddelbar respons.
- Tekst og recommendation-kontrakten er alltid fasit dersom et visuelt asset mangler eller er usikkert.

## Låst avatarretning og produksjonsramme

Avataren beholdes som en sentral identitetsbærer. Første versjon skal ikke være en rigget eller runtime-modulær 2,5D-figur. Den viderefører dagens Nano Banana Pro-genererte soft-3D/clay-uttrykk som kontrollerte 2D-komposittbilder.

### Omfang

- Én barneidentitet for aldersområdet **0-24 måneder**.
- To låste masterpositurer: **sittende 0-11 måneder** og **stående 12-24 måneder**.
- Ingen vær-, vogn-, søvn- eller aktivitetskontekst i selve bildet.
- Figuren viser bare ytterste synlige kroppsplagg og synlig tilbehør. Skjulte ullag og andre underlag vises i plagglisten og forklaringen, ikke gjennom yttertøyet.
- Samme ansikt, anatomi, proporsjoner, kameravinkel, lys, materialitet og grunnskygge i alle tilstander.
- Produksjonen bruker sekvensiell edit-chain: hvert nytt bilde redigerer en godkjent master eller nærmeste godkjente tilstand; barnet genereres aldri på nytt fra bunnen.

### Kontrollert kombinasjonsmatrise

| Synlig gruppe | Per positur | Begge positurer |
|---|---:|---:|
| Seks grunnnivåer fra sommer til ekstrem vinter | 6 | 12 |
| Sommer/mild med alternativt hodeplagg | 2 | 4 |
| Eget regnskall og vindskall | 2 | 4 |
| Vintervarianter med hals/vindvotter | 2 | 4 |
| **Produksjonsmål** | **12** | **24** |

**Teknisk minimum:** 16 bilder dersom dagens A1-A6-mapping og to hodeplaggvarianter brukes uendret.

**Anbefalt produksjonsmål:** 24 godkjente komposittbilder for å unngå at regn, vind eller synlig tilbehør motsier anbefalingen.

**Ikke del av v1:** ubegrensede plaggkombinasjoner, eksternt studio, Higgsfield-video eller ekte rigget 2,5D.

Motorens fottøyregler for under 9 måneder, 9-15 måneder og 16+ måneder beholdes. De håndteres gjennom relevant synlig variant og den eksakte plagglisten uten å opprette en tredje kroppspositur.

### Budsjett og kvalitetsport

- Maksimal direkte kostnad for bildegenerering: **1 000 kr**.
- Arbeidsmodell: eier + AI gjør art direction, prompting, utvelgelse og kontroll; ingen ekstern studioleveranse er forutsatt.
- Arbeidsoppløsning: 2K med mobiltilpasset eksport; 4K brukes bare dersom en konkret flate dokumenterer behovet.
- Hvert godkjent bilde kontrolleres for identitet, anatomi, plaggtype, materiale, synlige tilbehør, bakgrunn/alpha, skygge, mobilutsnitt og samsvar med recommendation-fingerprint.
- Ved manglende verifisert bilde er plagglisten fasit; appen skal aldri vise en plausibel, men feil påkledd avatar.

## Prioritert tiltaksplan

| Fase | Prioritet | Avgrenset leveranse | Obligatorisk port |
|---|---|---|---|
| **0. Beslutningsfrys** | P0 | Registrer Vaerni som avvist, Babyora som internt navn og avklar gratis/Plus-kontrakten | Eiergodkjent beslutningslogg; ingen offentlig identitet låses |
| **1. Fersk baseline** | P0 | Clean install, test, lint, build, audit og deterministiske skjermbilder fra samme commit | Reproduserbar evidence fra clean clone |
| **2. Legacy safety containment** | P0 | Endelig sikkerhetspass etter overrides, kalibrering og swaps, uten terskelendringer | Nye guardrail-tester og uavhengig sikkerhetsreview |
| **3. Grønn arbeidsplattform** | P0 | Lintopprydding uten atferdsendring, CI og reelt UI-/E2E-testoppsett | Test, lint, build og audit grønne på samme SHA |
| **4. North-Star-designport** | P1 | Tre prototyper av Hjem → Antrekk → Plan → Paywall, inkludert feilstater og tilgjengelighet | Fem foreldre tester forståelse, tid og tillit før produksjonsassets |
| **5. Kanonisk fundament** | P1 | Én recommendation-kontrakt, fingerprint og plaggkatalog; typed navigation; hjemsted skilt fra enhetsposisjon | Identiske resultater i browser, Node og Edge-runtime |
| **6. Motor V2 i shadow mode** | P1 | Ny 0-24-måneders pipeline, forklaringer, sikkerhet, scenarioer, kill-switch og fagpakke | Ingen kohort aktiveres før ekstern faglig signoff |
| **7. Core 90+ vertikal** | P1 | Hjem, Antrekk, Finn antrekk, Plan, onboarding og sannferdig paywall | Samme anbefaling på alle flater; komplett gratis svar nå |
| **8. Familie og synk** | P1/P2 | Trusselmodell, auth, RLS, migrering, invitasjoner og entitlements | Cross-household-avvisning, rollback og multi-device-bevis |
| **9. Kalibrering og proaktive flater** | P2 | Begrenset kalibrering, morgenpåminnelse, endringsvarsler og widget | Safety uendret/strengere; dedupe, DST, stale data og fysiske enheter testet |
| **10. Release** | P1 | Audit v2, beta, tilgjengelighet, ytelse, personvern og capability-review | Ingen åpne P0/P1; 90+ støttes av bruker- og enhetsbevis |

**Første forsvarlige implementeringspakke når kode senere godkjennes:**

Fersk baseline → legacy safety containment → grønn arbeidsplattform.

## Målbare suksesskriterier

- Median tid til forstått antrekk for returnerende bruker: **≤ 5 sekunder**.
- Første personlige anbefaling fra installasjon: **≤ 30 sekunder**.
- Minst **90 %** av testforeldre kan gjengi antrekket og hovedårsaken.
- **100 %** dekning av offline, foreldede værdata, manglende sted og ekstreme forhold.
- **100 %** manuell kontroll av sikkerhetsrelevante plaggillustrasjoner.
- Ingen trygghetskritisk informasjon bak betalingsvegg.
- Ingen status kommuniseres kun med farge.
- Hjem, Antrekk, Plan, varsler og widget deler samme semantiske fingerprint.
- Varsler sendes bare når anbefalingen har endret seg meningsfullt.

## Eksterne verktøy

- **Mobbin:** bruk nå til strukturert mønsterresearch, ikke til kopiering eller produksjonsassets.
- **Nano Banana 2:** bruk til bred, rask konseptutforskning.
- **Nano Banana Pro:** bruk til den låste edit-chain-produksjonen på inntil 24 godkjente avatarbilder innenfor 1 000 kr.
- **Google Images:** kun research og lisensoppdagelse; verifiser alltid original lisens.
- **Higgsfield:** utsett til App Store-film eller merkevareanimatikk. In-app-motion produseres kontrollert i kode eller Rive/Lottie.

## Styrende underlag

- [Eksisterende 90+-masterplan](./2026-07-13-babyora-90-plus-master-plan.md)
- [Visuell signaturspesifikasjon](../specs/2026-07-13-babyora-visual-signature-design.md)
- [Produkt-audit](../../../tools/product-audit/runs/2026-07-12T22-14-25-854Z/report.md)

Denne siden oppsummerer analysen og anbefalt rekkefølge. Den erstatter ikke detaljplanene før beslutningene ovenfor er eksplisitt godkjent og ført inn i de styrende dokumentene.
