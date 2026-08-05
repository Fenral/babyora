# Modell B — «Gratis sikkerhetskjerne» (Public Safety Utility + betalt bekvemmelighetslag)

> Fase 6 — Challenge the Business. Advokatur for Modell B til EIERPORTEN. Alle tall uten kilde er merket **[hypotese]**; Nørs-tall er **[leverandørpåstand]** per Nørs-korreksjonen i 05-revisjonen. Ingenting her er et forhåndsvalg — dokumentet skal gjøre eiers valg reelt, inkludert valget om å forkaste modellen.

## 1. Modellen i én setning

Alt som kreves for **én trygg påkledningsbeslutning når forelderen spør, er permanent gratis** — det som selges er at appen **kommer til deg, husker for deg, kjenner skuffen din, ser fremover og dekker flere hender**. Gratiskjernen er ikke veldedighet og ikke lead-magnet: den er **distribusjonskostnaden som kjøper den eneste kanalen hard paywall diskvalifiserer** (helsestasjonskanalen, jf. Nørs-casen i `appendix/fase4/distribusjon-installasjon.md` §1.1) og drivstoffet i den billigste sterke loopen (delt kort utenfor paywall, Partiful-modellen).

## 2. Operasjonelt gratis beslutningsminimum (05-revisjonens krav nr. 3, besvart)

05-revisjonen er eksplisitt: en hard block uten den konkrete anbefalingen kan være juridisk gratis men praktisk ubrukelig — **er den nummererte plagglisten nødvendig for trygg handling, ER listen del av gratislaget.** Modell B biter i det sure eplet fullt ut, og definerer grensen med en testbar regel:

**Amputasjonstesten (bindende grenseregel):** *Fjern betalingslaget fullstendig. Kan enhver forelder, i enhver situasjon appen hevder å dekke, fortsatt ta en trygg påkledningsbeslutning — uten kompensasjonsatferd, degradert informasjon eller nag? Hvis nei, er grensen feil trukket, og funksjonen flyttes til gratislaget.* Testen kjøres av fagpanelet i premiss 4/5-blindtesten mot hele scenariokorpuset, med nulltoleranse for scenarier der trygg handling forutsetter betalt funksjon.

**Gratis for alltid (beslutningsminimum):**
1. **Full, konkret plaggliste** for *nå, her, dette barnet* — ikke et sammendrag, ikke «3 av 5 plagg». Anbefalingen ER sikkerhetsbærende (05 §3 pkt. 4), altså gratis.
2. **Alle hard/soft blocks, TOG-grenser, nyfødt-tidsgrenser, ut-av-scope-deteksjon** (sykdom/feber/prematuritet-gate) — rendres alltid, også i utløpt og offline tilstand.
3. **Farevarsel-anatomien** (handling → konsekvens → gyldighetsperiode, MET/Yr-konvensjonen) på hvert sikkerhetsutsagn.
4. **Gyldighetsvindu på hvert svar** (B12) — et svar uten utløp er en sikkerhetsfeil, ikke en premiumfunksjon.
5. **Generiske substitusjonsregler** («har ikke ullbody → to lag bomull + sjekk oftere»): når anbefalingen peker på et plagg husholdningen kan mangle, er den generiske utveien sikkerhetsnødvendig og dermed gratis. (Den *personlige garderoben* er betalt — se §4.)
6. **Sikkerhetskritiske værvarsler** (ekstremkulde/farevarsel-klasse): et reelt farlig omslag varsles gratis. Komfort-delta («to grader kaldere — mellomlag») er betalt.
7. **Mottak av delt kort + enkeltdeling** (B4): kortet ligger utenfor paywallen — ellers dør loopen ved mottakerens første klikk (hardt krav fra fase 4).
8. **Egne data ut**: historikk-eksport er gratis selv om historikk-*funksjonen* er betalt. Dine observasjoner om ditt barn holdes aldri som gissel.

Denne definisjonen løser Nørs-korreksjonens presisjon: konklusjonen var aldri «kommersiell modell er umulig», men «sikkerhetsminimum kan ikke ligge bak betaling hvis helsestasjonen skal anbefale». Modell B er den eneste av modellene som kan stå i helsestasjonens venterom uten å rødme.

## 3. Entitlement-matrisen (fase 6-portmateriale, krevd i 05-revisjonen)

