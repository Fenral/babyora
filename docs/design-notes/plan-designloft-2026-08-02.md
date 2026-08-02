# Plan: Designløftet — fra veloppdragent til dyrt (v2, 2026-08-02)

Bakgrunn: eiers referansesammenligning (Ferrari/Any Distance/pinnsvin-app
m.fl.) + kritisk analyse. V2 etter ekstern review (Sol): planen godkjent
med tre endringer — Scene nedgradert fra verden til virkemiddel, full
billedproduksjon flyttet til ETTER en on-device proof-slice, og T1/T9A
fortsetter parallelt mens merkevarelaget avgjøres.

Stegvis godkjenning: hvert steg har synlig leveranse og STOPP der eier
velger. Godkjenning gjelder kun neste steg.

## Diagnosen (revidert etter ekstern review)

Gapet mot referansene sitter i:

1. **Eierskap, ikke bare bildekvalitet.** Et skarpere AI-bilde er ikke
   dyrere — det kan fortsatt se generisk ut. Babyora trenger en egen,
   gjenkjennelig karakter- og tekstilverden. Maskoten er største
   merkevareressurs OG største premiumrisiko: en generisk «Pixar-baby»
   med flood-fill-kant holder igjen alt annet.
2. **Materialkoherens.** Maskot, værikoner, plagg, petrolpanel og skygger
   har i dag ulik lys-/materiallogikk (frontbelyst maskot, varmt
   stoffbelyst værikon, matt panel, flat CTA — på samme skjerm). Alt må
   dele lyskilde, fargetemperatur, kamerafølelse og skyggeadferd.
3. **Lys som komposisjon** — ikke bare som kant og skygge. Espresso har
   farge men lite atmosfærisk dybde; lys modus er funksjonell men ikke
   kunstnerisk formulert.
4. **Typografisk/ikonografisk forfatterskap.** Størrelseskontrast,
   tallmateriale, etikettbehandling, optiske innrykk, ikonform/strekvekt
   er trygge. Utfordres i bake-offen (betyr ikke automatisk ny font).
5. **Fokal autoritet, ikke nødvendigvis brutt kolonne** (korrigert):
   Hjem har allerede et godt grep (maskoten overlapper panelet); problemet
   er at ansikt, temperaturtall og CTA konkurrerer. Premium krever
   tydeligere RANGERING, ikke mer asymmetri. Kolonnen brytes kun der det
   forklarer hierarki eller rom.
6. **Referansene er delvis kampanjeflater** (Ferrari-foto, Perpetra-
   landing). Bake-offen dømmes derfor mot referansenes visuelle autoritet
   OG Babyoras virkelighet: lange navn, stale data, syv plagg, lav
   lysstyrke, Reduce Motion, lys modus.

## Ligger fast uansett utfall

Produktgrunnloven (sannhet, flatenes jobber, tilgjengelighet,
katalogsannhet, motorgrensen), 3,2 s-scannen, no.klemeg.app. Det er
merkevarekontrakt-nivået som utfordres — via eksplisitt eierbeslutning.

**Nattgrensen («atmosfære uten spektakel») gjelder alle kandidater:**
Tillatt: én implisitt lyskilde per viewport; statisk lavfrekvent
atmosfærefelt; kontakt-/bakkeskygge som forankrer maskoten; lokal
kantrespons ved berøring; materialdybde i panel og plagg; ETT dominerende
bevegelsesøyeblikk (scannen). Ikke tillatt: kontinuerlig glød/puls;
parallax/gyro-scene; store lyse gradienter bak tekst; glasskort over
kompliserte bakgrunner; flere konkurrerende lyskilder; animert
maskotscene i ro; glow som bærer semantikk; økt luminans som
«premium»-signal. Kjerneinfo står alltid på opake, kontrastkontrollerte
flater. Dommerregel: *hvis atmosfæren fortsatt er det brukeren legger
merke til etter at temperatur og råd er lest, er den for sterk.* Alle
finalister testes i mørkt rom på 1–5 % skjermstyrke.

## Spor 1 (starter umiddelbart): T1 + T9A

Uavhengige av art direction — fryses IKKE:
- **T1 Katalogsannhet:** 5 bilde-mismatcher, 60/60 visningsnavn,
  språkfeil, katalogfelt-validering (T1B: lagrolle/dekning/varme/
  funksjon/avhengigheter).
- **T9A Oppstart/datatilstand:** cachematrise, resume ≠ ny prosess,
  fontberedskap, korrekt første tilstand.

Visuell implementering av T2/T4 er frosset til verden er valgt.

## Spor 2: Art direction-bake-off

**A1 Referansegrunnlag.** Eiers referanser + premium-mønstre (Mobbin)
som målestokk, med låne/avstå-tabellen fra reviewen (Ferrari: lån ett
heroobjekt + én aksent + instrumentdetaljer, avstå fra foto som
overskygger funksjon; Any Distance: lån proprietær karakter + studiolys +
typografisk mot, avstå fra LED-glød og gamification; pinnsvin: lån felles
lys + kontaktskygge + karakter som hører til i rommet, avstå fra
kontinuerlig sceneaktivitet; osv.).

