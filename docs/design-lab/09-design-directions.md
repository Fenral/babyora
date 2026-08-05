# 09 — Three Radical Directions (Fase 7)

> Utført 2026-08-05 av Claude (CD/TL) med tre retningsagenter (278k tokens) på de 12
> invariantene som felles grunnlov og B-rammen (gratis sikkerhetskjerne) fra eierport 1.
> Fullbeskrivelser med retningskort, risikoer m/falsifiseringstester og feasibility i
> `appendix/fase7/`. Status: **TIL SOL-SCORING**, deretter fase 8 (feasibility-matrise →
> eierport 2: endelig designretning).

## 1. De tre beslutningsarkitekturene (Sols portkrav: arkitektur, ikke stil)

| | **PROTOKOLLEN** (gir et svar) | **CONFIDENCE INSTRUMENT «Spennet»** (diagnostiserer) | **AMBIENT BRIEFING** (leverer endring uten appåpning) |
| --- | --- | --- | --- |
| Kjerneidé | Svaret er en utførbar sikkerhetsprotokoll: neste handling → kontrollpunkt → stoppkriterium; skjermen UTFØRES, ikke leses | Varmespennet: trygt intervall med hardt Kaldgulv og mykere Varmetak (inverteres ved vogn-søvn); antrekk dømmes som posisjon, aldri score | Versjonert, utløpende «brief» (delta + handling + gyldighet + kvittering) identisk på widget/varsel/omsorgskort/app; selv-degraderende ved utløp |
| Arkitektur-signatur | To moduser systemvalgt: flow-så-verifiser (normal) / les-utfør-bekreft (avvik) + degradert fallback; tilstandslinje «Vanlig dag / Følg med / Avvik» | Situasjonsrouter som hjem (fire jobb-dører); svakeste premiss alltid synlig; korrigering i rådets egne premisser med scope-kvittering | Hjem ER briefen zoomet + distribusjonsstatus; to flater totalt (Brief + Konfigurasjon); planlegging = kveldsbrief |
| Unngår kort/chip-dashbord | ✅ (konstituerende: lagstabel i påkledningsrekkefølge, lagsnitt-figur) | Delvis (instrument, ikke kort) | Delvis (stempellinje-form) |
| Usikkerhet | Kontrollfrekvens, ikke tall (PEWS-innsikten) | Fysisk terreng som spiser av spennet (INV-4, Babyora-eid) | Navngitt intervall + synlig referansepunkt |
| Produktrisiko (én, m/test) | Utførelsespremisset: vil foreldre UTFØRE, ikke bare lese? Felles hvis utførelse ikke slår liste på korrekt håndtering | Intervallet kan gi oversettelsesjobben tilbake og ØKE beslutningstid/uro; felles mot punktliste+nullmodell | Delta som tilstrekkelig trygg beslutningsenhet uten baseline-gjenlesing; felles hvis delta-alene gir dårligere håndtering |
| Representasjonsrisiko (én, m/test) | Lagsnittet kan avleses som måling av barnet; 85 %-terskel, teach-back på dukke | Instrumentfiguren avleses som måleapparat / asymmetri forveksles; ANSI-test ≥20 foreldre, én «trygt»-feillesning = tekst-først-omdesign | Maskert utløpt-tilstand leses som bug → widget slettes; to-delt forståelses-+atferdstest |
| Feasibility | MIDDELS — mest re-representasjon; protokollkompilator er nybygget; påkledningsrekkefølge mangler i datamodellen | MIDDELS — spenn-API i motoren + instrumentkomponent; lokal-only holder for kjernen | MIDDELS-HØY — widget-bro/varsellag finnes delvis; kort-backend (minimal Supabase) er arkitekturkostnaden; delta-push krever server |

**Felles for alle tre (fra invariantene og portene):** motorpipelinen urørt som sikkerhetslag;
`vognMode`/bilstol-HB-9 kables endelig; Planlegg-fanen, 3,2 s-seremonien og FinnAntrekk-
drillen skrotes; 2-felts onboarding med scope-port; lys-først for uteflater; maskoten aldri
avsender av verdikt; skamfri tekstdoktrine; sikkerhetslag gratis i alle tilstander;
stale = strukturell maskering, aldri dimming (sollys-kollaps).

## 2. DoD-status

- [x] Tre komplette, sammenlignbare retninger (alle masterprompt-felt dekket i appendiks)
- [x] Hver med nøyaktig én produktrisiko + én representasjonsrisiko med falsifiseringstest
- [x] Feasibility- og kostnadsanalyse per retning (fase 8 utdyper til beslutningsmatrise)
- [ ] Works prioriterte styrker/svakheter/avvisningsgrunner — sendes nå
- [ ] Ingen retning videre uten dokumentert begrunnelse — venter fase 8

## 3. Work-review

Sendt til Sol for scoring på originalitet, native UX, klarhet, tillit, emosjonell verdi,
premiumfølelse, betalingsvilje, retention, tilgjengelighet og differensiering — med
eksplisitt jakt på falsk differensiering og svake kompromisser. Verdikt:
`11-independent-review.md` runde 7.
