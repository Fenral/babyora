# SN-W02 · Forespørsel, forsøk 1

**Oppgave:** Rett DoD-regel C2 til å verne de faktisk provisjonerte produkt-IDene, og
før eiervedtaket om betaling inn i `docs/DECISION-LOG.md`. C1 (bundle-id) står urørt.
Per `loop/referanse/EIERVEDTAK-BETALING-2026-08-14.md` V6.

**Type:** E · **Modell/innsats:** Opus 4.7, høy. Per eiervedtak i LEDGER
`2026-08-14T16:13Z` (rutingen rullet tilbake til Opus for alle typer etter modellblokker
på SN-W01) og `2026-08-14T16:16Z` (høyrisiko-modellkravet gjelder Type C
entitlement/betaling; SN-W02 er Type E dokumentretting).

**Filer:**
- `loop/DOD-SNUDLY.md` — C2-raden omskrevet fra å verne ikke-eksisterende
  `no.klemeg.app.monthly/quarterly/yearly` til å verne de faktisk provisjonerte
  `babyora_yearly_299`, `babyora_monthly_49` og `babyora_barnetiden_499`.
- `docs/DECISION-LOG.md` — ny 2026-08-14-entry «Betaling og abonnement (V1–V6)» som
  fyller ut retningsvalget som mangler etter SUPERSEDED-banneret på 2026-07-15
  «Prismodell», med eksplisitt E3-håndtering av motstrid.
- `loop/ARBEIDSLISTE-SNUDLY.md` — SN-W02 satt fra `KLAR` → `PÅGÅR` → `TIL KONTROLL`.
- `loop/LEDGER.md` — startlinje 2026-08-14T16:20:48Z og handover-linje appended.
- `loop/evidens/SN-W02/g[1-4]-*.txt` — nyopprettet, G1–G4-output fanget etter siste
  materialcommit (`dacfa24`).

## Leveransefakta

Rå output fra `loop/leveranse-fakta.sh SN-W02` kjørt etter siste materialcommit
`dacfa24` og push (før request/evidens/BATON-commit):

```
=== LEVERANSEFAKTA SN-W02 ===
generert: 2026-08-14T16:35:20Z  (date -u)

--- HEAD ---
sha:      dacfa243ea3fab5730a7f5bafbd07a52ddb3601b
emne:     SN-W02: f1 roedt-lag-fix, fire funn adressert
forfatter:2026-08-14T18:32:59+02:00

--- trailere ---
Review-Request: SN-W02
Forsoek: 1

--- G6-format ---
OK: emnet starter med 'SN-W02: '

--- diff mot forelder ---
 1 file changed, 31 insertions(+), 13 deletions(-)

--- per fil (numstat: eksakt, ikke skalert graf) ---
31	13	docs/DECISION-LOG.md

--- dommer og evidens som må være sporet ---
BRUDD usporet: loop/evidens/SN-W02/g1-lint.txt  — commit den, ellers underkjennes leveransen (G5/E1)
BRUDD usporet: loop/evidens/SN-W02/g2-tsc.txt  — commit den, ellers underkjennes leveransen (G5/E1)
BRUDD usporet: loop/evidens/SN-W02/g3-test.txt  — commit den, ellers underkjennes leveransen (G5/E1)
BRUDD usporet: loop/evidens/SN-W02/g4-build.txt  — commit den, ellers underkjennes leveransen (G5/E1)

--- synk mot origin ---
HEAD:     dacfa243ea3fab5730a7f5bafbd07a52ddb3601b
upstream: dacfa243ea3fab5730a7f5bafbd07a52ddb3601b
OK: pushet og synkron

rev-list --left-right --count HEAD...@{upstream}:
0	0

=== SLUTT SN-W02 ===
```

De fire evidensfilene, `loop/requests/SN-W02-f1.md`, `loop/ARBEIDSLISTE-SNUDLY.md`
(TIL KONTROLL) og handover-linjen i `loop/LEDGER.md` legges inn i en oppfølgende commit
etter denne, og BATON-endringen i en egen commit etter det — så «BRUDD usporet» over
lukkes av den neste committen, ikke av den som er fanget her.

Oppgavepakken (mellom utgangspunkt `aaced3e` og siste materialcommit `dacfa24`):

```
$ git log --format='%H %s' aaced3e..dacfa24
dacfa243ea3fab5730a7f5bafbd07a52ddb3601b SN-W02: f1 roedt-lag-fix, fire funn adressert
e34a23f562b7683182236caade8e979625b11306 SN-W02: f1 rett DoD C2 og foer EIERVEDTAK-BETALING inn i DECISION-LOG

$ git diff --stat aaced3e..dacfa24
 docs/DECISION-LOG.md        | 76 +++++++++++++++++++++++++++++++++++++++++++++
 loop/ARBEIDSLISTE-SNUDLY.md |  4 +--
 loop/DOD-SNUDLY.md          |  2 +-
 loop/LEDGER.md              |  5 +++
 4 files changed, 84 insertions(+), 3 deletions(-)
```

