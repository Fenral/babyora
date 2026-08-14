# SN-005 · Kartlegging (byggerens arbeidsnotat)

Laget mens SN-001 f2 er hos Codex. Committes sammen med SN-005 hvis den fortsatt
er nyttig; ellers slettes den. Ikke autoritativ.

## Mål

Registrer eierbeslutningene fra `loop/EIERVEDTAK-LOOP-2026-08-14.md` i
`docs/DECISION-LOG.md`, og marker eldre entries som er overstyrt.

## DECISION-LOG format

- Overskrift `# Decision log`
- Datoseksjoner `## YYYY-MM-DD`, nyeste først
- Hvert vedtak har `### Kortnavn` + `**Decision:**` + `**Reason:**` (+ evt. Kostnadsgrense/Restrisiko/Merk)
- Ingen dato i selve tekstblokken, kun i seksjonstittelen

## Vedtak som skal inn i `## 2026-08-14`

- **V3 · E-1 designkonflikten avgjort:** `snudly-mock.html` er fasit — fire faner, lys standard. Overstyrer design-lab-beslutninger 31.07.2026 (tre faner, dark-first, retning B «Scenen»). Design-lab-artefaktene dømmes i SN-009.
- **V4 · Autonomi og 500 kr-grense:** loopen har fullt mandat i byggegrenen (commit + push). Grense NOK 500. Overstyrer GSD-fullmakten 24.07.2026 (NOK 1000). Fire irreversible handlinger krever eskalering: Play-produkt-ID-opprettelse, App Store-innsending, sletting av data/grener, endring av bundle-id/Apple-produkt-IDer.
- **E-2 · Visningsnavn Snudly:** Snudly er visningsnavn i alle brukersynlige flater (UI, App Store-listing, Play-listing). Bundle-id `no.klemeg.app` og Apple-produkt-IDene `no.klemeg.app.monthly/quarterly/yearly` **endres aldri** — Snudly-byttet skjer kun i visningsnavn og butikktekst.

V1 (loop-start) og V2 (arbeidsflate) er prosessvedtak, ikke produktvedtak — hører til i `LEDGER.md` og eiervedtaksfilen, ikke DECISION-LOG. Kan nevnes kort i en «Loop kickoff»-entry hvis eier vil.

V5 (Opus 5 som hovedmodell) er en modellbeslutning for byggerinnsatsen, ikke en produktbeslutning. Utelates fra DECISION-LOG.

## Entries som må markeres SUPERSEDED

- `docs/DECISION-LOG.md:256–261` — «North-Star designretning: Retning B ‘Scenen’» (2026-07-14). Overstyres av V3.
- `docs/DECISION-LOG.md:263–269` — «Fem-foreldre-porten frafalt» (2026-07-14). Sjekk om dette faktisk overstyres; kan være uavhengig av E-1.
- `docs/DECISION-LOG.md:48–51` — Kostnadsgrense NOK 1000 (2026-07-24). Overstyres av V4.

Markering: legg til `> **SUPERSEDED 2026-08-14** — se V3/V4-entries under 2026-08-14, samt `loop/EIERVEDTAK-LOOP-2026-08-14.md`.` under Reason-avsnittet, ikke slett den originale entryen.

## Snudly-navnet i historikken

- `docs/DECISION-LOG.md:215–219` (2026-07-15) — «Offentlig navn: Babyora, naming-porten lukket». Overstyres delvis: Babyora er bundle-id/teknisk navn, Snudly er visningsnavn. Legg til en E-2-entry som klargjør skillet.
- `loop/EIERVEDTAK-LOOP-2026-08-14.md` V2 — nevner Snudly implisitt (byggegrenen heter `snudly/bygg`).
- `loop/referanse/SNUDLY-DESIGNSYSTEM.md` — «Gjelder fra: 13.08.2026. Navnebytte Babyora → Snudly er gjennomført i mocken.»

## Plan for SN-005 (før overlevering)

