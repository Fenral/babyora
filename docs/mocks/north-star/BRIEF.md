# R4 North-Star — låste retningsbriefer (2026-07-14)

Tre prototyperetninger for fem-foreldre-porten. Alle tre viser **samme virkelige tilstander** fra `fixtures.json` (ekte motor-output, dumpet fra commit `32f4c7b`). Ingen produksjonsassets — avatar vises som nøytral positur-silhuett (sittende 0–11 / stående 12–24). Retningene **videreutvikler Morgennatt**, de erstatter det ikke.

## Felles krav (alle retninger)

- **Balanse 60/25/15:** påkledningsbeslutning / atmosfære / presisjon. Hjem-svaret skal forstås på ≤ 5 sekunder.
- **Flater (390×844-rammer):** Hjem → Antrekk → Plan → Paywall, deretter tilstandsrekke: loading, cached/offline, manglende sted, ekstrem kulde (fixture), ekstrem varme (fixture), største tekst (≈130 %), redusert bevegelse (statisk).
- **Innhold:** Hjem = umiddelbart svar + korrekt ytterantrekk + neste meningsfulle endring. Antrekk = avatar øverst + full «Rekkefølge · innerst først»-liste. Plan = endringsrail der KUN meningsfulle endringer får markør (fixtures: 08→12 = yttertøy av; 12→16 = regntrekk + kjøredress på). Paywall = «Fremover, overalt og sammen»: gratis (i dag hjemme) → Plus-transformasjon; 49 kr/mnd + 299 kr/år (årlig valgt), 7 dagers prøve m/ eksplisitt beløpstekst; **ALDRI lifetime**.
- **Tokens (Morgennatt, gjenbruk eksakt):** canvas mild `#DAD8EE` / kald `#CCDCF7` / varm `#EED1E0`; surface `#F3F2FB`/`#FFFFFF`; ink `#211B32`/`#56506F`; CTA granmynte `#267147` (eneste grønne objekt); temp-blå `#2B5C97` KUN kulde-mening; varm-rosé `#B54436`; lag-farger korall `#AF5331` / marigold `#93690D` / petrol `#285E6A`; fokusring `#6750AB`. Ingen nye paletter.
- **Typografi:** `'Fraunces', Georgia, serif` KUN på display-øyeblikk (svaret/tall-mast); `'Schibsted Grotesk', -apple-system, system-ui, sans-serif` ellers. Tabular-nums på alle tall. °-verdier med enhet.
- **Visuelle lover (signatur-spec §2):** én dominerende fysisk metafor per skjerm; dybde forklarer hierarki; tekstur kun lokalt; farge følger mening; ingen fake-realisme; bevegelse beskrives som statiske annotasjoner (dette er statiske mocks — angi varighet/easing i små etiketter, f.eks. «crossfade 220 ms»).
- **Navigasjon:** lav, mørk instrument-dock (Hjem · Planlegg · Guide · Familie), aktiv = fylt ikon + stille mynte-pool, ingen glass-pille.
- **A11y innebygd:** alle interaktive mål ≥ 44 pt (marker hit-areas), tekstkontrast ≥ 4,5:1 mot faktisk bakgrunn, synlig fokus-stil på minst ett eksempel, status aldri kun via farge, `role`/`aria`-annotasjoner som HTML-kommentarer der relevant, største-tekst-rammen skal IKKE klippe.
- **Sikkerhetssannhet:** plagglisten er fasit; ekstrem kulde-fixturen viser flagg/notes fra motoren (f.eks. frostskade-sjekk) som rolig sikkerhetslinje, aldri skjult.
- **Teknisk:** én selvstendig HTML-fil per retning, åpnes rett i nettleser, ingen avhengigheter (Fraunces via @import med Georgia-fallback er OK), lys modus (Morgennatt er lys-først; temp-aksen farger canvas per ramme).

## Retning A · «Ferdig svar-kortet» (stille presisjon)

