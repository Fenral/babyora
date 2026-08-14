# Arbeidsliste · Snudly til App Store

Dette er definisjonen av «ferdig produkt». Loopen kjører til hver rad står `FERDIG` og `SN-FINAL` er bestått.

**Statusverdier:** `KLAR` (kan tas) · `PÅGÅR` · `TIL KONTROLL` · `UNDERKJENT` · `FERDIG` · `BLOKKERT` · `EIER`

**Type** peker til portsettet i `DOD-SNUDLY.md`. **Avh.** er oppgaver som må stå `FERDIG` først.

Claude Code oppdaterer statusfeltet. Ingen andre rører det. Nye oppgaver som følger av Works plandom får prefiks `SN-W`.

---

## Fase 1 · Grunnlag og sannhet

| ID | Oppgave | Type | Avh. | Status |
| --- | --- | --- | --- | --- |
| SN-001 | Klone `Fenral/babyora`, opprett gren `snudly/bygg` fra `7108499`, opprett `loop/`-strukturen, verifiser grønn baseline (G1–G4) | E | — | FERDIG |
| SN-002 | Fjern den utdaterte mismatch-kommentaren i `src/lib/billing/revenuecat.ts`; bekreft at `src/lib/premium/products.ts` bruker `no.klemeg.app.*` | C | SN-001 | FERDIG |
| SN-003 | Avstem `STATUS.md`: merk hver påstand som `VERIFISERT` eller `ANTAKELSE`, daterte kilder | E | SN-001 | BLOKKERT |
| SN-004 | Avstem `NEXT-STEPS-APPLE-REVENUECAT.md` og `docs/APP-STORE-IAP-SETUP.md` mot faktiske produkt-IDer | E | SN-003 | KLAR |
| SN-005 | Registrer eierbeslutningene (Snudly-navnet, E-1 mock vinner, loop-mandatet, 500 kr-grensen) i `docs/DECISION-LOG.md` | E | SN-001 | KLAR |
| SN-006 | Navnesjekk Snudly: App Store, Play, domene, varemerke, håndtak → rapport med GO/NO-GO *(workflow W1)* | E | SN-001 | KLAR |
| SN-007 | Døm `feat/hjem-list-detail-sheet`, `feat/kontekstvalg-hjem`, `agent/babyora-polish-slide` mot mocken → behold/endre/forkast per gren *(workflow W-GREN)* | E | SN-001 | KLAR |
| SN-008 | Én sannhet om prøveperiode: rett kode, kommentarer og paywall-tekst til 7 dager på alle planer | C | SN-002 | KLAR |
| SN-009 | Døm design-lab-overleveringen mot mocken; forkast det uforenlige, dokumenter hva som beholdes | E | SN-007 | KLAR |

## Fase 2 · Snudly-identitet i appen

| ID | Oppgave | Type | Avh. | Status |
| --- | --- | --- | --- | --- |
| SN-010 | Innfør designsystemets tokens i CSS-laget; lukk de åtte avvikene fra `SNUDLY-DESIGNSYSTEM.md` kap. 7 | A | SN-001 | KLAR |
| SN-011 | Visningsnavn til Snudly: `Info.plist`, `strings.xml`, `capacitor.config.ts`, i18n-strenger. Bundle-id og produkt-IDer urørt | A | SN-005 | KLAR |
| SN-012 | Navnesveip i all brukersynlig tekst; klassifiser hver treff som endre / aldri endre / usikker *(workflow W3)* | A | SN-011 | KLAR |
| SN-013 | Komponent: ikonknapp og situasjonsmerke (status, ikke knapp) | A | SN-010 | KLAR |
| SN-014 | Komponent: segmentkontroll, med avatarvariant for profilbytte | A | SN-010 | KLAR |
| SN-015 | Komponent: rad og kort, hårstrekkant, chevron som eneste åpne-affordance | A | SN-010 | KLAR |
| SN-016 | Komponent: ark (bottom sheet) og toast | A | SN-010 | KLAR |
| SN-017 | Fanestruktur: fire faner iht. mocken (Hjem, Planlegg, Verktøy, Familie) | A | SN-013 | KLAR |
| SN-018 | Hjem til mock-paritet: værkort, situasjonsmerke, hengende avatar forankret til listen, årsak i undertittel, neste-klesbytte-rad | A | SN-017 | KLAR |
| SN-019 | Planlegg: tidssone-graf med lag-soner delt ved klesbyttet, trykkbar markør, differanselinje | A | SN-017 | KLAR |
| SN-020 | Verktøy: levende værkalkulator-chip, lettere rader, sist brukt, motor-kobling forklart | A | SN-017 | KLAR |
| SN-021 | Familie: ring-layout, avatar i senternode, sekundær inviter-knapp, materialpreferanse med scroll-hint | A | SN-017 | KLAR |
| SN-022 | Onboarding restyles til Snudly; avgjør K0 mot K3 og bygg vinneren | A | SN-013 | KLAR |
| SN-023 | met.no-kreditering synlig der værdata vises | D | SN-018 | KLAR |
| SN-024 | Veiledende forbehold synlig i alle flater som gir påkledningsråd | D | SN-018 | KLAR |
| SN-025 | Mørk modus: paritet på alle fire faner, kontraster målt | A | SN-021 | KLAR |

