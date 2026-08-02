# T1B — katalogfelt-validering (underlag for Bytt/T3), 2026-08-02

Automatisert av `src/data/__tests__/plagg-katalog-integritet.test.ts`:
testen validerer feltene skjemaet HAR (id/category/label/aliases/
illustration/what/when + subcategory), og håndhever at hvert id som mangler
Bytt-kompatibilitetsfelt står oppført i DENNE filen. Ingen data er diktet
opp — dette dokumentet ER hull-listen T3 starter fra.

## Konklusjon

**Alle 60 katalogobjekter mangler samtlige fem Bytt-kompatibilitetsfelt**
(runde 4-kravet: kompatibilitet må validere kroppsdekning, lagrolle,
varmebidrag, fukt/vind/vann-funksjon og avhengigheter):

| Felt Bytt trenger | Status i skjemaet i dag | Nærmeste eksisterende proxy |
|---|---|---|
| `lagrolle` (presis rolle i laget, f.eks. base_top vs base_fullbody) | MANGLER (60/60) | `category` gir kun grovnivå (innerst/mellomlag/yttertoy/ekstra) — skiller ikke body fra sokk i samme lag |
| `kroppsdekning` (hode/hals/torso/armer/hender/ben/føtter/helkropp) | MANGLER (60/60) | `subcategory` finnes for 30 av 60 (kun ekstra-kategorien: hodeplagg/hender/hals/fotter/vogn/soevn/hud); innerst/mellomlag/yttertoy (30 stk.) har INGEN dekningsdata |
| `varmebidrag` (relativ isolasjonsverdi for «litt varmere/kjøligere»-etiketter) | MANGLER (60/60) | kun implisitt i fritekst (`what`/`when`) og i navnekonvensjoner (tynn/tykk/isolert) — ikke maskinlesbart |
| `funksjon` (fukttransport / vindtett / vanntett) | MANGLER (60/60) | kun implisitt i fritekst; `materialFor()`-heuristikken i garment-catalog-helpers.ts regex-gjetter fra id-en (UI-tag, ikke sannhetskilde) |
| `avhengigheter` (krever/utelukker andre plagg, f.eks. sovepose ⊗ teppe) | MANGLER (60/60) | ingenting |

Konsekvens (låst i runde 10): **T3 (Bytt V1) kan ikke starte** før disse
feltene finnes som strukturert data — konsekvensetiketter skal BEREGNES,
aldri gjettes redaksjonelt, og mockens «Ullhals, tynn som alternativ til
body» var nettopp feilen som oppstår uten kroppsdekning/lagrolle-data.

## Hull per id

Kolonnen viser hva som FAKTISK finnes i dag. Alle 60 id-er under mangler
`lagrolle`, `kroppsdekning`*, `varmebidrag`, `funksjon` og `avhengigheter`
(* de 30 ekstra-plaggene har `subcategory` som grov kroppsdekning-proxy,
markert i parentes; de øvrige 30 har ingenting).

| id | category (+ ev. subcategory-proxy) |
|---|---|
| `kortermet-body` | innerst |
| `kortermet-ullbody` | innerst |
| `langermet-body` | innerst |
| `langermet-ullbody` | innerst |
| `langermet-ullbody-tynn` | innerst |
| `ullsett-tynt` | innerst |
| `ullsett-tykt` | innerst |
| `to-ullsett` | innerst |
| `t-skjorte` | innerst |
| `shorts` | innerst |
| `lett-bukse` | innerst |
| `bleie` | innerst |
| `ullsokker` | innerst |
| `tynn-bukse` | mellomlag |
| `tynn-ull-mellomlag` | mellomlag |
| `ull-mellomlag` | mellomlag |
| `ull-mellomlag-tykt` | mellomlag |
| `ull-jakke` | mellomlag |
| `ull-bukse` | mellomlag |
| `tynn-pyjamas` | mellomlag |
| `pyjamas` | mellomlag |
| `ull-pyjamas` | mellomlag |
| `lett-kjoredress` | yttertoy |
| `kjoredress` | yttertoy |
| `vinterkjoredress` | yttertoy |
| `vinterkjoredress-isolert` | yttertoy |
| `vinterdress` | yttertoy |
| `vinterdress-isolert` | yttertoy |
| `regntoy-skall` | yttertoy |
| `vindtett-skall` | yttertoy |
| `solhatt` | ekstra (subcategory: hodeplagg) |
| `lue-tynn` | ekstra (subcategory: hodeplagg) |
| `lue` | ekstra (subcategory: hodeplagg) |
| `lue-m-ull` | ekstra (subcategory: hodeplagg) |
| `balaklava` | ekstra (subcategory: hodeplagg) |
| `votter-tynne` | ekstra (subcategory: hender) |
| `votter` | ekstra (subcategory: hender) |
| `votter-tykke` | ekstra (subcategory: hender) |
| `votter-dun` | ekstra (subcategory: hender) |
| `vindvotter-skall` | ekstra (subcategory: hender) |
| `hals` | ekstra (subcategory: hals) |
| `sko` | ekstra (subcategory: fotter) |
| `toffel-sko` | ekstra (subcategory: fotter) |
| `sandaler` | ekstra (subcategory: fotter) |
| `vintersko` | ekstra (subcategory: fotter) |
| `vintersko-isolerte` | ekstra (subcategory: fotter) |
| `tynt-teppe` | ekstra (subcategory: vogn) |
| `dunteppe` | ekstra (subcategory: vogn) |
| `varmepose-lett` | ekstra (subcategory: vogn) |
| `varmepose` | ekstra (subcategory: vogn) |
| `varmepose-dun` | ekstra (subcategory: vogn) |
| `sauekinn-i-vogn` | ekstra (subcategory: vogn) |
| `regntrekk` | ekstra (subcategory: vogn) |
| `regnponcho-over-baeresele` | ekstra (subcategory: vogn) |
| `sovepose-0-5-tog` | ekstra (subcategory: soevn) |
| `sovepose-1-0-tog` | ekstra (subcategory: soevn) |
| `sovepose-2-5-tog` | ekstra (subcategory: soevn) |
| `sovepose-3-0-3-5-tog` | ekstra (subcategory: soevn) |
| `sovepose-3-5-tog` | ekstra (subcategory: soevn) |
| `ansiktskrem` | ekstra (subcategory: hud) |

## Tilleggsfunn (data-inkonsistens som IKKE er fikset i T1A)

1. **Alias-sprik for `tynn-ull-mellomlag`**: katalogens `aliases` lister
   `"tynn ull-mellomlag"`, men motorens faktiske db-streng (og
   garment-illustrations.ts sin MAP-nøkkel) er `"tynt ull-mellomlag"`
   (korrekt intetkjønn). Aliaslisten matcher altså ikke strengen motoren
   faktisk emitterer. Ikke rørt i T1A (aliases er oppslagsdata; endring bør
   skje sammen med en full alias↔MAP-konsistenssjekk i T3-underlaget).
2. **Alias-sprik for `sauekinn-i-vogn`**: aliaset er `"sauekinn i vogn"`,
   mens MAP-nøkkelen (og korrekt norsk) er `"saueskinn i vogn"`. Samme
   vurdering som over — id og aliases står urørt, kun `label`/`what` er
   språkrettet i T1A.
3. **`ansiktskrem` er ikke et plagg** (hud-produkt) — Bytt-kompatibilitet
   trenger antakelig en egen `type`-markør (plagg vs utstyr vs pleie) for å
   holde slike utenfor bytte-forslag.
