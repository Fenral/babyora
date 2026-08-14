# SN-006 · Navnesjekk «Snudly» — GO/NO-GO-rapport

**Oppgave:** Kartlegge om navnet «Snudly» kan brukes kommersielt for norsk barnefamilie-app
(påkledningsråd basert på vær), på tvers av App Store, Google Play, domener, varemerker og
sosiale håndtak.

**Sjekkedato:** 2026-08-14 (Europe/Oslo).
**Metode:** Fem parallelle W1-søkere (App Store, Play, domener, varemerker, håndtak) med
autoritativ RDAP der mulig, HTTP-probing for håndtak, og Google-indeksering + tredjeparts-
speilinger for App Store/Play/varemerker der DB-er er CAPTCHA-beskyttet eller SPA-basert.
Alt uverifisert er merket USIKKER; ingen påstand skal leses som positiv bekreftelse uten
kildeoppslag i tabellen.
**Autoritetsrekkefølge for denne rapporten:** RDAP > direkte HTTP mot autoritativ side >
Google-indeksering. Der bare Google-indeksering finnes er dette merket i kildekolonnen.

---

## 1. Sammendrag og GO/NO-GO

**Konklusjon:** **GO med caveats.** Ingen absolutt blokkering funnet i noen av de fem
kategoriene, men lansering krever handling *før* App Store-innsending på tre områder:

1. **Sikre domenene** snudly.no, snudly.com, snudly.app (alle bekreftet ledige via RDAP
   2026-08-14).
2. **Sikre håndtakene** TikTok @snudly, GitHub org/snudly, og Instagram/YouTube «_app»-
   varianter (Instagram @snudly og YouTube @snudly er okkupert som tomme placeholder-
   kontoer — kan ikke tas uten Instagrams/YouTubes varemerkeprosess. Ingen synlig
   aktivitet observert utlogget, men eventuell konkurrerende virksomhet bak
   innloggingsvegg er ikke bekreftet fraværende).
3. **Bekrefte varemerkefravær** direkte i Patentstyret + EUIPO (min agent nådde ikke DB-ene
   direkte pga. CAPTCHA/SPA; alle «null treff»-utsagn hviler på Google-indeksering av
   tredjeparts-speilinger som Justia/Trademarkia). Anbefaler manuell sjekk før varemerke-
   filing, eller kjøpt clearance search (NOK 5 000–15 000, ikke bekreftet pris).

**Ingen absolutt NO-GO-funn:** Ingen app heter «Snudly» i App Store eller Play (bekreftet
via norsk Play-storefront som eksplisitt sa «Ingen resultater for snudly», 2026-08-14).
Ingen varemerkeregistrering for «Snudly» er funnet i indekserte kilder. Domener kritiske
for lansering (.no, .com, .app) er ledige.

**Absolutte usikkerheter (må lukkes før lansering, ikke før SN-006 godkjennes):**
- snudly.se, snudly.dk, snudly.eu ikke verifisert (RDAP-endepunkt nådde ikke fra kloneen).
- Direktesøk i Patentstyret/EUIPO/WIPO/USPTO ikke fullført (CAPTCHA/SPA).
- X @snudly, Facebook /snudly og /snudlyapp krever manuell innlogget verifisering.

Alle punktene ovenfor er dokumentert med kilde og dato i delrapportene 2–6.

---

## 2. App Store (Apple)

**Kildekommandoer kjørt (2026-08-14):**
- WebFetch `https://apps.apple.com/{no,us,gb}/search?term=snudly` — 404 fra
  anonymt HTTP; iTunes Search API ikke prøvd.
- WebSearch: `"Snudly" site:apps.apple.com`, `"Snudly" app iPhone iOS`,
  `"Snudly" app`, `"Snuddly" OR "Snuddley" OR "Snuddli" site:apps.apple.com`,
  `"Snudle" site:apps.apple.com`, `Snudly App Store Norge påkledning barn`,
  `"Snuggly" baby weather clothing app site:apps.apple.com`.

**Direkte treff «Snudly»:** Ingen. Ingen Google-indeksering av `site:apps.apple.com`
returnerte URL med «snudly» i app-navn eller slug. Nordiske apper med lite trafikk kan
være uindeksert av Google — se usikkerhet.

**Nære varianter observert:**

