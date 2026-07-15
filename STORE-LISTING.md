# App Store-tekst for Babyora (ASO-optimalisert)

Norsk-først, klar for App Store Connect. **Låst v1-scope: 0–24 måneder.**
Alt her er sannferdig mot faktiske funksjoner (ingen «validert av helse-
personell» — v1 lanseres med veiledende-disclaimer, se DECISION-LOG).
Engelsk nederst.

> **ASO-prinsipp (iOS):** ranking drives av **app-navn + subtittel + keywords**
> (ikke beskrivelsen). Derfor bærer navn/subtittel de sterkeste søkeordene, og
> keywords-feltet gjentar dem aldri. Beskrivelsen selger konvertering.

---

## App-navn (max 30 tegn)
**`Babyora – Påkledning baby`**  *(25 tegn)*

Legger det viktigste søkeordet («påkledning») + «baby» i det tyngst-vektede
feltet. Ren-merkevare-alternativ: bare `Babyora` (svakere for en ukjent app).

## Subtittel (max 30 tegn)
**`Vær, lag og ull for barnet`**  *(26 tegn)*

Bærer nye søkeord som ikke er i navnet: vær, lag, ull, barn.

## Keywords (max 100 tegn, komma, INGEN mellomrom, ikke gjenta navn/subtittel)
```
spedbarn,vinter,klær,kulde,temperatur,fleece,vogn,foreldre,friluft,nyfødt,varme,sesong,met,tur
```
Nye termer utover navn/subtittel. Singular (App Store matcher bøyninger selv).
Droppet: baby/påkledning/vær/lag/ull (allerede i navn+subtittel), «met.no» (bruk «met»).

## Promo-tekst (max 170 tegn — kan endres uten ny submission)
```
Hvor mange lag i dag? Babyora leser været der dere er og viser rett antrekk
for barn 0–2 år — ull innerst, riktig ytterlag, det lille ekstra. Gratis å bruke.
```

## Beskrivelse (App Store full description)

```
Hvor mange lag skal barnet ha på seg i dag?

Babyora leser været akkurat der dere er og viser et komplett antrekk for
barn 0–24 måneder — hver morgen, gratis.

— DAGENS ANTREKK, GRATIS —
Live værdata fra Meteorologisk institutt (met.no) kombinert med norsk lag-på-
lag-logikk: ull innerst, riktig mellomlag, ytterlag, og det lille ekstra
(lue, votter, hals, regntrekk). Ett komplett svar på tre sekunder.

— TILPASSET DEN NORSKE VINTEREN —
Kulde, vind og «føles som»-temperatur er innebygd. Én toggle for vogn eller
bæring, der barnet holder ulik varme.

— MORGENVARSEL, GRATIS —
Våkn opp til dagens antrekk klart. Ingen betaling for å komme i gang.

— MED BABYORA PLUSS —
• Fremover: se i morgen og de neste dagene, ikke bare i dag
• Overalt: flere steder og automatisk posisjon
• Flere barn: bytt mellom søsken på ett trykk
• Tilpasning til plaggene dere faktisk eier

Pluss koster 49 kr/mnd eller 299 kr/år (tilsvarer 24,90 kr/mnd), med 7
dagers gratis prøveperiode. Avslutt når som helst.

— VEILEDENDE, IKKE EN FASIT —
Anbefalingene er veiledende og erstatter ikke ditt eget skjønn eller råd fra
helsepersonell. Du kjenner barnet best — følg alltid med.

— PERSONVERN FØRST —
Du velger sted fra en liste; vi sporer ikke posisjonen din. Barnedata (navn,
alder, sted) lagres lokalt på telefonen. Værdata kommer fra met.no.

Vær fra met.no.
```

## Play Store kort beskrivelse (max 80 tegn)
```
Vær-basert påkledning for barn 0–2 år. Ull, lag og «føles som» fra met.no.
```

## Kategorier
- **App Store iOS:** Livsstil (primær), Vær (sekundær)
- **Play Store:** Foreldre (primær)

> Vurdert «Helse & trening» som sekundær — droppet: helse-kategorien øker
> Apples gransking av sikkerhets-/helsepåstander. «Vær» er tryggere og
> tematisk presist.

## Alderskategori
- App Store: 4+ · Play Store: Alle aldre

## App Privacy (Apple-spørreskjema)

| Kategori | Samles inn? | Brukes til |
|---|---|---|
| Kontaktinfo | Nei | — |
| Helse & trening | Nei | — |
| Finansiell info | Ja (via Apple IAP) | Kjøpshistorikk |
| Posisjon | Nei (bynavn fra liste) | — |
| Brukerinnhold | Ja (barnedata: navn, alder, sted) | App-funksjonalitet |
| Identifikatorer | Ja (anonyme push-tokens) | Push-varsler |
| Diagnostikk | Nei (ingen tredjeparts-analytics) | — |

## TODO før innsending
- Bundle-ID er **`no.klemeg.app`** (provisjonert, IKKE endre — se `STATUS.md`).
  App-record + IAP + RevenueCat er allerede opprettet (juni 2026).
- [ ] **Provisioning-profil:** ASC-API-nøkkel → App Manager-rolle (STATUS.md #2) — blokkerer TestFlight-bygget.
- [ ] **Avstem produkt-IDer:** koden (`babyora_*`) matcher ikke provisjonerte `no.klemeg.app.*` — ekte kjøp feiler til dette er løst (eierbeslutning på prismodell).
- [ ] Personvernerklæring publisert (offentlig URL)
- [ ] App Privacy-spørreskjema utfylt i ASC
- [ ] Apple-priser + localization per IAP (STATUS.md #1)
- [ ] Skjermbilder (se `docs/APP-STORE-SCREENSHOTS.md`)

---

## Rettinger mot forrige versjon (hvorfor)
- **0–3 år → 0–24 måneder:** matcher låst v1-scope (AGENTS.md / engine 2-plan).
- **Fjernet «validert av helsesøster / Reima / Babyverden»:** usant nå — v1
  lanseres uten fagsignatur, med veiledende-disclaimer. Falske ekspert-
  påstander ville brutt både sannferdighet og App Store-retningslinjer.
- **Fjernet «ingen andre apper gjør det»:** absolutt konkurransepåstand.
- **Premium-liste alignet til «Fremover, overalt og sammen»** + kun bygde
  funksjoner (familiedeling = R9, ikke lovet som tilgjengelig ennå).
- **Morgenvarsel flyttet til gratis** (låst kapabilitetskontrakt).
- **Navn/URL:** klemeg → babyora.

---

## English (international locales — lower priority)

**App name:** `Babyora – Baby dressing`
**Subtitle:** `Weather-smart layers for baby`
**Keywords:** `infant,winter,clothes,cold,temperature,fleece,stroller,parents,outdoor,newborn,warmth,season,met`
**Description (short):**
Babyora reads the weather where you are and shows a complete outfit for
children 0–24 months — wool base, right outer layer, the little extras.
Free every morning; Plus adds the days ahead, more places and more children.
Advisory, not a substitute for your own judgment. Weather from met.no.