| Tilstand | Sikkerhetskjerne (pkt. 1–8 over) | Bekvemmelighetslag |
| --- | --- | --- |
| **Gratis** | Full | Synlig men låst; aldri på svarflaten |
| **Evaluering** | Full | Full (se prøvetid §7) — ingen kortinnhenting |
| **Betalt** | Full | Full |
| **Utløpt** | Full — faller til gratis, aldri under; exit feires («dere kan dette nå»), historikk lesbar + eksporterbar | Låst; ingen nag på svarflaten |
| **Offline** | Siste svar vises med tydelig tidsstempel og gyldighetsvindu; utløpt råd merkes ugyldig — aldri stille servert (stale-safe-kontrakten fra 05 pkt. 6) | Varsler/planlegging pauses ærlig |
| **Utdatert (gamle værdata)** | Rådet degraderes eksplisitt til «hent nytt» — et utdatert grønt er farligere enn ingenting | Delta-varsler undertrykkes |

Bindende invariant: **ingen tilstand i matrisen viser en gratisbruker dårligere sikkerhetsinformasjon enn en betalende.** Dette auditeres per release (suksesskriterium 7).

## 4. Hva selges da? Betalingslaget konkret

Fem salgbare ting, ingen av dem sikkerhet:

1. **Appen kommer til deg** — delta-varsler («to grader kaldere enn i går — legg til mellomlaget»), widget/hjemkort, Live Activity etter planlagt tur. Pull er gratis; push er betalt. (H3-innholdet som modus, ikke som egen modell.)
2. **Appen husker for deg** — historikk, varm/kald-feedback-logg («dette funket sist ved −4 og vind»), mønstre per barn.
3. **Appen kjenner skuffen din** — garderobematching: anbefaling mappet til *dine faktiske plagg*, personlige substitusjoner, «vokst ut av»-flagg. (Generisk substitusjon forblir gratis, jf. §2 pkt. 5.)
4. **Appen ser fremover** — planlegging, morgendagen, pakkelister (B11-pakkejobben), «Starter snart».
5. **Appen dekker flere hender** — vedvarende koordinering: partner/besteforelder med eget oppdatert bilde, handoff-status. (Enkeltkortet er gratis; den *stående* koordineringen er betalt. «Familie» markedsføres ikke før 20–25 %-terskelen per kvalifisert handoff er målt — premiss 9 respekteres.)

## 5. Kannibaliseringsspørsmålet — det ærlige svaret

**Ja, gratiskjernen kannibaliserer betalingsviljen. Delvis er det designet; delvis er det modellens største svakhet, og den skal ikke pyntes på.**

- Den som får hele det trygge svaret gratis ved å åpne appen, har et rasjonelt motargument mot hver premiumfunksjon: *«jeg kan jo bare åpne appen.»* Avstanden mellom gratis pull og betalt push er reell, men *opplevd* liten. Freemium-benchmark: ~2,1 % download-to-paid median (RevenueCat, `abonnement-etikk.md` §1) mot ~10,7 % for hard paywall — Modell B må budsjettere med **konvertering i 2–4 %-sjiktet [hypotese]**, ikke tosifret.
- **Regnestykket som gjør det bevisst:** hard paywall gir ~5× konverteringsraten men diskvalifiserer kanalen som når ~85 % av førstegangsfødende **[leverandørpåstand, Nørs]**, dreper lenke-loopen og gir tillitsstraff i en helsenær kategori (soft paywall rapporteres å gi 2–3× flere *totale* abonnenter i helse/omsorg). Modell B bytter rate mot rekkevidde × tillit. Det er et veddemål, ikke et faktum — og det kan tapes.
- **Hva som IKKE kan selges senere:** grensen er en enveisdør. Flyttes plagglisten bak betaling etter lansering i kanalen, er det nøyaktig «snikinnføring av betaling»-kritikken Rådet for sykepleieetikk retter mot Nørs+. Eier må vite at valget av B låser gratisnivået permanent.
- **Worst case, sagt høyt:** hvis både konverteringen (<1,5 %) og kommunekanalen (ingen pilot) svikter, er Modell B et offentlig gode uten forretning. Da finnes tre exiter: (a) ren kommunal finansiering (§6.2), (b) fusjon mot Modell H1s sesongpass-logikk med gratiskjernen som juridisk/etisk gulv, (c) avvikling av kommersiell ambisjon og protokollen doneres. Kill-kriteriene i suksesskriteriene er skrevet for å oppdage dette tidlig, ikke for å skjule det.