| Navn | Kategori (indikert) | URL |
|---|---|---|
| Snugly – Interior Design | Interior design / AI | https://apps.apple.com/us/app/snugly-interior-design/id6757368179 |
| Snuggly: Record Baby Heartbeat | Baby / helse | https://apps.apple.com/us/app/snuggly-baby-heartbeat-listen/id1663946323 |
| Snug: Daily Safety Check-In | Sikkerhet | https://apps.apple.com/us/app/snug-safety/id1122758716 |
| Snugi | Ikke bekreftet | https://apps.apple.com/us/app/snugi/id6759952305 |
| Snufl | Hunde-luftegård-finner | https://apps.apple.com/de/app/snufl/id6505123333 |
| Snoozly: Kids Bedtime Stories | Barn / historier | https://apps.apple.com/us/app/snoozly-kids-bedtime-stories/id6464295839 |

Ingen av variantene «Snuddly / Snuddley / Snuddli / Snudle» ga treff.

**Kollisjonsvurdering: LAV.** Ingen bokstavelig kollisjon. Nærmeste fonetisk overlapp i
familie/baby-segmentet er «Snuggly» (baby-hjertelyd) — annet formål.

**Usikkerhet:**
- iTunes Search API (`itunes.apple.com/search?term=snudly&country=no`) ikke kjørt.
- Utviklernavn/sist-oppdatert-datoer for variantapper ikke verifisert per produktside.
- Landstorefronts SE/DK/FI/DE ikke individuelt sjekket ut over Google-indeksering.

---

## 3. Google Play

**Kildekommandoer kjørt (2026-08-14):**
- WebSearch: `"Snudly" site:play.google.com`, `Snudly app Google Play Norge`,
  `"Snuddly" site:play.google.com`, `"Snuggly" app site:play.google.com`,
  `"Snudle" OR "Snudlee" OR "Snuddley" app site:play.google.com`.
- WebFetch: `play.google.com/store/search?q=snudly&c=apps&hl=no&gl=no` og
  `play.google.com/store/search?q=snudly&c=apps` (US default).

**Direkte treff «Snudly»:** Ingen. Norsk Play-storefront returnerte eksplisitt
«Ingen resultater for snudly» (2026-08-14). US-storefront viste kun fuzzy-treff.

**Nære varianter:**

| Navn | Utvikler | Kategori | Package-id | URL |
|---|---|---|---|---|
| SNUGL – Baby Tracker & Diary | Omti | Baby care | `com.nuessler.snugl` | https://play.google.com/store/apps/details?id=com.nuessler.snugl |
| Snuggli | Techstripped | Utilities | `com.base6926454fb26a2862c2f7226f.app` | https://play.google.com/store/apps/details?id=com.base6926454fb26a2862c2f7226f.app |
| Snuggly: Bedtime Stories | softio | Children | `com.softio.snuggly` | https://play.google.com/store/apps/details?id=com.softio.snuggly |
| Snuggs: Period & Cycle Tracker | snuggs | Health | `snuggs.app` | https://play.google.com/store/apps/details?id=snuggs.app |
| Snuggie | (app.snuggie) | Affirmations | `app.snuggie` | https://play.google.com/store/apps/details?id=app.snuggie |
| Snuggle Crush | tvata | Game | `com.tvata.Snuggle.Crush` | https://play.google.com/store/apps/details?id=com.tvata.Snuggle.Crush |
| Snudo | — | Game | `com.snudo.game` | https://play.google.com/store/apps/details?id=com.snudo.game |
| Snorble | Snorble | Kids/companion | `com.snorble.app` | https://play.google.com/store/apps/details?id=com.snorble.app |

Ingen søkevariant («Snuddly», «Snuddley», «Snudle», «Snudlee») ga egne apper på Play.

**Package-id-konflikt (`no.klemeg.app.*`):** Ingen funn. Ingen observert package-id starter
med `no.klemeg`.

**Kollisjonsvurdering: LAV.** Nærmeste i barnefamilie-segmentet er `SNUGL` (baby tracker,
annen bokstav, annen funksjon) og `Snuggly: Bedtime Stories` (godnattfortellinger, ikke
værbasert påkledning).

**Usikkerhet:**
- Installtall ikke synlige i søkelisten — ikke hentet per app-side.
- Landstorefronts DE/UK/US spesifikt ikke enkeltsjekket ut over default + `hl=no,gl=no`.
- «Snudly» som ord i norske dialekter/urban dictionary ikke undersøkt for uheldig betydning.

---

## 4. Domener

