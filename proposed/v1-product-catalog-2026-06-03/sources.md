# Babyora product-catalog crawl-spike 2026-06-03

Crawl-kilder (via WebFetch under Claude Max, 0 NOK kost):

## Nostebarn.no — Ull-spesialist

URL: https://nostebarn.no/baby-ull/ull-body

Hentet 7 ullbody-produkter. Alle 70% organisk merino + 30% silke.

| Navn | Pris | URL |
|---|---|---|
| Omslagsbody i ull med silke hullmønster | 498 NOK | https://nostebarn.no/products/omslagsbody-i-ull-med-silke-hullmonster |
| Omslagsbody i ull med silke | 498 NOK | https://nostebarn.no/products/omslagsbody-i-ull-med-silke-3 |
| Body i ull med silke (langermet) | 498 NOK | https://nostebarn.no/products/body-i-ull-med-silke-10 |
| Singletbody m/knapp | 435 NOK | https://nostebarn.no/products/singletbody-m-knapp-i-ull-med-silke |
| Ullbody | 478 NOK | https://nostebarn.no/products/ullbody-5 |
| Ribbestrikket body | 498 NOK | https://nostebarn.no/products/body-i-ull-med-silke-15 |
| Body i ull med silke (langermet, variant) | 498 NOK | https://nostebarn.no/products/body-i-ull-med-silke-4 |

## Lillelam.no — 100% Merino norsk merke

URL: https://lillelam.no/produktkategori/ull-til-baby/

Hentet 8 produkter — direkte fra Lillelam (uten bilder pga lazy-load). Pluss 2 fra ohdearbaby.no med ekte bilde-URL.

| Navn | Pris | URL | Bilde |
|---|---|---|---|
| Babylue July | 349 NOK | lillelam.no/produkt/babyhat-july | placeholder |
| Sparkedress tynn classic | 899 NOK | lillelam.no/produkt/sparkedress-tynn-classic | placeholder |
| Sparkedress classic | 999 NOK | lillelam.no/produkt/sparkedress-classic | placeholder |
| Hentesett | 1 699 NOK | lillelam.no/produkt/hentesett-baby | placeholder |
| Classic sett | 2 099 NOK | lillelam.no/produkt/classic-sett | placeholder |
| Pledd tynn classic | 799 NOK | lillelam.no/produkt/pledd-tynn-classic | placeholder |
| Pledd classic | 999 NOK | lillelam.no/produkt/pledd-classic | placeholder |
| Babylue classic | 399 NOK | lillelam.no/produkt/babylue-classic | placeholder |
| **Ullbody tynn (via OhDear)** | 343 NOK | https://www.ohdearbaby.no/products/lillelam-ullbody-baby-hvit/ | https://img.ohdearbaby.no/e138f893-dec6-44ae-ef42-7a8749b12800/public |
| **Ullongs (via OhDear)** | 319 NOK | https://www.ohdearbaby.no/products/lillelam-ullongs-baby-hvit/ | https://img.ohdearbaby.no/1bf093fb-8f54-4a8b-e3c4-b6089a1e9200/public |

## Janus.no — Norsk merino

URL: https://www.janus.no/en/collections/baby-forste-lag-ullekedress

Hentet 1 produkt (collection-side var 404 for `/no/`, men `/en/products/` fungerte).

| Navn | Pris | URL | Bilde |
|---|---|---|---|
| Playsuit Merino — Babywool 180 | 309 NOK | https://www.janus.no/en/collections/baby-forste-lag-ullekedress | https://www.janus.no/cdn/shop/files/6921402-923.jpg |

## OhDearBaby.no — Multi-merke (Reima yttertøy)

URL: https://www.ohdearbaby.no/products/reima-vinterdress-baby-puhuri-grey-pink/

Hentet 1 produkt for yttertøy. Kategoriside var tom — direkte produkt-URL fungerte.

| Navn | Brand | Pris | URL | Bilde |
|---|---|---|---|---|
| Vinterdress Puhuri | Reima | 714 NOK | https://www.ohdearbaby.no/products/reima-vinterdress-baby-puhuri-grey-pink/ | https://img.ohdearbaby.no/455c94dd-b6c9-482d-8c35-5b58bffdaa00/desktop |

## Voksi.no — Vognposer

Direkte produkt-URL ga 404 (Voksi Adventure North via OhDear). Trenger en runde til på Voksi sin egen side eller jollyroom for å hente vognposer. Foreløpig **mangler i katalog** — fallback til "ingen forslag" for `varmepose dun`, `dunteppe`, `varmepose lett`, `varmepose`.

## Sammendrag

| Butikk | Produkter hentet | Kategorier dekket |
|---|---|---|
| Nostebarn | 7 | innerst (ullbody) |
| Lillelam | 10 (8 direkte + 2 via OhDear) | innerst (ullbody, ullongs), mellomlag (sparkedress, ullsett), ekstra (lue, pledd) |
| Janus | 1 | mellomlag (ullekedress) |
| OhDearBaby/Reima | 1 | yttertøy (vinterdress) |
| Voksi | 0 | — (oppfølging) |

**Totalt: 19 produkter.** Dekker mest brukte item-strenger:

- `kortermet ullbody` → Nostebarn Singletbody, Ribbestrikket body
- `langermet ullbody` → Nostebarn Body i ull med silke (×2), Lillelam Ullbody, Nostebarn Ullbody
- `langermet ullbody tynn` → Lillelam Ullbody (tynn 100% Merino), Nostebarn Body i ull med silke
- `ullongs` / `ull-bukse` / `ullstrømper` → Lillelam Ullongs
- `ullsett tynt` → Lillelam Hentesett, Janus Playsuit Merino, Lillelam Sparkedress tynn
- `ullsett tykt` → Lillelam Classic sett, Sparkedress classic
- `ullsett dobbelt` → Lillelam Classic sett (fallback, mangler dedikert)
- `lue` / `lue tynn` / `lue m/ ull` → Lillelam Babylue classic, Babylue July
- `dunteppe` / `tynt teppe` → Lillelam Pledd classic, Pledd tynn classic
- `vinterkjøredress` / `vinterkjøredress isolert` → Reima Puhuri

## Mangler (oppfølging i v2)

- `varmepose dun` / `varmepose lett` / `varmepose` — Voksi 404, ny runde nødvendig
- `sauekinn i vogn` — ingen crawl-data
- `balaklava` — ingen crawl-data
- `votter` / `votter tykke` / `votter tynne` / `votter dun` — ingen crawl-data
- `hals` — ingen crawl-data
- `fleecedress` / `fleecejakke` / `fleecebukse` / `tynn fleece` — ingen crawl-data (typisk H&M/Polarn O. Pyret)
- `ansiktskrem` — eksternt apotek-link
- `regntøy / skall` / `regntrekk` — ingen crawl-data
- `solhatt` / `caps eller solhatt` — ingen crawl-data
- `sko` / `tøffel-sko` / `vintersko` — ingen crawl-data

## Risiko / merknader

- **Lillelam-bilder:** direkte fra lillelam.no er lazy-loaded placeholder. Vi bruker derfor `ohdearbaby.no`-bildene som proxy (de er Lillelam-produkter selv om kjøp-flyten går via en annen butikk).
- **Pris-snapshot:** datert 2026-06-03. Bør refreshes 2-3× per år.
- **Hot-linking:** alle bilde-URL-er er fra butikkenes CDN. ToS-OK for discovery, men bør forhandles affiliate ved skalering.
