# Mobbin-research: Familieprofiler, deling og handoff (fase 5-delområde)

> Bygger videre på 05-global-design-research.md-vedtaket «Apple/Google familiedeling: ADOPT» (linje 47) og Nørs-funnet om at en tredjedel av partnerne er aktive brukere. Kobles mot handoff-kortet B4 og matrisens blanke partner-/besteforelder-/episodisk-rader. Alle skjermer under er SETT som bilder, ikke lest fra metadata.

## Mønster 1 — Barnet er et objekt, ikke en konto (flerbarn/profilbytte)

De relevante familieappene behandler barnet som et *administrert objekt under forelderens konto*, aldri som egen identitet med innloggingsvegg:

- [Greenlight «Family»](https://mobbin.com/screens/5a8be526-2a1c-4402-9666-fec75183726b) deler eksplisitt i to seksjoner: **Adults** (med «Add a parent») og **Kids** (med alder som primærmetadata: «Age 15»). Voksne er kontoer, barn er kort.
- [Acorns](https://mobbin.com/screens/96c15ebb-251f-4261-b474-b4cf3c74d36a) bytter mellom «You | Kid» som en **liten dropdown i toppen av headeren** — ikke en fullskjerms profilvegg — pluss «Add another kid» som inline-rad i innholdet.
- [Kit](https://mobbin.com/screens/ade862dc-3a68-429f-80be-595e4215442c) løser flerbarn som **filter**: en «All kids (1)»-dropdown over varsellisten. Bytte er en visningsavgrensning, ikke et kontekstskifte.
- [Spotify Kids «Who's listening?»](https://mobbin.com/screens/cb418d1c-f0d3-47d3-909e-983b89c22029) og [Duolingo ABC «Who's Learning?»](https://mobbin.com/screens/9d952a8b-7e1e-43a5-b034-041e84f78c49) bruker riktignok velgervegg, men merk detaljen: «Grown-ups»-utgang i hjørnet — forelderen administrerer, barnet konsumerer. [Hatch Sleep](https://mobbin.com/screens/27bfdf5e-4949-4f86-a4be-83a3e53f12c3) lister enheter/barn som enkle rader med «Add a Hatch Product».

**Ekkokammer-varsel:** profilbytte-søket ble dominert av streaming ([Netflix](https://mobbin.com/screens/85de8025-3cf2-4bfa-a85f-55c830ff15ea), Disney+, Hulu, Paramount+, Peacock, HBO Max) — «Who's watching»-veggen er den mest tilgjengelige referansen på Mobbin, men den løser identitetsvalg for *seere*, ikke flerbarnsfilter for *én omsorgsperson*. Dedikerte babyapper (Huckleberry, Napper, Baby Tracker) dukket ikke opp i treffene i det hele tatt.

## Mønster 2 — Partner-paring i helsenære apper: kode, samtykke, synlighetskontrakt

Direkte bevismateriale for matrisens blanke partner-rad:

- [Flo «Linking a partner»](https://mobbin.com/flows/0eec4d57-5aee-4176-a5a3-b59b61ddbc5a) (10 skjermer): 3-stegs INVITE → PAIR → SHARE med paringskode («VZMMFW») via native share sheet. Viktigst: en hel skjerm **«What your partner can see»** som viser mottakerens view-only-flate FØR paring, og «Notifications at key moments» — partneren får varsler ved faseendringer uten å måtte åpne appen.
- [Clue Connect](https://mobbin.com/flows/a1663af5-6362-41aa-be38-006ab66cf903): eksplisitt **samtykke-checkbox** («I agree to sharing my cycle data…»), kodebasert paring («have a code»-felt for mottakersiden), og en «Your connection»-skjerm med **«Remove connection» alltid synlig** — reversibilitet som førsteklasses funksjon.
- [Fi «Adding a people»](https://mobbin.com/flows/fdae3c0b-c489-45ce-9f30-be753ad4bddd): innrammingen er gull for Babyora — **«Cat care is a team effort. Give full access to people you trust»** over et bilde av husholdningen, invitasjon via telefonnummer (ikke e-post/konto), og en stille grønn «Invite sent»-bekreftelse. Omsorg som lagarbeid, ikke administrasjon.
- [Alan «Inviting a user»](https://mobbin.com/flows/1a1edfa6-6c51-4b11-9b6b-3e47016e463a): «My family»-seksjon med per-medlem status («Teletransmission: Setting up») og ærlig default-deklarasjon: **«By default, Sam will have access to all the data in your account»** + hvor man justerer det.

## Mønster 3 — Rettighetsforklaring FØR invitasjonen sendes

- [GoHenry «Add a co-parent»](https://mobbin.com/flows/9c220962-6d1f-43d7-91af-561e21c5f502): skjermen **«Here's the lowdown»** lister punktvis hva en co-parent kan gjøre («everything you can do, except adding or removing a payment card») med ikonografert rettighetsliste og samtykke-checkbox som låser opp CTA-en. Rollen er definert før relasjonen opprettes.
- [Character AI «Parental insights»](https://mobbin.com/flows/8205b174-8ad0-4ad5-acdd-a563b48fccc8): motsatt retning (barn deler til forelder), men prinsippet er rent: **aggregat deles, innhold forblir privat** («weekly stats… your chat content will stay private»). Minste meningsfulle datamengde.
- [Amazon Family «Sharing»](https://mobbin.com/flows/f3fd8316-35c3-4af4-95e9-c67a452ceb7a): deling per *program* (Prime Video ja, Pharmacy nei) — granulær, tjeneste-for-tjeneste-modell med Adults/Children-skille per program.

## Mønster 4 — Deling uten mottakerkonto (B4s kjernepremiss)

- [lululemon «Share a list»](https://mobbin.com/flows/735a9176-d0d8-4d84-88df-f02df1394ef4) er den viktigste enkeltreferansen: share-arket sier ordrett **«Help them get it right by sharing your list. They don't even need an account!»** med to kanaler — «Send Link» og «Scan to Share» (QR for fysisk samtidighet, f.eks. i døra når barnevakten kommer). Kontofrihet brukes som eksplisitt salgsargument.
- [Mozi «Share my plans»](https://mobbin.com/flows/2b80649d-9094-4325-84c3-5b773bd0c530): **«Preview»-steg før deling** — avsenderen ser nøyaktig hva mottakeren vil se, pluss ærlig deklarasjon av hva som eksponeres («including your phone number»); lenken går til web (share.mozi.app), null mottakerkrav.
- [Google Maps «Sharing a list»](https://mobbin.com/flows/a9e6ee32-f145-4883-83cf-c6f0dabdfe88): skiller **«Invite collaborators»** (redigering, krever konto) fra ren lenkedeling (lesing, krever ingenting) — to ambisjonsnivåer i samme flate.
- [AllTrails](https://mobbin.com/flows/65b7d44f-97c8-4e7f-bbb5-afcdd6c29231): personvernnivå per liste (Public/Followers/Only me) valgt i deleøyeblikket, med «Link Copied»-toast som kvittering.
- Delbare **bildekort** som mottakeren kan lese uten noe som helst: [Strava «Month in Sport»](https://mobbin.com/screens/3c96c039-8f09-4101-8fe1-c24716b83638) (kortet ER innholdet — datoer + nøkkeltall i merkevareramme), [Gentler Streak](https://mobbin.com/screens/845111bc-c398-4136-9a1e-4578b9eb1d38) (ukesoppsummering med valgfritt eget foto), [Slopes](https://mobbin.com/screens/0332e3fd-e522-4239-a236-79b4f44f9ccf) («Made with Slopes»-attribusjon i hjørnet), [Beli](https://mobbin.com/screens/b486127e-a01f-4659-9abb-74b16f1f69b5) og [Co-Star](https://mobbin.com/screens/8f014a25-7779-43d4-9dc6-900bf25dae41) (ren tekst som delbart objekt via standard iOS-ark).

## Mønster 5 — Mottakersiden: aksept må selge verdi til mottakeren

- [Instacart «Joining a family account»](https://mobbin.com/flows/932de9ff-2305-43c7-8d43-ca3e489bda63): invitasjonsskjermen («Sam invited you to join their family account») argumenterer i **mottakerens** interesse med tre ikonpunkter — inkludert «Still shop by yourself anytime» som adresserer autonomifrykten direkte. Accept/Decline likestilt.
- [Google Photos «Accepting a partner sharing invitation»](https://mobbin.com/flows/caad8725-5367-41d2-a0af-ca2c4a15bdb2): etter aksept kommer et **gjensidighetssteg** — «Share back with Sam» — deling som toveisrelasjon, ikke enveis eksport. Pluss «Turn on auto save»-regler på mottakersiden.
- [Abode «Joining an Abode»](https://mobbin.com/flows/844af9dc-5327-4704-89f0-4d230768b828): kort invitasjonskode («O2VL-U83P») med forhåndsvisning av hva man er i ferd med å bli med i («You're about to join Crunchy Coven») før bekreftelse.

## Mønster 6 — Gradert og tidsavgrenset synlighet (Life360)

- [Life360 «Location Sharing»](https://mobbin.com/screens/5297fccc-63d4-4d74-9aae-db283706acda): per-medlem-toggle for egen deling + «Circle status»-liste over hvem som deler.
- [Life360 «Active Bubble»](https://mobbin.com/screens/284df88a-d685-4f88-9c67-8423ff7020ca): det mest overførbare enkeltmønsteret — **deling med innebygd utløp** («Your Bubble will pop at 6:40 pm»), redusert presisjon med sikkerhetsfunksjoner intakt. Deling er en tilstand med sluttidspunkt, ikke en evig relasjon.
- [Life360 «Place Alerts»](https://mobbin.com/screens/9b82770d-1c48-4746-bd1d-544bb544c86b): hendelsesvarsler («Sarah arrived at home») som beroligelseskanal uten at noen må åpne appen — og [«Add a new Member»](https://mobbin.com/screens/c521bafc-eca1-4e64-ae6a-903bc12d9a2a) som inline-rad i People-listen.

## Hull i referansebasen (ærlighetsnotat)

To målrettede søk bommet: barnevakt-/pet-sitter-instruksjoner ga kun leveringsinstruksjoner (Uber Eats/Shake Shack), og barnehage-dagsrapport ga generiske selvloggingsapper — Brightwheel-/Famly-klassen finnes ikke i Mobbin-utvalget. **Den nærmeste analogien til B4 (strukturert omsorgs-handoff til episodisk aktør) eksisterer ikke i referansebasen.** Det betyr at B4 må prototypetestes, ikke lånes — og at ethvert «alle gjør det slik»-argument for handoff-design vil være bygget på tilstøtende domener (helse-paring, listedeling, lokasjonssirkler), ikke på faktiske forgjengere.


## OVERFØRBARE PRINSIPPER
- P1 — Barnet er objekt, ikke konto; flerbarnsbytte er et filter, ikke et identitetsskifte (Kit «All kids»-dropdown, Acorns You/Kid-header, Greenlight Adults/Kids-skille). For H1/H2 betyr det: aldri profilvegg foran beslutningsøyeblikket — bytte skjer i header/filter uten å forlate flaten. Beskytter beslutningstiden H2 måles på.
- P2 — Kontofri mottak er etablert konvensjon og kan brukes som salgsargument (lululemon: «They don't even need an account!» + QR; Mozi web-lenke; Google Maps lenke vs. collaborator). B4-handoff-kortet bygges som native share av bilde/web-kort med null mottakerkrav — betjener matrisens blanke partner-/episodisk-rader med null arkitektur, i tråd med ADOPT-vedtaket om plattformdeling.
- P3 — Synlighetskontrakt før relasjon: vis avsenderen nøyaktig hva mottakeren får se, FØR noe sendes (Flo «What your partner can see», Mozi Preview-steg, GoHenry «Here's the lowdown», Alan default-deklarasjon). For H2-inngangen «Noen andre skal passe barnet»: én skjerm som viser selve kortet slik barnevakten ser det, er både tillitsbærer og forventningsstyring.
- P4 — Deling med innebygd utløp: Life360 Bubble («pops at 6:40 pm») viser at tidsavgrenset synlighet er et forståelig mønster. Kobler direkte til B12 (gyldighetsvindu): handoff-kortet bør bære «gjelder til kl. X / til været endrer seg» i stedet for evig tilgang — og H1s sesongavgrensning får en mikro-parallell i hver enkelt deling.
- P5 — Push er mottakerens primærflate, appen er sekundær (Flo «Notifications at key moments», Life360 Place Alerts, Fi lokasjonsvarsel): partneren kan få verdi uten eget oppsett. Dette er H3s delta-modell anvendt på partner-raden — delta-varsler («to grader kaldere, legg til mellomlag») kan distribueres til medomsorgsperson uten at vedkommende installerer noe.
- P6 — Aksept-skjermen argumenterer i mottakerens interesse, inkludert autonomi-forsikring (Instacart «Still shop by yourself anytime», Abode forhåndsvisning før join). Hvis Babyora noen gang bygger full partner-paring, må invitasjonen selge verdi til partneren — ikke be om hjelp til primærforelderens system.
- P7 — Gjensidighetssteg etter mottak (Google Photos «Share back»): handoff er ikke enveis. B6 (etter-turen-mikrosjekk) kan være mottakerens returkanal — barnevakten melder «det gikk bra / hen frøs» tilbake, som samtidig gir motoren verifikasjonsdata. Kobler B4 og B6 til én sløyfe.
- P8 — Minste meningsfulle datamengde ved deling (Character AI: aggregat deles, innhold privat; Amazon: per-program-granularitet): handoff-kortet skal bære antrekk + gyldighet + én kontaktvei, ikke barnets fulle profil eller historikk.

## IKKE KOPIER
- «Who's watching»-fullskjerms profilvegg (Netflix/Disney+/Hulu/Paramount+): løser identitetsvalg for seere med hver sin smak, ikke flerbarnsfilter for én omsorgsperson — og legger et obligatorisk steg foran et tidskritisk påkledningsøyeblikk. Dette er også ekkokammer-fellen i utvalget: mønsteret er overrepresentert på Mobbin fordi streaming er overrepresentert, ikke fordi det passer domenet.
- Flos 3-stegs INVITE/PAIR/SHARE med krav om at partneren laster ned appen og taster kode før noen verdi leveres: motsatt av B4-premisset. Handoff-kortet skal gi verdi i første melding; paring kan eventuelt komme ETTER at verdien er demonstrert (progressiv forpliktelse), aldri som port.
- Life360s kontinuerlige tilstedeværelses-/lokasjonsovervåkning som relasjonsmodell: Babyora trenger tilstandsdeling per beslutning (dette antrekket, dette vinduet), ikke overvåkning av personer. Kun utløpsmekanikken (Bubble) og hendelsesvarslene er overførbare — ikke kartet, ikke sporingsrelasjonen.
- GoHenrys juridiske samtykke-checkbox-tone for episodiske aktører: riktig for en co-parent med betalingsrettigheter, altfor tung for en barnevakt som skal se ett kort i fire timer. Rettighetsforklaringen (P3) beholdes, kontraktsformen droppes for episodisk-raden.
- Instacarts konfetti-eksplosjon ved fullført familieinnmelding: kolliderer med lab'ens ærlighetslinje (jf. R1-kritikken av iscenesatt seremoni) — en fullført handoff er et hverdagsøyeblikk, ikke en feiring.
- Duolingo ABC/Spotify Kids-velgeren som modell for foreldresiden: disse veggene finnes fordi BARNET holder enheten og trenger enkel visuell identifikasjon. I Babyora holder forelderen enheten — premisset som rettferdiggjør mønsteret er fraværende.

## SØKELOGG
- screens «baby tracking app profile switcher with multiple child profiles» (ios, deep) — 10 treff, ~4 relevante (Greenlight, Acorns, Spotify Kids, Duolingo ABC); 6 streaming-treff = ekkokammer-signal
- flows «invite a partner or caregiver to share baby data in a baby tracking app» (ios) — 4 treff, 4 relevante (Fi, Clue, Alan, Flo)
- screens «shareable summary card with share sheet export as image» (ios, deep) — 10 treff, ~5 relevante (Strava, Beli, Gentler Streak, Slopes, Co-Star)
- flows «co-parenting app sharing schedule and child info with the other parent» (ios) — 4 treff, 3 relevante (GoHenry co-parent, Character AI parental insights, Amazon Family; Clue duplikat)
- screens «pet sitter or dog walker care instructions handoff screen» (ios, deep) — 5 treff, 0 relevante (kun leveringsinstruksjoner) — dokumentert hull
- screens «parenting app home screen with child name and age switcher in header» (ios, deep) — 8 treff, ~5 relevante (Greenlight, Acorns, Kit, Hatch Sleep, Tolan)
- flows «accepting an invitation to join a family group or shared space» (ios) — 4 treff, 4 relevante (Instacart ×2, Abode, Google Photos)
- screens «Life360 family circle members list with location sharing settings» (ios, deep) — 8 treff, 8 relevante (alle Life360)
- screens «daycare app daily report of child's day with feeding and nap summary for parents» (ios, deep) — 8 treff, ~1 svakt relevant (Fi søvntidslinje); barnehage-appklassen finnes ikke i Mobbin — dokumentert hull for B4
- flows «sharing a plan or list via text message link that recipient opens without an account» (ios) — 4 treff, 4 relevante (lululemon, AllTrails, Mozi, Google Maps)