## Porter kjørt (etter siste materialcommit `dacfa24`)

Rå output i `loop/evidens/SN-W02/g[1-4]-*.txt`, fanget med `{ ...; echo "EXIT=$?"; }`
per SELVSJEKK-BYGGER.md §1. Siterte haler:

```
$ tail -n 3 loop/evidens/SN-W02/g1-lint.txt
> eslint .

EXIT=0

$ cat loop/evidens/SN-W02/g2-tsc.txt
EXIT=0

$ tail -n 6 loop/evidens/SN-W02/g3-test.txt
 Test Files  210 passed (210)
      Tests  3168 passed | 1 todo (3169)
   Start at  18:33:23
   Duration  207.83s (transform 20.08s, setup 0ms, import 54.61s, tests 625.25s, environment 64ms)

EXIT=0

$ tail -n 3 loop/evidens/SN-W02/g4-build.txt

[32m✓ built in 198ms[39m
EXIT=0
```

Testantall før: 3168 passert + 1 todo (per `loop/verdicts/SN-W01-f1.md:19`). Testantall
etter: 3168 passert + 1 todo. Diff = 0. Docs-only oppgave — ingen testendring forventet.

## Portdekning (Type E + globale)

| ID | Krav | Dekning |
| --- | --- | --- |
| G1 | Lint rent | `g1-lint.txt` EXIT=0 |
| G2 | Typer rene | `g2-tsc.txt` EXIT=0 |
| G3 | Tester grønne, ikke færre | `g3-test.txt` 3168 pass + 1 todo, EXIT=0 (uendret fra baseline) |
| G4 | Bygget går | `g4-build.txt` EXIT=0, hovedapp + bare-app bygget |
| G5 | Diffen avgrenset | 4 filer, kun oppgavens filer: `docs/DECISION-LOG.md`, `loop/DOD-SNUDLY.md`, `loop/ARBEIDSLISTE-SNUDLY.md`, `loop/LEDGER.md`. Denne requestens follow-up-commit legger til evidens/request/handover; BATON i egen tredje commit |
| G6 | Commit sporbar | Begge materialcommits (`e34a23f`, `dacfa24`) starter med `SN-W02: `, har `Review-Request: SN-W02` og `Forsoek: 1`. Ingen `[admin]`-commits i pakken (per Codex SN-W01 f1 funn 3) |
| G7 | Ingen hemmeligheter | Diffen inneholder ingen nøkler, tokens eller privatnøkler |
| G8 | Ingen rester | Ingen `console.log`, `debugger` eller umerket `TODO` — docs-only |
| G9 | Avhengigheter begrunnet | `package.json`/lockfile ikke berørt |
| G10 | Evidens vedlagt | G1–G4-output limt inn og tilhørende filer committes i follow-up |
| E1 | Sant ved skrivetidspunkt | Alle produkt-IDer, gruppe-ID, entitlement, prisreferanser og motstrid-utsagn er verifisert mot `loop/referanse/EIER-FUNN-PROVISJONERING-2026-08-14.md` og `loop/referanse/EIERVEDTAK-BETALING-2026-08-14.md`. Play-status er nedgradert til «RevenueCats Play-side viser ingen produkter — Play Console selv er ikke åpnet» per rødt-lag-fix funn 1 |
| E2 | Datert og kildeført | Ny entry har 2026-08-14-header og siterer begge primærkilder eksplisitt |
| E3 | Motstrid håndtert | Ny «Motstrid håndtert (E3)»-blokk enumererer tre punkter i 2026-07-15 «Prismodell» som overstyres (produkt-ID, priser, kvartal) pluss to delbeslutninger som håndteres eksplisitt (Barnetiden, spar-badge). E-2-Merks utdaterte oppgaveeierskap er også eksplisitt supersedert |

## Avgjørelser underveis

**Ruling · Barnetiden-ID er ikke reinnsatt i paywall, kun vernet.** C2 verner
`babyora_barnetiden_499` fordi ID-en er faktisk provisjonert (angrefrist null hos
Apple), men EIERVEDTAK-BETALINGs «Utenfor dette vedtaket»-seksjon holder
Barnetiden-retningen åpen — den forblir droppet fra paywallen per 2026-07-15-entryen
inntil eier bestemmer noe annet. Alternativet ville vært å utelate `babyora_barnetiden_499`
fra C2, men det ville frata Apple-relaterte angreanførende beskyttelse for en
produsert ID. Kostnad hvis feil: en fremtidig retning som sletter Barnetiden-ID måtte
gå via eier-eskalering — ønskelig, ikke problem.