**Kilder brukt (2026-08-14):**
- IANA RDAP bootstrap: https://data.iana.org/rdap/dns.json
- Verisign RDAP (autoritativ .com): https://rdap.verisign.com/com/v1/domain/{navn}
- Google Registry RDAP (autoritativ .app): https://pubapi.registry.google/rdap/domain/{navn}
- Norid RDAP (autoritativ .no): https://rdap.norid.no/domain/{navn}
- Identity Digital RDAP (.io): https://rdap.identitydigital.services/rdap/domain/snudly.io
- Kontroll-oppslag mot kjente domener (google.com/app) bekrefter at 404 fra RDAP betyr
  «ikke i registeret».

**Tabell:**

| Domene | Status | Kilde | Dato |
|---|---|---|---|
| snudly.no | LEDIG | Norid RDAP → 404 | 2026-08-14 |
| snudly.com | LEDIG | Verisign RDAP → 404 | 2026-08-14 |
| snudly.app | LEDIG | Google Registry RDAP → 404 | 2026-08-14 |
| snudly.io | LEDIG (høy sannsynlighet) | Identity Digital RDAP → 404; who.is: «No WHOIS data was found» | 2026-08-14 |
| getsnudly.com | LEDIG | Verisign RDAP → 404 | 2026-08-14 |
| getsnudly.no | LEDIG | Norid RDAP → 404 | 2026-08-14 |
| snudly.se | USIKKER | RDAP-endepunkt utilgjengelig fra klonen; ingen autoritativ bekreftelse | 2026-08-14 |
| snudly.dk | USIKKER | punktum.dk-side returnerte 404; RDAP-endepunkt utilgjengelig | 2026-08-14 |
| snudly.eu | USIKKER | EURid RDAP nådde ikke; who.is-side sier både «AVAILABLE» og «registered» (parkeringsspråk) | 2026-08-14 |

**Viktig merknad om whois.com/who.is:** Begge tjenestene returnerte tekst «This domain is
already registered by someone else» for snudly.com, snudly.app, snudly.no og getsnudly.com.
Dette er villedende parkeringstekst / oppfordring til Sedo-tilbud, IKKE et faktisk whois-
svar. Autoritative registry-RDAP-svar motsier dette entydig (404 = ikke registrert).
Rapporten støtter seg på RDAP.

**.no-særregler:** Registrering krever norsk kontaktadresse og må gå via Norid-godkjent
registrar (f.eks. domeneshop.no, one.com, uniweb.no). Privatpersoner kan eie inntil 100
.no-domener siden 2014.

**Anbefalt sett å sikre (prioritet):**
1. snudly.no — kjerneidentitet i det norske markedet.
2. snudly.com — global standard.
3. snudly.app — appen skal på App Store, matcher produktet.
4. snudly.io — defensivt, tech-lesbart.
5. getsnudly.no + getsnudly.com — defensiv redirect for markedsføring.

**Prisestimater ikke autoritativt hentet i denne økten** — må bekreftes hos registrar før
innkjøp. Grovt anslag basert på typiske markedspriser: totalt NOK 800–1 500 per år for de
fem primære (dette er ANTAKELSE, ikke verifisert).

**Blokkere:** Ingen påvist for .no/.com/.app/.io.

**Usikkerhet:**
- snudly.se, snudly.dk, snudly.eu ikke verifisert (RDAP-endepunkter nådde ikke).
- Årspriser er anslag, ikke autoritative sitater.
- RDAP 404 er sterkt indisium på «ikke registrert»; sjeldne tilfeller av registry-reservasjon
  uten publisert record kan ikke utelukkes.

---

## 5. Varemerker

**Kilder forsøkt (2026-08-14):**
- Patentstyret: https://search.patentstyret.no/Trademark/Search?query=snudly — HTTP 410 via
  WebFetch (endpoint krever sesjon).
- EUIPO eSearch plus: https://euipo.europa.eu/eSearch/ — SPA, kun footer returnert.
- WIPO Global Brand DB: https://branddb.wipo.int/en/quicksearch/brand/snudly — CAPTCHA.
- USPTO Trademark Search: https://tmsearch.uspto.gov/search/search-information?searchText=snudly
  — kun header returnert.
- TMview: https://www.tmdn.org/tmview/ — SPA, tom respons.
- Sekundært (Google-indeksert): site:trademark.justia.com, site:trademarkia.com,
  site:tmdn.org, site:euipo.europa.eu, site:branddb.wipo.int.

