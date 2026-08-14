# Snudly designsystem

**Status:** utledet fra den gjeldende mocken (K2b lys / K5 mørk), ikke fra produksjonskoden.
**Kilde:** `snudly-mock.html` — versjonen som erstatter `babyora-mock-K2bK5-R3.html`.
**Gjelder fra:** 13.08.2026. Navnebytte Babyora → Snudly er gjennomført i mocken.

---

## 0. Har vi et designsystem?

Delvis — og det er verdt å være presis om hva som faktisk finnes.

**Det som finnes:** Et token-lag (CSS-variabler for farge, skygge, easing og varighet) og et komponentvokabular som er brukt konsistent gjennom alle fire faner og begge temaer. Lys og mørk er ikke to design, men ett design med ett omdefinert token-sett. Dette er reelt systemarbeid.

**Det som ikke finnes:** Systemet er aldri hentet ut, navngitt eller dokumentert. Det bor inne i én HTML-fil. Det er ingen skala for radius eller typografi — bare verdier som ble valgt der de trengtes. Flere farger er hardkodet uten token. Ingen har definert hva som er låst og hva som kan endres.

Dette dokumentet er uthentingen. Kapittel 7 lister avvikene som må lukkes før Codex bygger på det.

---

## 1. Fundament

| | |
| --- | --- |
| Målflate | iOS først, 393 × 852 (iPhone 16). Capacitor-app, local-first. |
| Register | Produkt-UI. Designet tjener oppgaven; det er ikke en merkevareflate. |
| Grunnpremiss | Appen svarer på ett spørsmål: *hva skal barnet ha på seg nå?* Været er premisset, plaggene er svaret. |
| Temaer | Lys (K2b) er standard. Mørk (K5) er likeverdig, ikke en ettertanke. |

---

## 2. Fargetokens

Alle farger er tokens. Ingen komponent skal bruke en literal hex.

### Flater

| Token | Lys | Mørk | Rolle |
| --- | --- | --- | --- |
| `--canvas` | `#f3f7f5` | `#111C17` | App-bakgrunn (under alt) |
| `--plate` | `#fffdf9` | `#1C2B23` | Kortflate — bærer innhold |
| `--plate-soft` | `#edf4f1` | `#22332B` | Innfelt flate inne i kort (knapper, felter) |
| `--weather` | `#dcebe5` | `#0F3134` | Værkortet — den ene tonede flaten |
| `--line` | `#d7e4df` | `#3A4A41` | Hårstrek: kortkant og skillelinje |

**Regel:** kortflate står på canvas. Innfelt flate står på kortflate. Aldri tre nivåer. Nøstede kort er alltid feil.

### Blekk

| Token | Lys | Mørk | Rolle |
| --- | --- | --- | --- |
| `--ink` | `#182720` | `#F1E9DA` | Primærtekst, overskrifter |
| `--ink-mid` | `#566b63` | `#B9C4B3` | Sekundærtekst, etiketter |

Kontrast er målt mot alle fire flater, ikke bare den lyseste:

| | på `--plate` | på `--canvas` | på `--weather` |
| --- | --- | --- | --- |
| `--ink` lys | 15,3:1 | 14,4:1 | 12,6:1 |
| `--ink-mid` lys | 5,6:1 | 5,3:1 | 4,6:1 |
| `--ink` mørk | 12,3:1 | — | — |
| `--ink-mid` mørk | 8,2:1 | 9,7:1 | 7,7:1 |

`--ink-mid` ble endret fra `#5e746c` til `#566b63` under denne uthentingen. Den gamle verdien ga 4,07:1 på værkortet — under AA-kravet på 4,5:1 — og rammet «Trondheim», «Vind 3 m/s» og «Regn 0,4 mm». Feilen var usynlig så lenge man bare målte mot den lyse kortflaten. Ny verdi passerer på alle fire flater.

### Aksenter