**A2 Semifinale: Hjem (mørk + lys) i tre kandidater + kontroll:**

| Retning | Tese |
|---|---|
| **Textile Atelier** | Retningsbestemt varmt studiolys, troverdige tekstilmaterialer, plagg som produktfoto/render, maskot og klær i samme lysrigg. Sterkeste domenetreff. |
| **Quiet Instrument** | Dyp espresso/nesten-svart, petrol med presise kanter og kontrollert materialdybde, selvsikre tall, svært begrenset glød. Raffinert — lyser ikke opp rommet. Ingen krypto/gaming-assosiasjon. |
| **Nordic Editorial Care** | LYSMODUS-FØRST som egen tese: diffust dagslys, papir-/tekstiltoner, store utsnitt, redaksjonell ro. Premium gjennom kvalitet og luft, ikke filmatisk 3D. Korrigerer mørk/neon-skjevheten i referansene. |
| **Monter+ (kontroll)** | Dagens retning med felles atmosfærisk lys, bedre panelmateriale, autorisert billedproduksjon, sterkere typografisk hierarki. Må bevise at radikal redesign gir mer enn bedre utførelse av det vi har. |

Scene er IKKE egen verden — brukes som mulig hero-grep inne i Atelier/
Nordic. Ekstern reviewers forhåndsfavoritt: hybrid Atelier × Quiet
Instrument (tekstil/maskot får varm studioautoritet; data/kontroller
forblir rolige og presise) — men Nordic må få bevise lysmodus.
**STOPP 1: eier velger TO finalister.**

**A3 Finale (kun de to):** resultat + Kle på + stale-tilstand + begge
temaer + én kort bevegelsesprototype per finalist (uten produksjonskode).
Testes på fysisk telefon ved lav lysstyrke.
**STOPP 2: eier velger verden.** (Eier velger merkevare; eventuelle
testbrukere tester glanselesing/tillit/nattkomfort — ikke «penest».)

## Spor 3: Produksjonsbevis før full billedproduksjon

**B1 Proof-pakke for vinneren:** 6 representative plagg + én komplett
maskotpose + 2 værikoner + panelmateriale/skyggekontrakt — og en liten
**on-device vertikal slice**: Hjem → scan → resultat → Kle på med de nye
assetene, på telefonen.
**STOPP 3: holder retningen når den er ekte, dynamisk og på telefon?**
Deretter låses art bible (bindende billedkontrakt: lysrigg, kamera,
materialvokabular, skala, kontaktskygge).

**B2 Gatede delbatcher** (IKKE alle 60 i én batch — irreversibel risiko):
innerlag → mellomlag → yttertøy → tilbehør → værikoner → maskotposer.
Samme lysverden, kategorijustert kamera/skala, gylne referanser per
kategori. Automatisert QA (alfakutt, skala, luminans, backplate-klasse)
+ MENNESKELIG art direction-sjekk per batch (QA måler kant og utsnitt,
ikke om ull ser plastisk ut).

## Spor 4: Resten av MVP-en i vinnerverdenen

- **T2 Hjem-troverdighet** + vinnerens atmosfære/panelmateriale + fokal
  rangering (ansikt vs. tall vs. CTA).
- **T2B Kle på-porten:** KUN visuell port av eksisterende flyt til
  vinnerverdenen — ingen skjult funksjonell redesign, ingen
  forskuttering av tillitssløyfen (T8).
- **T4 Scan v3.1:** syntesebeat, «Vis antrekket nå», ærlig ventetilstand,
  samlet landing.

Hver pakke: grønne porter + smaksdommere med referansebilder OG
Babyora-virkelighetstilstander i prompten + Sol-sjekk + skjermbilder i
full enhetsoppløsning begge temaer + TestFlight.
**STOPP 4: eier tester på telefon.**

## Prosessendringer (gjelder alt videre arbeid)

1. Hver skjerm benchmarkes mot navngitte referanser + Babyoras
   virkelighetstilstander (lange navn, stale, RM, lav lysstyrke).
2. Dommerpaneler får smaks-lane med referansebilder i prompten.
3. Mocks vurderes i full enhetsoppløsning før eier ser dem.
4. Ambisiøs variant først; doktrinen redigerer etterpå.
5. Billedarbeid aldri uten låst art bible; batcher gates med menneskelig
   art direction-sjekk.
6. «Dyrt» for Babyora = proprietært (ingen generisk AI-baby/standard-
   ikoner), felles fysikk (lys/kamera/material/skala/skygge), ingenting
   tilfeldig, omsorg og presisjon samtidig, og produktet blir STILLE
   etter at det har levert verdien.
