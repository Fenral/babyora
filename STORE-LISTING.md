# App Store-tekst for Babyora

Norsk-først tekst klar til å lime inn i App Store Connect og Google Play
Console. Engelsk versjon nederst (for international locales).

---

## App-navn
**Babyora**

## Subtittel (max 30 tegn — App Store)
**Påkledning for de minste**

## Promo-tekst (max 170 tegn — kan endres uten ny submission)
Vær + aktivitet = riktige lag. Spesialdesignet for norske foreldre med
barn 0–3 år. Met.no-data i sanntid.

## Beskrivelse (App Store full description)

```
Hvor mange lag skal jeg ta på henne i dag?

Babyora er en norsk-først app som hjelper foreldre å vite hva barn 0–3 år
skal ha på seg, basert på været akkurat der dere er.

— DAGENS ANBEFALING —
Live værdata fra met.no kombinert med norsk ull-lag-logikk: ull innerst,
fleece eller ull-mellomlag, yttertøy, og det lille ekstra (lue, votter,
varmepose, regntrekk).

— AKTIVITET BETYR ALT —
Vogn (stillesittende) trenger varmepose. Bæresele varmes av forelderkroppen.
Utelek krever lag man kan kvitte seg med. Babyora differensierer mellom
disse — ingen andre apper gjør det.

— DAGENS TIDSLINJE —
Se time-for-time når lagene bør endres. Stor temperatur-forskjell i løpet
av dagen? Få beskjed om å pakke et ekstra lag for kveldtur.

— PÅ TUR —
Planlegger dere hytte, ski eller lang dagstur? Bytt til "På tur"-modus
og få en samlet pakkeliste basert på 24 timers vær.

— FLERE BARN —
Bytt mellom søsken på ett trykk. Hvert barn har sin egen profil med alder,
sted og standard-aktivitet.

— PERSONVERN FØRST —
Vi samler ikke posisjons-data (du velger by fra en liste). Vi sporer
ikke deg eller barnet. Værdata kommer fra Meteorologisk institutt
(met.no) og lagres bare midlertidig på telefonen.

— PREMIUM —
Babyora er gratis å bruke for ett barn. Med Babyora Premium får du:
• Flere barn (søsken)
• Alle aktivitets-modus
• 3-døgns varsel
• Kveldsvarsel ved værendring
• Garderobe-tracking
• Ull-vask-guide

Premium koster 39 kr/mnd eller 299 kr/år. 7 dagers gratis prøveperiode.

— OM OSS —
Babyora er bygget av en norsk forelder, validert av helsesøster, og bruker
faglige anbefalinger fra Babyverden og Reima. Vi vet at norsk vinter er
en annen sport enn amerikansk T-skjorte-temperatur.

Vær fra met.no.
```

## Promo-tekst (Play Store short description, max 80 tegn)
Norsk påkledning for barn 0–3 år. Vær + aktivitet + ull-lag. Met.no-data.

## Kategorier
- **App Store iOS:** Lifestyle (primær), Helse & trening (sekundær)
- **Play Store:** Foreldre (primær)

## Alderskategori
- App Store: 4+
- Play Store: Alle aldre

## Nøkkelord (iOS, max 100 tegn separert med komma)
```
påkledning,baby,vær,vinter,ull,fleece,vogn,foreldre,met.no,lag
```

## Skjermbilder (krav)

**iPhone 6.7"/6.9" (1290×2796 px) — 3 obligatoriske:**
1. Hovedskjerm med "X lag i dag" + avatar + lag-liste
2. Aktivitets-velger med tur-modus highlightet
3. Plan-skjerm med 3-døgns varsel

**Anbefalte tilleggs-skjermbilder:**
4. Vær-notater (sol-vs-skygge eller temp-fall)
5. Tidslinje med lag-endringer
6. Settings · Multi-barn-bytter

**Genereres automatisk fra dev-preview** ved hjelp av iPhone-mockup-CSS i
appen. Bruk Edge devtools + iPhone 16 Pro Max-emulator, screenshot fra
hver hovedskjerm. ASC-bilder skal IKKE inneholde status bar (Apple legger
til standard).

## App Privacy (Apple-spørreskjema)

| Kategori | Samles inn? | Brukes til |
|---|---|---|
| Kontaktinfo | Nei (med mindre kjøp) | — |
| Helse & trening | Nei | — |
| Finansiell info | Ja (via Apple IAP) | Kjøps-historikk |
| Posisjon | Nei (vi bruker bynavn fra liste) | — |
| Brukerinnhold | Ja (barnedata: navn, alder, sted) | App-funksjonalitet |
| Identifikatorer | Ja (anonyme push-tokens) | Push-varsler |
| Diagnostikk | Nei (ingen tredjeparts-analytics) | — |

## TODO før innsending

- [ ] App Store Connect: opprett app-record med bundle no.klemeg.app
- [ ] Play Console: opprett app + 11-stegs Play setup (gjenbruk Ryddy-mønster)
- [ ] Generere 3+ screenshots i 1290×2796 fra iPhone-emulator i Edge
- [ ] Personvernerklæring publisert på en offentlig URL
  (foreslag: klemeg.no/personvern via Vercel statisk side)
- [ ] App Privacy-spørreskjema utfylt i ASC
- [ ] Apple Paid Apps Agreement (har du fra Ryddy)
- [ ] Google Play Console-konto + tester-grupper

---

## English translations (for international locales — lower priority)

**App name:** Babyora
**Subtitle:** Dressing for the little ones
**Description (short):**
Norwegian-first dressing app for parents of 0–3 year olds. Live weather
from met.no combined with proper wool-layering logic. Activity-aware:
stroller, baby carrier, outdoor play, and day-trips each get different
recommendations. Multi-child support. Privacy by default.
