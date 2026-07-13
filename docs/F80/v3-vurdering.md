# F80.2 — HOME V3-målbilde: Fable-dom (2026-07-02)

Sivert la frem eksternt «BABYORA HOME V3»-målbilde. Fable vurderte punkt
for punkt. Implementert i `public/design-2026/f79-hjem-a/index.html`.

## Tatt inn
- Hierarki temp → avatar → CTA → værkontekst (fantes allerede)
- Nesten tom topp: sted-pille + klokke, ALLE kontroller fjernet
- CTA-copy «Se dagens antrekk» (var «Bekreft dagens antrekk» — feil
  semantikk før man har sett antrekket)
- CTA 56px + mer luft avatar→teller→CTA (tomrom som designelement)
- Fjernet: lag-dots, marigold separator-linje over CTA, replay-knapp
- Mental modell «situasjon → barn → handling» bekreftet som fasit

## Avvist (med begrunnelse)
1. **#1A1816 + #FF8550:** kaster Morgennatt (Siverts valg), temp-aksen
   (differensiatoren) og Granmynte (analyse-backet). Oransje = samme
   kollisjon med korall-plaggene som CTA-analysen drepte med matte.
   Fast mørk warm-bg = «2026 AI warm dark»-refleksen (Bakstehuset, 42,5).
2. **Fjern «N lag»:** overstyrt av Sivert selv (bestilt 2026-07-02).
   Tallet er anbefalingens fasit-headline. Kun dots'ene røk.
3. **Kun Schibsted / fjern serif:** selvmotsigende — spec-en ber om
   «editorial magazine-style» og forbyr virkemiddelet. Én tekstfont
   (Schibsted) + én display-font (Fraunces, KUN temp-mast) er
   premium-praksis, ikke font-miksing.
4. **Avatar «not cartoonish»:** re-litigering av låst clay-beslutning.

## Kompromiss
- **Pause-knappen** kunne kun fjernes lovlig ved å gjøre sol-pulsen
  ENGANGS (4,5s × 1): WCAG 2.2.2 krever pause-kontroll kun ved >5s
  loop. Sol puster nå én gang ved load, deretter statisk.
- Replay fjernet fra app-UI (autoplay <5s = OK per F80-preclearance);
  demo-replay UNDER framen (presentasjons-chrome) beholdt for testing.

## Port-fasit F80b (oppdatert)
Scene-layout porteres slik mocken nå står: engangs sol-pust, ingen
app-kontroller i toppen, «N lag» uten dots, «Se dagens antrekk» 56px,
raus avatar→CTA-luft, redusert mast-overlapp (F80.1).
