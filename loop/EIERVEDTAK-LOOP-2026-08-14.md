# Eiervedtak · byggeloop og fire låsninger — 14.08.2026

Fattet av Sivert i Cowork-sesjon 14.08.2026. Registreres her fordi to av vedtakene overstyrer tidligere låste beslutninger, og ett overstyrer en protokoll fattet samme dag.

## V1 · Loopen starter nå

Byggeloopen starter umiddelbart på hele arbeidslisten. Den venter ikke på ChatGPT Works plandom.

**Overstyrer:** `PROMPT-FABLE-WORK-PLANSJEKK-2-RUNDER.md`, som forutsatte at arbeidet ventet på Works kritikk.

**Konsekvens:** Works kontroll av `SNUDLY-LANSERINGSPLAN-V2.md` fortsetter parallelt. Funnene behandles som endringsordrer med prefiks `SN-W###` i arbeidslisten, ikke som en stopp. Unntak: sikkerhets-, personvern- eller betalingsblokkere stopper loopen umiddelbart.

**Risiko eier har akseptert:** arbeid utført før dommen kan måtte gjøres om hvis Work avdekker et feil premiss i planen.

## V2 · Arbeidsflate

Loopen arbeider i en fersk klone av `Fenral/babyora`, på grenen `snudly/bygg` fra `71084992fecb3722c7f900b80ae7152050eeec0e`.

**Begrunnelse:** den lokale arbeidskopien står på `776a91f` fra 24. juli, to uker bak, og inneholder samtidig `discussion/`-mappen som ikke finnes på GitHub. En fersk klone skiller byggingen fra prosesshistorikken og fjerner risikoen for at gamle lokale endringer blandes inn.

**Åpent punkt:** `discussion/` finnes fortsatt bare på eiers disk. Den bør committes og pushes uavhengig av loopen.

## V3 · Designkonflikten E-1 er avgjort

`snudly-mock.html` er fasit: fire faner, lys som standard.

**Overstyrer:** repoets design-lab-beslutninger av 31.07.2026 om tre faner og dark-first, samt retning B «Scenen».

**Konsekvens:** design-lab-artefaktene dømmes mot mocken i SN-009 og forkastes der de er uforenlige. `DECISION-LOG.md` oppdateres i SN-005.

## V4 · Autonomi og kostnadsgrense

Loopen har fullt mandat i byggegrenen, inkludert commit og push. Grensen går ved **500 kr**: ethvert steg som koster mer, avklares med eier først.

**Overstyrer:** GSD-fullmakten av 24.07.2026 med kostnadstak på 1000 kr.

**Tillegg fra Fable, som eier kan stryke:** loopen eskalerer også ved fire handlinger som er irreversible uten å koste penger — opprettelse av Play-produkt-IDer, innsending til App Store, sletting av data eller grener, og endring av bundle-id eller Apple-produkt-IDer. Begrunnelsen er at angrefristen er null, ikke at mandatet er uklart.

**Ytterligere stoppgrunn:** tre underkjente forsøk på samme oppgave. Videre forsøk er sløsing; problemet ligger da i oppgaven eller planen.

## V5 · Modellgrunnlag

Fable 5 er utilgjengelig. Opus 5 er hovedmodell for bygging, med maksimal innsats på motor, betaling, personvern og sikkerhet. Sonnet og Haiku brukes kun på mekaniske deloppgaver med tydelig fasit. Codex kontrollerer med maksimal innsats på motor og betaling. Ingen agent godkjenner eget arbeid.