**Treff på «Snudly»:** Ingen bekreftet direkte. Google-indeksering av search.patentstyret.no
viser ingen «Snudly»-post; Justia/Trademarkia (som speiler USPTO TESS) viser 0 treff på
«snudly», nærmeste er SNUGGIE, SNUGLI, SNUGLOO, SNUGGLE, SNUZNOODLE.

**Nære varianter (indeksert):**
- «Snuddly»: 0 treff (Justia/Trademarkia).
- «Snudle»: 0 treff.
- «Snuggly»: mange treff, bl.a. SNUGGLY STEPS (US, baby-apparel, Snuggly Steps LLC —
  https://trademarks.justia.com/owners/snuggly-steps-llc-1421715), SNUGGLY FRIENDS.
  Fonetisk nær; klasse 25 (klær) og 28 (leketøy) overlapp finnes i US.

**Selskaper med lignende navn (ikke varemerker):**
- Snuggly Apps (San Diego, apper for barn, siden 2016 iflg. thecompanycheck.com).
- Snugly (London, deadpooled P2P-marketplace for barneting, 2012, iflg. Tracxn).

**Risikoklasser:**
- Kl. 9 (mobilapper): ingen direkte «Snudly»-kollisjon funnet i indekserte kilder.
- Kl. 25 (klær): «Snuggly Steps» dekker baby-apparel i US — fonetisk risiko hvis Snudly
  utvider til klær. Ikke relevant for app-lansering.
- Kl. 42 (SaaS): ingen indekserte kollisjoner.

**Vurdering:** **GO etter varemerkeregistrering, med caveat.** Ingen bevis for eksisterende
«Snudly»-varemerke. Fonetisk nær «Snuggly» er utbredt; risiko for innsigelse i kl. 25 (US)
er relevant kun ved klær-utvidelse. For app+SaaS i Norge/EU vurderes risikoen som lav
basert på tilgjengelige indekseringer.

**Anbefalt registrering (kostnad ANTAKELSE, ikke bekreftet):**
- Norsk nasjonalt varemerke (Patentstyret) i kl. 9 + 42: NOK 2 900 basisgebyr + NOK 750 per
  ekstra klasse (Patentstyret-satser slik agenten fant dem 2026-08-14 — bør verifiseres på
  https://www.patentstyret.no/varemerke/gebyrer før filing).
- EUTM (EUIPO) i kl. 9 + 42 hvis EU-lansering: EUR 850 basis + EUR 50 andre klasse +
  EUR 150 tredje (samme forbehold).

**Usikkerhet:**
1. Direkte Patentstyret/EUIPO/WIPO/USPTO-oppslag ikke fullført (CAPTCHA/SPA/410). Alle
   «null treff»-utsagn hviler på tredjeparts-speilinger og Google-indeksering. Kritisk:
   må gjøres manuelt før varemerkefiling.
2. Nyere søknader (siste 3–6 mnd) er ofte ikke indeksert av tredjeparter.
3. Ingen sjekk mot norsk Foretaksregister (Brønnøysund) for «Snudly» som firmanavn.
4. Fonetisk-likhet-vurdering (Snudly vs Snuggly under norsk/EU-praksis) er en juridisk
   vurdering som bør bekreftes av varemerkeadvokat før filing.

**Anbefalt neste steg før varemerkefiling:** Manuell sjekk i Patentstyret, EUIPO eSearch
plus, TMview og USPTO TESS med skjermbilde + URL som bevis (ca. 30 min menneskearbeid);
eventuelt profesjonell clearance search (Onsagers/Zacco/Bryn Aarflot, ca. NOK 5 000–15 000
— ANTAKELSE, ikke sjekket).

---

## 6. Håndtak

**Kilder brukt:** direkte HTTP-probing (curl med Chrome- og Googlebot-UA) mot profil-URL-ene
listet under, samt WebFetch mot Instagram og YouTube for meta-utpakking. Ingen innlogget
probing — låste plattformer (LinkedIn/Facebook uten cookies) merket USIKKER.

### Tabell

| Plattform | Håndtak | Status | Eier (hvis synlig) | URL / signal |
|---|---|---|---|---|
| Instagram | snudly | TATT | tom placeholder-konto — 0 followers, 3 following, 0 posts (og:description-uttrekk 2026-08-14) | https://www.instagram.com/snudly/ (200 + og:description "0 Followers, 3 Following, 0 Posts") |
| Instagram | snudly_app | LEDIG | — | https://www.instagram.com/snudly_app/ (200 men Googlebot får generisk `<title>Instagram</title>`, ingen profil-meta) |
| Instagram | snudlyapp | LEDIG | — | https://www.instagram.com/snudlyapp/ (200, generisk `<title>Instagram</title>`, ingen profil-meta) |
| TikTok | snudly | LEDIG | — | https://www.tiktok.com/@snudly (200 + HTML inneholder "Couldn't find this account") |
| TikTok | snudly_app | LEDIG | — | https://www.tiktok.com/@snudly_app ("Couldn't find this account") |
| TikTok | snudlyapp | LEDIG | — | https://www.tiktok.com/@snudlyapp ("Couldn't find this account") |
| X / Twitter | snudly | USIKKER | — | https://x.com/snudly — curl gikk gjennom med 200, men WebFetch fikk HTTP 402 (Twitter blokkerer scraping); ikke bekreftet visuelt |
| X / Twitter | snudly_app | LEDIG | — | https://x.com/snudly_app (curl HTTP 404) |
| X / Twitter | snudlyapp | LEDIG | — | https://x.com/snudlyapp (curl HTTP 404) |
| Facebook side | snudly | USIKKER | — | https://www.facebook.com/snudly (Chrome-UA → 400; Googlebot-UA → 200 med `<title>Facebook</title>`. Kan være innloggingsvegg for både ledig og tatt håndtak — krever manuell/pålogget verifisering) |
| Facebook side | snudlyapp | USIKKER | — | https://www.facebook.com/snudlyapp (samme signaler som over) |
| YouTube-kanal | snudly | TATT | kanalnavn "snudly", tom kanal (ingen beskrivelse, ingen synlige videoer i HTML-dump) | https://www.youtube.com/@snudly (200 + `<title>snudly - YouTube</title>`, `itemprop="name" content="snudly"`, `"description":""`) |
| YouTube-kanal | snudly_app | LEDIG | — | https://www.youtube.com/@snudly_app (HTTP 404) |
| YouTube-kanal | snudlyapp | LEDIG | — | https://www.youtube.com/@snudlyapp (HTTP 404) |
| LinkedIn selskap | snudly | LEDIG (indikert) | — | https://www.linkedin.com/company/snudly (HTTP 404 uten cookies — LinkedIn returnerer 404 for ikke-eksisterende, men også for auth-vegg; sannsynlig ledig) |
| LinkedIn selskap | snudly-app | LEDIG (indikert) | — | https://www.linkedin.com/company/snudly-app (HTTP 404) |
| LinkedIn selskap | snudlyapp | LEDIG (indikert) | — | https://www.linkedin.com/company/snudlyapp (HTTP 404) |
| GitHub org/user | snudly | LEDIG | — | https://github.com/snudly (HTTP 404) |
| GitHub org/user | snudly-app | LEDIG | — | https://github.com/snudly-app (HTTP 404) |
| GitHub org/user | snudlyapp | LEDIG | — | https://github.com/snudlyapp (HTTP 404) |

### Anbefalt reserveringssett (kritiske først)

1. **TikTok** `snudly`, `snudly_app`, `snudlyapp` — alle tre ledige; sikre `snudly` først.
2. **GitHub** `snudly` — org-navnet er ledig; sikre først.
3. **Instagram** `snudly_app` og `snudlyapp` — begge ledige. `snudly` er okkupert (tom).
4. **YouTube** `@snudly_app` og `@snudlyapp` — begge ledige. `@snudly` er tatt (tom kanal).
5. **LinkedIn Company** `snudly` — opprett; bekreftes ved opprettelse.
6. **X/Twitter** `snudly_app` og `snudlyapp` — begge ledige (404). `snudly` uavklart.
7. **Facebook Page** — må verifiseres manuelt innlogget før reservering.

### Blokkere (tredjepart eier håndtaket)

- **Instagram @snudly** — okkupert av tom konto (0 posts, 0 followers). Ingen synlig
  aktivitet, men håndtaket er formelt tatt.
- **YouTube @snudly** — okkupert av tom kanal med navn "snudly", ingen beskrivelse.
- Basert på utlogget probing ser ingen av disse ut til å drive konkurrerende
  virksomhet i norsk barnefamilie-segment — men innhold bak innloggingsvegg
  (Instagram private story-arkiv, YouTube skjulte videoer o.l.) er ikke sjekket.
  Merkevare-eierskap er svekket uavhengig av hva som ligger bak.

### Usikkerhet

- **X/Twitter @snudly**: curl HTTP 200, WebFetch HTTP 402 — kan ikke skille mellom
  eksisterende profil og generisk landingsside uten innlogget probing.
- **Facebook /snudly og /snudlyapp**: 400 uten UA, 200 med Googlebot-UA men bare
  `<title>Facebook</title>`. Krever manuell innlogget sjekk.
- **LinkedIn Company /snudly-varianter**: 404 kan bety både «ledig» og «auth-vegg».
- **Instagram @snudly_app / @snudlyapp**: 200 + fravær av profil-meta er beste
  tilgjengelige signal, ikke autoritativ bekreftelse.
- Ingen håndtakssjekk for varemerkekonflikt.

---

## 7. Samlet anbefaling

**Kortsiktig (før varemerkefiling og App Store-innsending):**
1. Sikre snudly.no, snudly.com, snudly.app umiddelbart (registrar-kjøp; kostnad anslått
   NOK 400–800/år samlet, ikke autoritativt bekreftet).
2. Sikre defensive: snudly.io, getsnudly.no, getsnudly.com.
3. Manuell verifisering av snudly.se, snudly.dk, snudly.eu før eier bestemmer om de skal
   sikres.
4. Reserver håndtakene i prioritetsrekkefølgen i seksjon 6.
5. Manuell sjekk i Patentstyret (https://www.patentstyret.no/varemerkesok) og EUIPO
   (https://euipo.europa.eu/eSearch/) med skjermbilder som bevis.

**Middels sikt (før lansering):**
1. Registrer Snudly som varemerke i Norge (Patentstyret) i kl. 9 + 42.
2. Vurder EUTM ved EU-lansering.
3. Vurder å utfordre Instagram/YouTube @snudly hvis merkevaren blir sterk (varemerke-basert
   krav krever registrert varemerke først).

**Ikke-blokkere for App Store-innsending nå:**
- Ingen kollisjon i App Store, ingen kollisjon i Play, ingen kjent registrert varemerke,
  domenene er ledige. Kjernenavnet «Snudly» kan brukes i visningsnavn og markedsføring.
- Bundle-id `no.klemeg.app` er urørt (per DECISION-LOG 2026-08-14 E-2), så tekniske
  identifikatorer i App Store og Play påvirkes ikke.

**Lukking av åpen naming-port fra 2026-07-15:** `docs/DECISION-LOG.md:313` («Offentlig
navn: Babyora») slår fast at «En formell tilgjengelighetssjekk (varemerke, `.no`-domene,
App Store-navn, håndtak) anbefales fortsatt før innsending». Visningsnavn-delen av den
entryen er superseded av E-2 2026-08-14, men tilgjengelighetssjekk-anbefalingen har
stått åpen. Denne rapporten (SN-006) er den tilgjengelighetssjekken, nå gjennomført på
det vedtatte navnet Snudly, og lukker den porten så langt indirekte kildesjekk rekker.
Direkte-DB-verifikasjon i Patentstyret/EUIPO gjenstår (se seksjon 5).

---

## 8. Ikke-verifisert / åpne punkter

Følgende har rapporten ikke autoritativ bekreftelse på og skal ikke leses som positiv
verifisering:

- Domener: snudly.se, snudly.dk, snudly.eu (RDAP-endepunkt nådde ikke).
- Varemerker: direkte oppslag i Patentstyret, EUIPO eSearch plus, WIPO GBD, USPTO TESS,
  TMview — alle enten CAPTCHA-beskyttet, SPA-basert eller returnerte 410. «Null treff»-
  utsagn hviler på Google-indeksering av tredjeparts-speilinger (Justia, Trademarkia).
- App Store: iTunes Search API (`itunes.apple.com/search?term=snudly&country=no`) ikke
  kjørt; landstorefronts SE/DK/FI/DE ikke individuelt sjekket ut over Google-indeksering.
- Play: installtall per app ikke hentet; landstorefronts DE/UK/US ikke enkeltsjekket.
- Håndtak: X @snudly, Facebook /snudly og /snudlyapp krever manuell innlogget sjekk.
- Prisestimater for domener og varemerkeregistrering er anslag, ikke autoritative sitater
  fra registrar/Patentstyret hentet i denne økten.
- «Snudly» som ord i norske dialekter/urban dictionary ikke undersøkt for uheldig betydning.