Beslutningen som et ferdig trykket morgenkort. Hjem: ett stort, rolig svar-kort — silhuett-avatar venstre, tre viktigste plagg som tekstil-stabel høyre, trygghetslinje under; atmosfæren er en smal temp-reaktiv himmelstripe øverst (25 %), presisjon i én tynn instrumentlinje (temp · vind · oppdatert-tid). Antrekk: kortet ekspandert — full stabel med 6–10 pt overlapp, aktiv rad løftet 2–3 pt med mynte-kantlys. Plan: vertikal rail med kompakte kort kun ved endring. Paywall: kortet «brettes ut» til uke + steder + omsorgssirkel. Karakter: nøktern, trykksak-aktig, tettest på dagens app. Serif kun i svar-overskriften.

## Retning B · «Scenen» (atmosfærisk morgenritual)

Avataren står i selve atmosfæren. Hjem: hele canvas er temp-reaktiv himmel (dawn-gradient innenfor aksens farger), silhuett-avataren sentralt med de 3–5 synlige ytterplaggene som stille orbital-ankre rundt (kun ytterste synlige!); ett dominant svar («Vinterkjøredress-dag») i Fraunces; presisjon som flytende instrument-avlesning (liten glass-chip). Antrekk: scenen krymper til øvre tredjedel, «innerst først»-listen ruller under. Plan: dagen som én kontinuerlig atmosfære-stripe der markører sitter PÅ stripen. Paywall: scenen multipliserer seg — i morgen/annet sted/andre omsorgspersoner glir inn som paneler. Karakter: teatralsk men varm; mest visuelt modig; atmosfære er metaforen (aldri konkurrerende glass-termometer).

## Retning C · «Påkledningslisten er instrumentet» (redaksjonell/taktil)

Listen ER produktet. Hjem: stor taktil «innerst først»-liste fyller flaten — hver rad = plagg med vevd fargetab (korall/marigold/petrol per gruppe), avataren er et lite verifisert «kvittering»-stempel øverst til høyre; atmosfæren er en smal temp-rail langs venstre kant som følger listen; presisjon per rad («−7° føles · vind 4»). Antrekk: samme liste utvidet med hvorfor-chips og alternativ-knapp per rad. Plan: listen over dagen — radene som endres markeres, uendrede kollapser («Samme antrekk til 16:00»). Paywall: listen får fremtids-rader bak rolig glass-blur (én sannferdig eksempelrad synlig). Karakter: informasjonstett, anti-dashboard, asset-lett (fungerer uten avatarbilder). Redaksjonell typografi, avis-aktig disiplin.

## A11y-tillegg (accessibility-lead, 2026-07-14 — obligatorisk for alle tre)

1. **Semantiske farger som tekst er begrenset:** `#B54436`, `#AF5331`, `#93690D`, `#285E6A` brukes ALDRI som normal-størrelse tekst rett på temp-canvasene (rosé på varm = 3,9:1; marigold på mild = 3,5:1). Lov: på hvit/`#F3F2FB`-flater, som stor tekst (≥ 24 px / 18,5 px bold), eller som ikke-tekst-tabs med ink-tekst ved siden. Hver farget tekstkjøring navngir faktisk bakgrunn + ratio i kommentar.
2. **Ikke-tekst-kontrast ≥ 3:1 (WCAG 1.4.11):** ikoner, inaktive dock-elementer, lag-fargetabs, rail-markører og fokusring mot faktisk bakgrunn. (Fokusring `#6750AB` består på alle tre canvaser; mørk dock sine inaktive tilstander er risikoen.)
3. **Verste-punkt-regel for gradienter/blur** (retning B-canvas, C-paywall-blur): tekstkontrast verifiseres mot lyseste punkt under teksten, ellers scrim. Kommenter samplet verste-punkt-hex.
4. **Dokumentskjelett:** `<html lang="nb">`, beskrivende `<title>`, nøyaktig én `<h1>` per ramme, ingen hoppede heading-nivåer.
5. **Tekstekvivalent for all meningsbærende grafikk:** antrekket + hovedårsaken skal kunne rekonstrueres fra tekst alene (alt-tekst som HTML-kommentar ved hver grafikk). Test: fjern all grafikk mentalt — svaret er fortsatt lesbart.

## Suksesskriterium ved porten (uendret fra planen)

Fem foreldre: alle fem gjengir antrekket + hovedårsaken, median forståelsestid ≤ 5 s, ingen oppfatter avataren som pynt/kontekst. Én retning godkjennes av eier før produksjonsassets/redesignkode.