**Ruling · Ingen redigering av signert 2026-07-15-entry.** Den entryen har allerede en
SUPERSEDED-banner på faktapåstanden (satt av SN-005). Selve retningsvalget som
erstatter juni-provisjoneringen står i den nye 2026-08-14-entryen, ikke som ny
SUPERSEDED-linje der. Følger LOOP-PROTOKOLL.md §2 «En signert fil redigeres aldri»
og E3-kravet om at motstrid skal *stå eksplisitt* i det nye dokumentet.

**Ruling · «Angrefristen er null» beholdt i C2.** Formuleringen er ny (ikke direkte
sitert fra kildene), men speiler både `docs/DECISION-LOG.md:29` («Angrefristen er null»
i 2026-08-14 V4-entry) og E-2-entryens rasjonale. Beholdt fordi den forklarer *hvorfor*
regelen finnes, ikke bare hva den sier.

## Avvik fra mock eller designsystem

Ingen. Type E — kun dokumenter.

## Selvsjekk

**§1 Porter fanget til fil:** ✓ G1–G4 kjørt etter siste materialcommit `dacfa24`,
output i `loop/evidens/SN-W02/g[1-4]-*.txt` med `EXIT=0` per fil.

**§2 Rødt lag (agentId `abca7887de7711144`):** fant 4 funn:
1. E1 «Play Store: ingen produkter» overspesifisert. Rettet: nedgradert til
   «RevenueCats Play-side viser ingen produkter — Play Console selv er ikke åpnet»
   med kildehenvisning.
2. E3 «Barnetiden droppet» og «Spar-badge 49→36» fra 2026-07-15 ikke enumerert.
   Rettet: eksplisitt håndtering i «Motstrid håndtert»-blokken.
3. E3 E-2-Merks eierskapsangivelse (SN-003/SN-030/SN-033) utdatert. Rettet:
   eksplisitt supersedering, retning eies nå av SN-W01/W02/W03.
4. E1 V4-parafrase blandet 99-fallback med V1s kvartalfjerning. Rettet: 99 kr merket
   som del av kvartalens fallback som fjernes med V1.

Alle fire rettet i commit `dacfa24` før overlevering.

**§2b Påstandsrevisjon (agentId `ae2246a416b2c19ee`):** INGEN AVVIK. Verifiserte:
- Produkt-IDene `babyora_yearly_299`, `babyora_monthly_49`, `babyora_barnetiden_499`
  mot EIER-FUNN §1/§3 — stavemåte identisk.
- Abonnementsgruppe «Babyora Pluss» + gruppe-ID `22131969` mot §1.
- Entitlement `premium` mot §2.
- V1–V6 punktvis mot EIERVEDTAK-BETALING linje 11–77 — alle seks korrekt gjengitt.
- DoD C2 før-tekst matcher faktisk før-linje i diffen.
- 2026-07-15 «Prismodell» tittel og innhold matcher `docs/DECISION-LOG.md:338`.
- C1 (bundle-id `no.klemeg.app`) urørt i DoD-diffen.
- LEDGER-tidsstempel `2026-08-14T16:20:48Z` matcher `date -u +%Y-%m-%dT%H:%M:%SZ`.

**Erklæring per SELVSJEKK-BYGGER.md §2b Type C-krav (analog):** Selv om SN-W02 er Type
E, berører den beslutninger som styrer Type C-arbeid. Erklærer eksplisitt: **ingen
endringer utført i App Store Connect, Play Console eller RevenueCat.** Kun lokal Git.

## Det jeg er minst trygg på

To ting:

1. **E-2-Merk-oppdateringen kan tolkes som redigering av en «signert» entry.** E-2-Merk
   står i 2026-08-14-seksjonen (skrevet av SN-005), og jeg redigerer den ikke direkte —
   jeg legger en supersedering-linje i den *nye* entryen som viser til E-2-Merks
   utdaterte eierskap. Alternativet (redigere E-2-Merk in-place) ville brutt
   «signert fil redigeres aldri». Alternativet (la E-2-Merk stå usagt om) ville brutt
   E3 (stilltiende overstyring innad i samme dato-seksjon). Jeg valgte det tredje:
   eksplisitt supersedering i det nye dokumentet. Kontrollør kan mene at dette er en
   redigering skjult som en «henvisning», eller at E-2-Merk aldri var «signert» og
   kunne vært rettet direkte.

2. **C2s dekning av `babyora_barnetiden_499` er ikke direkte foreskrevet av vedtaket.**
   Vedtakets V6.1 sier «verne om de faktisk provisjonerte ID-ene» og §3 lister
   Barnetiden separat som «utenfor abonnementsvedtaket». Barnetiden ER provisjonert,
   så den faller under V6.1s ordlyd, men den er også eksplisitt utenfor
   abonnementsvedtakets scope. Jeg tolker det slik at «utenfor scope» gjelder
   retningsvalget (behold/dropp/slett), mens vernet av selve ID-en er en universell
   provisjoneringsregel — samme klasse som bundle-id. Kontrollør kan mene at
   Barnetiden burde vært utelatt fra C2 og heller ha egen linje eller ingen linje.