Motstykket: **det som er igjen å selge er tid, hukommelse og koordinering i den mest tidsfattige livsfasen som finnes.** Yr-presedensen peker begge veier — gratis autoritet dreper ikke betalingsvilje for bedre *leveranse* av samme data (folk betaler for værapper oppå gratis Yr), men den setter taket lavt. Modell B priser deretter (§7): lavt, løpende, ærlig.

## 6. Helsestasjonskompatibilitet — forutsetninger, ikke pynt

Kanalens gate er **faglig avsender, ikke UX-kvalitet** (Stavanger-funnet: kun offentlige/ideelle kilder anbefales). Tre forutsetninger må stå FØR kanalen kan røres:

1. **Faglig signatur (hard forutsetning):** Premiss 4/5 er ÅPNE — tersklene «MÅ valideres av helsesøster», blindtest med nulltoleranse falsk grønn er allerede lanseringsblokker. For kanalen kreves mer: navngitt faglig ansvarlig/fagråd som signerer protokollen, revisjonsspor på hver terskel-endring. Uten dette er Modell B i kanalen bare en kommersiell app med gratis prislapp — og avvises.
2. **Governance-separasjon:** Sikkerhetsprotokollen (motorens regler, blocks, terskler) legges under et eget styringsregime med ekstern faglig representasjon og endringskontroll, **isolert fra kommersielle KPI-er**. Ingen konverteringsmåling, ingen oppsalgsflater, ingen vekst-eksperimenter på sikkerhetskjernens flater. Protokollen dokumenteres åpent («Public Safety Utility»-sporet fra Sols runde 4) slik at den i prinsippet er etterprøvbar og overlevbar uavhengig av selskapet.
3. **Merkevareseparasjon:** Kanal-distribuert modus er en egen innpakning (arbeidstittel: sikkerhetskjernen under institusjonsnært navn) **uten premium-CTA i kanal-attribuert installasjon**. Den kommersielle appen deler motor men ikke flate. Ærlig innrømmelse: separasjonen *reduserer* snikinnførings-kritikken, den *eliminerer* den ikke — Nørs+ kritiseres selv med gratis kjerne. Restrisikoen står i etikkinnvending 2.

### 6.2 Kommunal finansieringsvariant (undermodell)

Nørs-presedensen: kommunen betaler (~5 kr/mnd per aktiv bruker, tak 750–7 500 kr **[leverandørpåstand]**), gratis for forelderen, helsestasjonen publiserer eget innhold. For Babyora:

- **Form:** kommunen kjøper kanal-modusen (sikkerhetskjerne + ev. lokalt helsestasjonsinnhold) per aktiv bruker med tak. Forbrukerpremium består *utenfor* kanalflaten.
- **Ærlig økonomi [hypotese]:** selv 50 kommuner på Nørs-lignende tak gir lav årsinntekt (størrelsesorden hundretusener, ikke millioner); kommunale salgssykluser er lange (12–18 mnd [hypotese]) og anskaffelsesregler gjelder. Puls-produktets sesongsøvn kollapser «aktiv bruker»-prising om sommeren — som faktisk er *ærlig* prising, men gjør inntekten sesongvolatil. **Undermodellen er en vollgrav og distribusjonsmotor, ikke en finansieringsplan for utvikling de første to årene.**
- **Ny risiko undermodellen innfører:** betalende kommune får kundemakt over et sikkerhetsprodukt (feature-capture). Motmiddel: governance-separasjonen i pkt. 2 — kommunekontrakten kan kjøpe innhold og rekkevidde, aldri terskler.

## 7. Prising, prøvetid og paywall-øyeblikk