| Token | Lys | Mørk | Rolle |
| --- | --- | --- | --- |
| `--sage-deep` | `#20594f` | `#B9C4B3` | Primærhandling, valgt tilstand, ikoner |
| `--sage-light` | `#dcebe5` | `#22332B` | Fyll for valgt tilstand og chips |
| `--rust` | `#B0512A` | `#B0512A` | Klesbytte — signalet om at noe endrer seg |
| `--rust-soft` | `#F5E2D6` | `#22332B` | Fyll bak rust-innhold |
| `--rust-ink` | `#8A3D1C` | `#E8B48F` | Tekst på rust-soft |
| `--blue` | `#477f95` | `#477f95` | Kun graf: vind og regn |
| `--focus` | `#0d685a` | `#0d685a` | Fokusring |

**Rust er reservert.** Den betyr klesbytte, og ingenting annet. Bruk den ikke som generell aksent, ikke til dekor, ikke til «viktig». Salvie bærer alt annet.

---

## 3. Typografi

To familier, valgt på kontrastakse (serif + sans), aldri to like.

| Familie | Bruk |
| --- | --- |
| **Schibsted Grotesk** | All UI: overskrifter, knapper, etiketter, brødtekst, data |
| **Fraunces** | Kun tall og navn som skal føles menneskelige: temperaturen på Hjem, barnets navn, klokkeslett for klesbytte, arkoverskrifter |

Fraunces er en identitetsbeslutning låst i tidligere runder. Den skal ikke brukes på knapper, etiketter eller brødtekst.

### Skala

Fast rem-skala, ikke flytende. Brukere ser appen i samme DPI hver gang.

| Steg | px | Bruk |
| --- | --- | --- |
| Display | 54 | Temperaturen på Hjem (Fraunces) |
| Title 1 | 34 | Faneoverskrift |
| Title 2 | 29 | Seksjonsoverskrift på Hjem |
| Title 3 | 22 | Kortoverskrift |
| Headline | 18 | Seksjon i kort |
| Body | 14 | Radtittel, brødtekst |
| Callout | 12 | Sekundærtekst |
| Caption | 11 | Etiketter, meta |
| Micro | 9–10 | Aksetekst, indeksnummer, versaletiketter |

Vekter: 470 (Fraunces display), 650–790 (Schibsted). Sperring −0.038em på Title 1, aldri strammere enn −0.04em.

---

## 4. Form

| Token | Verdi | Bruk |
| --- | --- | --- |
| `--r-pill` | 999px | Chips, segmentkontroller, knapper med tekst |
| `--r-card` | 17px | Kort og lister |
| `--r-inset` | 13px | Innfelte elementer i kort |
| `--r-sheet` | 25px | Ark (bottom sheet), kun topphjørner |
| `--r-nav` | 22px | Tab-bar |

### Skygger

| Token | Bruk |
| --- | --- |
| `--shadow-card` | Kort som løftes fra canvas |
| `--shadow-chip` | Små elementer: thumbs, noder, chips |

Skygge betyr høyde, ikke pynt. Et element som ikke er løftet, skal ikke ha skygge.

### Avstand

4-punkts grunnrytme. Vanlige verdier: 4, 7, 10, 13, 17, 21. Sideinnrykk i visning: 17px.

---

## 5. Bevegelse

| Token | Verdi | Bruk |
| --- | --- | --- |
| `--quick` | 140ms | Trykk-respons (`:active`, `scale(.93)`) |
| `--standard` | 320ms | Tilstandsendring, fargeskifte, tema |
| `--ease` | `cubic-bezier(.16, 1, .3, 1)` | All inngang og tilstand — ease-out |
| `--ease-in` | `cubic-bezier(.7, 0, 1, 1)` | Kun utgang |

Regler:

- Bevegelse formidler tilstand. Aldri dekor.
- Ease-out på alt som kommer inn. Ease-in kun på det som forsvinner.
- Ingen bounce, ingen elastic.
- Fanebytte: 420ms inn / 220ms ut, retningsbestemt.
- `prefers-reduced-motion` er implementert og ikke valgfritt.

---

## 6. Komponenter

Hver komponent har én form. Samme handling = samme mønster, på tvers av faner.