## Fase 3 · Kjøpsflyt

| ID | Oppgave | Type | Avh. | Status |
| --- | --- | --- | --- | --- |
| SN-030 | RevenueCat-nøkler og `VITE_FORECAST_PROXY` inn i native byggekonfigurasjon (kun konfig, ingen konsoll) | C | SN-002 | KLAR |
| SN-031 | Paywall-tekst til Snudly, sannferdig mot bygde funksjoner | D | SN-008 | KLAR |
| SN-032 | Vær-proxy: eierskap, URL og feilstat ved nedetid dokumentert og håndtert i klienten | E | SN-030 | KLAR |
| SN-033 | Sandbox-kjøp på fysisk enhet: configure → offering → kjøp → entitlement → restore | C | SN-030 | EIER |

## Fase 4 · Innsendingsmateriale

| ID | Oppgave | Type | Avh. | Status |
| --- | --- | --- | --- | --- |
| SN-040 | `PRIVACY.md` ferdigstilles: dato, org.nr, kontakt, Snudly-navn, jurist-sjekk bestilles | D | SN-005 | KLAR |
| SN-041 | Stryk eller bygg Supabase-løftene i personvernteksten; teksten skal matche faktisk lagring | D | SN-040 | KLAR |
| SN-042 | `STORE-LISTING.md` til Snudly; fjern løfter om ubygde funksjoner | D | SN-041 | KLAR |
| SN-043 | Seks App Store-skjermbilder i Snudly-design, 1290×2796 *(workflow W4)* | A | SN-025 | KLAR |
| SN-044 | Krasjrapportering på plass, med personvernomtale som stemmer | E | SN-010 | KLAR |
| SN-045 | Review-notater: hvordan reviewer tester prøveperiode og paywall, og hvordan råd for spedbarn er avgrenset | D | SN-042 | KLAR |
| SN-046 | Support-side og personvern-URL publisert og lenket fra appen | D | SN-040 | KLAR |

## Fase 5 · Herding

| ID | Oppgave | Type | Avh. | Status |
| --- | --- | --- | --- | --- |
| SN-050 | VoiceOver gjennom alle fire faner og onboarding | A | SN-025 | KLAR |
| SN-051 | Dynamic Type til største trinn uten avkuttet innhold; avatarens oppførsel ved store skrifter | A | SN-025 | KLAR |
| SN-052 | Feilstater: uten nett, vær-proxy nede, lokasjon avslått, tom familie *(workflow W5)* | A | SN-032 | KLAR |
| SN-053 | Ytelse på eldre enhet: oppstartstid, ingen hakking i fanebytte og graf | A | SN-025 | KLAR |
| SN-054 | Ekstern TestFlight-beta med familier i faktisk vær | E | SN-053 | EIER |

## Fase 6 · Innsending

| ID | Oppgave | Type | Avh. | Status |
| --- | --- | --- | --- | --- |
| SN-060 | Release-kandidat: merge godkjente grener, tag, kodefrys-regel | E | SN-054 | KLAR |
| SN-061 | App Store Connect: priser, lokalisering og review-informasjon per abonnement | C | SN-060 | EIER |
| SN-062 | Innsending med gradvis utrulling | C | SN-061 | EIER |

## Fase 7 · Android, etter iOS

| ID | Oppgave | Type | Avh. | Status |
| --- | --- | --- | --- | --- |
| SN-070 | Keystore i Codemagic, grønt Android-bygg, tag-basert versjonering | E | SN-062 | EIER |
| SN-071 | `.aab` til intern testing i Play Console | C | SN-070 | EIER |
| SN-072 | Opprett de tre Play-abonnementene med endelig prefiks — irreversibelt, staves én gang | C | SN-071 | EIER |
| SN-073 | Rekoble RevenueCats Play-produkter fra døde `klemeg_premium_*` | C | SN-072 | EIER |
| SN-074 | Play-butikktekst og skjermbilder | D | SN-073 | KLAR |

## Fase 8 · Sluttdom

| ID | Oppgave | Type | Avh. | Status |
| --- | --- | --- | --- | --- |
| SN-FINAL | Bred sluttgjennomgang av hele grenen mot sluttporten i `DOD-SNUDLY.md` — kjøres etter at hver rad over står `FERDIG` | E | SN-074 | KLAR |

---

## Merknader

Oppgaver merket `EIER` krever fysisk enhet, konsolltilgang eller penger, og starter ikke av seg selv. Loopen hopper over dem og går videre til neste `KLAR`-oppgave uten avhengighet til dem. Når loopen møter en oppgave hvis eneste hindring er en `EIER`-oppgave, skriver den en eskalering og fortsetter nedover listen.

Fase 7 begynner ikke før iOS er innsendt. Rekkefølgen er bevisst: Android-kjeden er lang, seriell og full av irreversible steg.