- **Prislogikk [hypotese, testes i premiss 7-eksperimentet med innramminger, ikke bare punkter]:** Komfortlaget som **lavpriset løpende abonnement 29–39 kr/mnd** — auto-fornyelse er ærlig her fordi verdien (varsler/widget/minne) leveres kontinuerlig (abonnement-etikk §7, H3-raden). Alternativ innramming: **ikke-fornyende sesongpass 149–199 kr [hypotese]** for planleggingstunge husholdninger. **Aldri årsplan** mot kjent 4–6 mnd behov (forbudsliste pkt. 6). **Dvale-mekanisme:** når bruken sesongsover, tilbyr appen proaktivt pause — inntekt fra glemt sommerabonnement er inntekt fra glemsel, og oppfyller samtidig digitalytelseslovens aktiv-avtale-varsling by design.
- **Prøvetid:** ingen StoreKit-trial. **Gratis evalueringsperiode av komfortlaget** (reverse-trial-form): full tilgang uten kortinnhenting til brukeren har opplevd **to relevante situasjoner (min. ett værskifte + én verifisert tur), senest 14 dager** — 05-revisjonens trial-korreksjon fulgt bokstavelig. Sikkerhetskjernen trenger ingen prøvetid; den er permanent.
- **Paywall-øyeblikk:** **aldri på svarflaten** — svarflaten er permanent paywall-fri grunn. Første betalingsforespørsel kommer på en komfortflate *etter* første verifiserte komfortøyeblikk (f.eks. brukeren har handlet på ≥1 delta-varsel eller brukt garderobematch ≥2 ganger i evalueringen). Dette er forenlig med A26 (paywall etter verifikasjonsøyeblikk) og RevenueCat-funnet om at sene konverterere retainer bedre.

## 8. Forhold til H1/H2/H3 og de andre modellene

Modell B er **ortogonal til inngangsjobb-hypotesene**: den er en betalingsarkitektur, ikke en produktform. H2-routerens fire innganger kjører hele på gratiskjernen; H3s delta blir komfortlagets kjerneleveranse (med gratis farevarsel-gulv); H1s sesongfortelling kan leve som sesongpass-innramming av komfortlaget med graduation som feiret exit. Det gjør B kombinerbar — men også anklagbar for å være «alle modellers minste felles multiplum». Svaret: B er den eneste modellen som samtidig overlever (a) helsestasjonens gratisprinsipp, (b) lenke-loopens krav om kort utenfor paywall, og (c) forbudslistens pkt. 7. De andre modellene må kjøpe seg disse egenskapene med unntak; B har dem strukturelt.

## 9. Til eierporten — valget som faktisk står

Velger eier B, velges: permanent fraskrivelse av å prise selve svaret (enveisdør), lav konverteringsrate mot bred rekkevidde, faglig signatur som kritisk avhengighet utenfor egen kontroll, og en forretning som først bærer seg ved volum. Velger eier bort B, må den valgte modellen eksplisitt svare på hvordan den passerer amputasjonstesten uten gratiskjerne — for 05-revisjonens grenseregel («er plagglisten nødvendig for trygg handling, er den gratis») gjelder *alle* modeller, ikke bare denne. Det er Modell Bs sterkeste kort og ærligste innrømmelse på én gang: **B er i stor grad det etikk-mandatet uansett tvinger frem — spørsmålet eier faktisk avgjør, er om resten skal selges som bekvemmelighet (B), som sesong (H1-sporet) eller ikke i det hele tatt (ren kommunal finansiering).**