1. Åpne `docs/DECISION-LOG.md`, sjekk at nyeste dato-seksjon er før 2026-08-14.
2. Legg til ny seksjon `## 2026-08-14` øverst med tre entries: **E-1 designkonflikten avgjort (V3)**, **Autonomi og kostnadsgrense (V4)**, **Visningsnavn Snudly (E-2)**.
3. Legg til `> **SUPERSEDED 2026-08-14** — se entries under 2026-08-14, samt `loop/EIERVEDTAK-LOOP-2026-08-14.md`.` under Reason i de tre overstyrte entries (`:48–51`, `:256–261`, evt. `:263–269`).
4. Ikke rør andre entries.
5. Kjør G1–G4 + rødt lag (E-porter: E1 sant, E2 datert, E3 motstrid håndtert).
6. Skriv `requests/SN-005-f1.md`.

## Åpne spørsmål

- Er «Fem-foreldre-porten frafalt» (`:263–269`) faktisk overstyrt av V3, eller er det uavhengig? Les entryen først, avgjør ved SN-005-utførelse.
- Skal V1 og V2 (prosessvedtak) inn i DECISION-LOG i det hele tatt? Standardvalg: nei, de hører til LEDGER + EIERVEDTAK-filen.

## Beslutninger ved SN-005 f1-utførelse (2026-08-14)

- **«Fem-foreldre-porten frafalt» IKKE markert SUPERSEDED.** Entryen handler om
  en brukertest-port for R7/R12, ikke om selve designretningen. V3 (mocken som
  fasit) overstyrer designretningen, men porten er ortogonal: ≤ 5 s-forståelse
  er fortsatt et gyldig krav uansett designfasit. Ingen ny mock-basert brukertest
  er beskrevet i eiervedtaket. Å markere entryen SUPERSEDED ville implisere at
  brukertest-kravet er falt bort, noe eier ikke har sagt.
- **V1 og V2 utelatt fra DECISION-LOG.** V1 (loop starter) er prosessvedtak
  registrert i `loop/LEDGER.md` og `loop/EIERVEDTAK-LOOP-2026-08-14.md`.
  V2 (fersk klone, byggegren fra 71084992) er utviklingsflate, ikke produkt.
- **V5 (Opus 5) utelatt.** Modell-/innsatsstyring hører i
  `loop/PROMPT-CLAUDE-CODE-BYGGELOOP.md`, ikke i produktloggen.
- **Provisjoneringsmerknaden lagt inn i E-2-entryen + SUPERSEDED-banner på
  2026-07-15-«Prismodell».** Første utkast la Merk-avsnittet inn i E-2 alene og
  lot 2026-07-15-«Prismodell»-entryen stå urørt. Rødt lag F2 påpekte at
  stilltiende overstyring er nøyaktig det E3 forbyr; entryen fikk derfor en
  egen SUPERSEDED-banner som eksplisitt sier at faktapåstanden om
  `no.klemeg.app.*`-provisjonering er motbevist av eier-funn-filen. Rettelsen
  av selve kode/konsoll-avviket eies fortsatt av SN-003s erstatningsoppgave
  og SN-030/SN-033, ikke av SN-005.
- **2026-07-15-entryen «Offentlig navn: Babyora» fikk SUPERSEDED-banner.**
  Første utkast lot entryen stå urørt og klargjorde skillet kun via
  krysshenvisning fra ny E-2-entry. Rødt lag F3 påpekte at en leser som stopper
  på 2026-07-15-entryen får feil beslutning, og at E3-mønsteret satt av de to
  andre SUPERSEDED-bannerne krever samme behandling. Banneren markerer
  visningsnavn-delen som overstyrt av E-2 og peker på SN-006/SN-011/SN-012 som
  implementeringsoppgaver; bundle-id-arven er eksplisitt bevart.
- **E-2 hovedtekst omformulert etter rødt lag F1.** Første utkast sa
  «Bundle-id `no.klemeg.app` og Apple-produkt-IDer skal ikke endres uten
  eier-eskalering». Rødt lag F1 påpekte at hovedteksten dermed hevder noe som
  Merk-avsnittet motbeviser (Apple-produkt-IDene i formen `no.klemeg.app.*`
  finnes ikke). Hovedteksten er nå omskrevet til å beskytte «de faktisk
  provisjonerte» IDene (hva de nå måtte hete), med eksplisitt peker til
  Merk-avsnittet for hvilke IDer det gjelder i dag. Bundle-id-en `no.klemeg.app`
  er merket som verifisert korrekt via eier-funn-filens §1.