| Komponent | Regel |
| --- | --- |
| **Ikonknapp** | 44×44 sirkel. Kun én i topphøyre: situasjonsvelgeren. Rød prikk vises kun når situasjonen ikke er standard. |
| **Situasjons-chip** | Pin + navn + chevron. Identisk komponent på Hjem og Planlegg. Fyllet inverteres mot underlaget: kremfyll på tonet kort, salviefyll på kremkort. |
| **Segmentkontroll** | Pille med valgt segment i `--sage-deep`. Brukes til *filter på samme innhold* (I dag/I morgen) og til *identitetsbytte* (Lillian/Sivert) — sistnevnte må ha avatar i pillen så den ikke forveksles. |
| **Rad** | Full bredde, chevron til høyre, min. 67px. Én affordance for «åpne»: chevron. Aldri tekstlenke ved siden av. |
| **Kort** | Kortflate + hårstrekkant + `--shadow-card`. Kant er nødvendig: uten den forsvinner kanten i canvas. |
| **Ark** | `<dialog>`, 25px topphjørner, backdrop med blur. Modal er siste utvei, ikke første. |
| **Toast** | Mørk pille, 2200ms, kun bekreftelse. |
| **Graf** | Kurven er ikke poenget. Sonene er: flaten deles ved klesbyttet i «før»-sone (salvie) og «etter»-sone (rust), hver med lagnavn. Markøren viser klokkeslett og er trykkbar. |
| **Node** | Sirkel, initial eller avatar. Barnet i midten bruker alltid avatar, omsorgspersoner bruker initial. |

### Illustrasjon

To språk, med en regel som skiller dem:

- **Ting er taktile.** Vær, plagg og verktøy bruker leire-/filtuttrykket.
- **Mennesker er levende.** Kun barnet bruker 3D-avataren.

Ingen unntak. Det er dette som hindrer at appen ser ut som to design limt sammen.

---

## 7. Avvik som må lukkes før implementering

Funnet ved uthenting fra mocken. Dette er teknisk gjeld, ikke designvalg.

| # | Avvik | Handling |
| --- | --- | --- |
| 1 | `--saffron` deklareres to ganger (`#d98443`, så overstyrt til `#B0512A`). Første verdi er død. | Slå sammen til `--rust: #B0512A`. |
| 2 | `#8A3D1C` er hardkodet 11 steder uten token. | Innfør `--rust-ink`. |
| 3 | `--hero`, `--blue-soft`, `--canvas-deep` og `--sage` er deklarert, men aldri brukt. | Fjern, eller ta i bruk bevisst. |
| 4 | Mørk modus innfører `#E8B48F` og `#9DBF9A` uten token. | Tokeniser som mørk-variant av `--rust-ink` og grafkurven. |
| 5 | 12 ulike radiusverdier (12–52px). | Kollaps til de fem stegene i kapittel 4. |
| 6 | 17 ulike fontstørrelser. | Kollaps til de ni stegene i kapittel 3. |
| 7 | `--sage-light` og `--weather` har samme verdi i lys, men ulik i mørk. | Behold begge — de er to roller. Dokumenter det, ikke slå dem sammen. |
| 8 | Ingen definerte tilstander for `disabled`, `loading` eller `error`. | Må defineres før første produksjonsskjerm. |

---

## 8. Det som er låst

Endres ikke uten eierbeslutning:

- Fire faner: Hjem, Planlegg, Verktøy, Familie.
- Den hengende avataren på Hjem.
- Forholdet vær → antrekk, og at antrekket er svaret.
- Fraunces som displayserif.
- Rust som klesbytte-signal.
- Lys som standardtema.

---

## 9. Navnebytte

`Babyora` → `Snudly` er gjennomført i mocken (tittel, ordmerke, brødtekst, avatarbeskrivelse).

Gjenstår utenfor mocken:

- Repo `wool-app-main` og `PRODUCT.md` / `DESIGN.md`
- Prosessdokumentene i `discussion/`
- Vercel-prosjektnavn og eksisterende lenker
- App-ID, ikon, App Store-oppføring
- Avataren omtales som «Snudly-gull» — kontroller at fargenavnet fortsatt gir mening under nytt merkenavn