## MODELLKORT
MODELL B — GRATIS SIKKERHETSKJERNE (Public Safety Utility + komfortlag) · **Verdihypotese:** trygg påkledningsbeslutning er gratis infrastruktur; det som selges er tid/hukommelse/koordinering — appen kommer til deg (varsler/widget), husker for deg (historikk), kjenner skuffen din (garderobe), ser fremover (planlegging/pakking), dekker flere hender (koordinering). Gratiskjernen kjøper helsestasjonskanalen og lenke-loopen. · **Gratisnivå (permanent):** full konkret plaggliste nå/her/dette barnet, alle hard/soft blocks + TOG + ut-av-scope-gate, farevarsel-anatomi, gyldighetsvindu, generisk substitusjon, sikkerhetskritiske værvarsler, mottak+enkeltdeling av kort (B4), dataeksport; grensen håndheves av amputasjonstesten (fjern betalingslaget — trygg handling må fortsatt være mulig i 100 % av scenariokorpuset). · **Premium:** delta-varsler/widget/Live Activity, historikk+varm/kald-logg, garderobematching, planlegging/pakkelister, stående koordinering (enkeltkort forblir gratis). · **Prøvetid:** gratis evalueringsperiode av komfortlaget (reverse-trial-form, ingen kortinnhenting): to relevante situasjoner — min. ett værskifte + én verifisert tur — senest 14 dager; ikke StoreKit-trial. · **Paywall-øyeblikk:** aldri på svarflaten (permanent paywall-fri); første forespørsel på komfortflate etter første verifiserte komfortøyeblikk (handlet på ≥1 delta-varsel eller ≥2 garderobematch). · **Prislogikk [hypotese]:** lavpriset løpende 29–39 kr/mnd (ærlig auto-fornyelse: kontinuerlig leveranse) + ikke-fornyende sesongpass 149–199 kr som alternativ innramming; aldri årsplan mot 4–6 mnd behov; proaktiv sommerdvale/pause; undermodell: kommunal per-aktiv-bruker-lisens à la Nørs (~5 kr/mnd, tak [leverandørpåstand]) for upsell-fri kanalmodus — vollgrav/distribusjon, ikke primærfinansiering. · **Familieplan:** Apple/Google familiedeling aktiveres (gratis, null arkitektur); ingen egen multi-seat-plan før 20–25 %-handoff-terskelen er målt (premiss 9). · **Retention:** premium bæres av varsler/widget (push-laget er retention-mekanismen; 3x-påstand er leverandørtall) + sesong-gjenkjøp; gratiskjernen sesongsover ærlig; redusert bruk kan bety mestring og straffes aldri. · **Churn-risiko:** «jeg kan jo bare åpne gratisappen» (tynt opplevd premium-delta → konvertering 2–4 % [hypotese], freemium-median ~2,1 %), graduation (designet utfall), sesongsøvn (møtes med dvale, ikke glemselsinntekt), kommunekontrakt-tap, og enveisdøren: gratisnivået kan aldri senkes uten å utløse snikinnførings-kritikken.

## ETISKE INNVENDINGER
- Gratis skala uten validert motor er den største etiske eksponeringen, ikke en dyd: å gi et autoritativt sikkerhetssvar gratis til '85 % av førstegangsfødende' multipliserer rekkevidden av enhver feil mens premiss 4/5 fortsatt er ÅPNE. Adressering: faglig blindtest med nulltoleranse falsk grønn forblir hard lanseringsblokker, og kanaldistribusjon gates i tillegg på faglig signatur — gratis fritar ikke fra bevisbyrden, det skjerper den.
- Merkevareseparasjonen kan bli hvitvasking: hvis den institusjonelle gratisflaten i praksis trakter brukere til den kommersielle appen, er det nøyaktig 'snikinnføring av betaling'-kritikken Rådet for sykepleieetikk retter mot Nørs+. Adressering: kanal-attribuert installasjon får null premium-CTA, governance med ekstern faglig representasjon, åpen protokolldokumentasjon. Innrømmelse: dette reduserer kritikken men eliminerer den ikke — Nørs kritiseres tross gratis kjerne; restrisikoen står.
- Grensen mellom sikkerhet og bekvemmelighet vil skli under kommersielt press (boundary creep): delta-varselet en iskald morgen ER sikkerhetsnært, og fristelsen til å flytte funksjoner fra gratis til betalt vokser med dårlige konverteringstall. Adressering: amputasjonstesten gjøres bindende og re-kjøres av fagpanel per release; sikkerhetskritiske værvarsler (farevarsel-klasse) ligger eksplisitt i gratislaget; gratisnivået erklæres som enveisdør ved eierporten. Innrømmelse: gråsonen er reell og kan ikke defineres bort, bare revideres åpent.
- Betalt bekvemmelighet kan selv være trygghetsskjevt: tidsfattige lavinntektshusholdninger får svaret, men ikke påminnelsene, minnet og koordineringen — de som trenger avlastningen mest har minst råd til den. Adressering: alt beslutningsnødvendig inkl. reelle farevarsler er gratis, og det som gjenstår bak betaling er tid/komfort, ikke risiko. Innrømmelse: skjevheten i komfort består — modellen hevder ikke å fjerne den, bare å aldri la den berøre sikkerhet.
- Lav betalingsvilje presser mot engasjementsmekanikk for å rettferdiggjøre premium (streaks, skyld, nudging) — målgruppen er i skyld-overskudd og redusert bruk kan bety mestring. Adressering: 7-punkts forbudslisten er bindende, gamification er REJECT i fase 4, og suksesskriteriene måler tillit/korrekt handling, ikke engasjement; dvale tilbys proaktivt i stedet for å melke sesongsøvn.
- Kommunal betaler gir kundemakt over et sikkerhetsprodukt: kommunen som kjøper kan ønske innflytelse over innhold og prioriteringer (feature capture). Adressering: kommunekontrakten kan kjøpe rekkevidde og lokalt innhold, aldri terskler — protokoll-governance er kontraktuelt adskilt fra kommersielle avtaler. Innrømmelse: separasjonen er papir til den er prøvd i en reell forhandling.
- Modellen kan ende som offentlig gode uten forretning — og å late som noe annet ville brutt lab'ens eget ærlighetsmandat: svikter både konvertering (<1,5 %) og kommunekanal, finnes ingen bærekraft. Adressering: dette sies eksplisitt til eierporten med tre navngitte exiter (ren kommunal finansiering, fusjon med sesongpass-sporet, donasjon av protokollen), og kill-kriteriene er designet for å oppdage utfallet tidlig — ikke for å skjule det.

