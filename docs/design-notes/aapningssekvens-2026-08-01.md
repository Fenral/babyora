# Åpningssekvensen — spec (forhandlet med ekstern kritiker 2026-08-01)

Eierbestilling: animert side når appen åpnes. Landet som A+B-hybrid:
monter-lyset markerer overgangen fra launch screen, maskoten trekker seg
kontrollert opp bak panelkanten, sluttbildet er PIKSELIDENTISK med Hjem.

## Tidslinje — første gang noensinne (~900 ms)

| Tid | Hva |
|---|---|
| 0–100 ms | Statisk launch screen og første web-frame matcher nøyaktig. Ordmerket helt stille. |
| 100–280 ms | Panelet (allerede i faktisk værnyanse) løftes 8 px til sluttposisjon. Monter-lyset går ÉN gang langs toppkanten. |
| 180–720 ms | Maskoten stiger 60–80 px BAK panelet. `cubic-bezier(.16,1,.3,1)`, maks 1° rotasjon. |
| 620–820 ms | Hender/fingre-laget kommer foran kanten; grepet lander nøyaktig på fingertupp-linjen (samme alfa-målte geometri som ankringen). |
| 820–900 ms | 2 px mikrosettling, deretter helt stille. |

Forbud: ingen panel-fargelegging/avhuking/«beregning» (tilhører scannen),
ingen haptikk ved automatisk åpning. Tap fullfører umiddelbart OG aktiverer
knappen brukeren traff. Idle-loopen starter tidligst 4–5 s uten interaksjon.

## Gradert bruk

- **Første gang noensinne:** full hybrid ~900 ms.
- **Senere kaldstarter:** 280–350 ms — panelet løftes 4–6 px, kort lys
  langs kanten, maskoten settler 10–12 px. Ingen full klatring.
- **Varmstart:** direkte til cachet Hjem.
- **Reduce Motion:** direkte til ferdig Hjem, uten fade eller bevegelse.

## Produksjonsvei (byråvalg, begrunnet)

Lagdelte assets + CSS/WAAPI. Kun `transform`/`opacity`/maskeposisjon.

Lag (bak→front): maskotens kropp/hode BAK panelet · panel i faktisk
CSS-værnyanse · hender/fingre FORAN panelet · monter-lyskant som egen
CSS-gradient.

Hender-foran-laget produseres ved å skjære eksisterende maskot-PNG i to
langs den alfa-målte fingertupp-linjen — ingen generativ produksjon
(fingerdrift ville ødelagt illusjonen), garantert pikselmatch.

Seedance/video eier ALDRI hovedbevegelsen: fingre/kant må lande geometrisk
eksakt, sluttbildet må matche Hjem uten crossfade-avvik, panelet må reagere
på faktisk værnyanse og tema. Seedance kan senere utforske blunk/hodebevegelse
til idle-loopen, isolert og manuelt renset.
