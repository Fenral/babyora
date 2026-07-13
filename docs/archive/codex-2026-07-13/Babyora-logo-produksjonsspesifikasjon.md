# Beskyttet kjerne – produksjonsspesifikasjon

**Status:** Optisk raffinert symbolkandidat er ferdig før kode. Endelig wordmark og offentlig merkenavn venter på navneporten.

## Idé

Den ferskenfargede kjernen representerer barnet, varme og dagens viktigste beslutning. Den indre krembuen representerer det nærmeste laget og menneskelig omsorg. Den ytre mintbuen representerer værbeskyttelse, handling og Babyoras assisterende system.

Formen er bevisst enkel. En profesjonell app-logo skal tåle 16–24 piksler, varsler, widget, ensfarget trykk og et lite Instagram-profilbilde. Flere detaljer ville redusert, ikke økt, kvaliteten.

## Mastergeometri

- Grunnflate: `100 × 100` enheter.
- Ytre bue: x `18–82`, topp `27`, optisk bunn `89`, strek `10`.
- Indre bue: x `32–68`, topp `38`, optisk bunn `75`, strek `5.5`.
- Kjerne: sentrum `(50,45)`, radius `8.5`.
- Alle avslutninger og skjøter er runde.
- Kjerne og buer er optisk, ikke matematisk, sentrert for at symbolet skal oppleves stabilt i appikonet.

## Farger

| Rolle | Verdi | Bruk |
|---|---|---|
| Morgennatt | `#1B1929` | Appikonbakgrunn og mørk monokrom. |
| Mint | `#69D39C` | Ytre handling/beskyttelse. |
| Krem | `#F5F0E8` | Indre omsorgslag og lys monokrom. |
| Fersken | `#F19B7B` | Kjerne, varme og barnets fokus. |

Ingen gradient er nødvendig i masterlogoen. Eventuell atmosfærisk glød tilhører kampanje/mockup, ikke selve merket.

## Klarflate og minste størrelse

- Klarflate rundt symbolet: minst kjernens diameter på alle sider.
- Flerfarget symbol: minimum `24 px` digitalt.
- Under `24 px`: bruk forenklet app-/mikrovariant med ytre bue og kjerne; detaljen skal pikseltestes før eksport.
- Monokromt trykk: minimum `8 mm` høyde.

## Tillatte varianter

1. Flerfarget symbol på Morgennatt.
2. Flerfarget symbol på transparent eller svært lys, rolig flate når krembuen har tilstrekkelig kontrast.
3. Mørk monokrom på lys bakgrunn.
4. Lys monokrom på mørk bakgrunn.
5. Appikon med Morgennatt-bakgrunn og plattformstyrt hjørnemaske.

## Ikke tillatt

- Ikke roter, speil eller strekk symbolet.
- Ikke gi hver bue tilfeldig ny farge.
- Ikke legg permanent glød, skygge eller 3D-effekt i masterfilen.
- Ikke plasser tekst inne i symbolet.
- Ikke bruk bare den ferskenfargede prikken som merke før gjenkjennelse er dokumentert.
- Ikke fintegn wordmarken før navnet og uttalen er låst.

## Wordmark etter navneport

Hvis `Klarune` godkjennes, skal wordmarken tegnes med en varm, redaksjonell serif i samme familie som appens overskrifter, men optisk justeres som logo. Den skal ikke bare være tekst skrevet med en standard font. Avstanden mellom symbol og ordmerke testes i horisontal og stablet variant.

## Leveransefiler som nå finnes

- `Babyora-brand-assets/protected-core-symbol.svg`
- `Babyora-brand-assets/protected-core-symbol-dark-mono.svg`
- `Babyora-brand-assets/protected-core-symbol-light-mono.svg`
- `Babyora-brand-assets/protected-core-app-icon.svg`

Filene er produksjonsnære symbolkilder, men skal ikke erstatte appikonet før visuell godkjenning, navneport og småstørrelsestest er gjennomført.

## Eksportmatrise etter godkjenning

- SVG: flerfarge, mørk mono og lys mono.
- PNG/WebP: 16, 24, 32, 48, 72, 96, 128, 192, 256, 512 og 1024 px.
- iOS: én 1024 px master uten forhåndsmaskerte hjørner.
- Android: adaptive foreground/background-kilder med sikker sone.
- Web: favicon og PWA-ikoner.
- Sosialt: 1080 px kvadrat med romslig klarflate.