## SUKSESSKRITERIER
- Amputasjonstesten bestått: fagpanel (≥2 fagpersoner, samme korpus som premiss 4/5-blindtesten) bekrefter at gratislaget alene muliggjør trygg handling i 100 % av scenariokorpuset, nulltoleranse falsk grønn. FALSIFISERT hvis ett scenario krever betalt funksjon for trygg handling → grensen omtrekkes før noe annet fortsetter.
- Konvertering til komfortlaget ≥3 % av aktive gratisbrukere innen 60 dager etter endt evalueringsperiode [hypotese-benchmark: freemium-median ~2,1 %, RevenueCat]. FALSIFISERT ved <1,5 % etter at begge prisinnramminger (løpende + sesongpass) er testet i premiss 7-eksperimentet → komfortlaget er for tynt; modellen dør som forbrukerfreemium og faller tilbake til kommunal-only eller fusjon med sesongpass-sporet.
- Premium-verdi er flerbent: ≥40 % av betalende bruker ≥2 distinkte komfortfunksjoner ukentlig i sesong. FALSIFISERT ved <20 % → vi selger i realiteten én funksjon (trolig varsler); ompakking eller nedprising kreves.
- Kanalbevis: minst én kommune-/bydelspilot med signert faglig ansvarlig og upsell-fri kanalmodus etablert før fase 13-lansering. FALSIFISERT hvis faglig signatur ikke kan sikres → kommunal undermodell parkeres og Modell B må forsvares på forbrukerfreemium alene (svakere kort, sies åpent ved porten).
- Loop-bevis: delt kort brukes i ≥20–25 % per kvalifisert handoff (fase 3-terskelen, premiss 9). FALSIFISERT under terskelen → gratiskjernen kjøper ikke distribusjonen som rettferdiggjør den, og modellens hovedregnestykke (rate byttet mot rekkevidde) må regnes om.
- Ærlig churn-profil: ufrivillig fornyelses-churn ≈0 (dvale-tilbud + ikke-fornyende design), måldifferensiert frafall per årsak (læring/stabilt vær/paywall/UX) — og graduation-exit telles som suksess, ikke churn. FALSIFISERT hvis >10 % av inntekten [hypotese-terskel] viser seg å komme fra abonnenter uten aktivitet siste 60 dager i sesong → vi tjener på glemsel og bryter eget mandat; dvale gjøres da automatisk i stedet for tilbudt.
- Null sikkerhetsregresjon i entitlement-matrisen: release-audit viser 0 tilstander (gratis/evaluering/betalt/utløpt/offline/utdatert) der en gratisbruker møter dårligere sikkerhetsinformasjon enn en betalende, og 0 paywall-elementer på svarflaten. FALSIFISERT ved ett funn → release blokkeres; to funn på rad → grensedragningen re-forhandles med fagpanel.
- Nullmodell-porten (arves fra fase 3 og gjelder også B): gratiskjernen må slå ni-ords-regelen + Yr målbart på beslutningstid, forståelse eller korrekt håndtering i prototypetesten. FALSIFISERT hvis ikke → ingen forretningsmodell redder et produkt uten produktfortrinn; B faller sammen med de andre.