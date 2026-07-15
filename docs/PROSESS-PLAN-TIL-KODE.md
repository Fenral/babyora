# Prosess: fra plan til verifisert kode (Babyora)

**Status:** Gjeldende styringsprosess (eiergodkjent 2026-07-15).
**Formål:** Skape høy fremdrift uten å redusere kontrollen der feil kan skade
brukere, data, inntekter eller tillit.
**Hovedprinsipp:** Kontrollnivået skal følge risikoen. Alle endringer skal ha
bevis, men ikke alle endringer trenger samme mengde seremoni.

> Denne prosessen erstatter den tidligere uniforme verifikasjonsprosessen
> (`docs/superpowers/plans/2026-07-13-babyora-verification-protocol.md`, nå
> underordnet). Endringer i denne prosessen krever eiergodkjenning og
> synkronisering av berørte styringsdokumenter.

---

## 0. Styring og presedens

Når dokumenter er uenige, gjelder denne rekkefølgen:

1. `AGENTS.md`
2. `docs/CLAUDE-START-HERE.md`
3. `docs/DECISION-LOG.md`
4. `docs/CONVERSATION-CONTEXT.md`
5. `docs/CURRENT-HANDOFF.md`
6. Godkjente planer i `docs/superpowers/plans/`
7. Godkjente spesifikasjoner i `docs/superpowers/specs/`
8. Øvrige aktive dokumenter i `docs/`
9. Arkiverte utdata

Nyere eksplisitte eierbeslutninger skal føres i `docs/DECISION-LOG.md`. Når en
beslutning erstatter en eldre port eller regel, skal berørte aktive dokumenter
oppdateres ved neste naturlige dokumentasjonsmilepæl. Presedens skal være et
sikkerhetsnett, ikke den normale måten å håndtere motstridende dokumentasjon på.

### Grunnregler

- Analyse og planlegging gir ikke i seg selv tillatelse til å endre appkode.
- Eier kan godkjenne én oppgave eller en tydelig avgrenset pakke. Godkjente
  deloppgaver innenfor pakken trenger ikke ny godkjenning så lenge mål, risiko,
  kostnad og scope ikke endres.
- Ingen skal hevde at arbeid er ferdig uten ferske og relevante bevis etter
  siste endring.
- Deterministiske bevis — tester, bygg, lint, diff og direkte sikkerhetstester —
  veier tyngre enn modellens eller implementørens vurdering.
- Kontroll skal skaleres opp når risikoen øker. Høyrisikoarbeid kan aldri
  nedgraderes stille for å spare tid eller kostnad.
- En uavhengig PASS skal alltid knyttes til en uforanderlig kandidat-commit
  (`SHA`), ikke til en bevegelig arbeidskopi.

---

## 1. Minste nødvendige kontekst

Før en oppgave planlegges eller implementeres, leses bare den konteksten som er
nødvendig for å forstå gjeldende retning og berørt område:

1. `AGENTS.md`
2. `docs/CURRENT-HANDOFF.md`
3. relevante nyere beslutninger i `docs/DECISION-LOG.md`
4. oppgaven og dens godkjente spesifikasjon
5. relevante kontrakter, arkitekturbeslutninger og eksisterende kode
6. denne prosessen og eventuell fagspesifikk verifikasjonsprotokoll

Hele dokumentarkivet skal ikke leses på nytt for hver liten oppgave. Dersom den
minste kontekstpakken avdekker en reell konflikt, brukes presedensrekkefølgen og
konflikten dokumenteres før implementering.

En fresh-context-verifikator får ikke implementørens ønskede konklusjon, men må
få nok relevant systemkontekst til å oppdage brudd på arkitektur, kontrakter og
gjeldende eierbeslutninger.

---

## 2. Gate 0 — autorisasjon og Definition of Ready

Før første kodeendring skal følgende være kjent:

- ønsket bruker- eller systemutfall;
- konkrete akseptansekriterier;
- eksplisitte ikke-mål;
- risikoløype: lett, standard eller høy;
- berørte og tillatte filstier eller filtyper;
- forventede tester og runtime-/UI-tilstander;
- avhengigheter, åpne beslutninger og ekstern myndighet;
- utrulling, feature flag og rollback der risikoen krever det.

### Arbeidskopi

Arbeidskopien trenger ikke være tom, men alle eksisterende endringer må være
forklarte og holdes utenfor oppgaven. Ved overlapp brukes separat branch eller
git-worktree. Uforklarte eller overlappende brukerendringer er en stoppbetingelse.

Genererte filer, skjermbilder og audit-output skal enten:

- være deklarert som forventede artefakter;
- ligge i en ignorert mappe; eller
- fjernes fra oppgavens kandidat-diff uten å slette brukerens arbeid.

---

## 3. Velg risikoløype

Velg høyeste løype som utløses av endringen. Ved reell tvil velges ett nivå opp.

| Løype | Typiske endringer | Oppgavereview |
|---|---|---|
| **Lett** | Dokumentasjon, copy, isolert styling, testdata, ufarlig konfigurasjon og dev-only-verktøy uten produksjonseffekt | Egenverifikasjon per oppgave; uavhengig review kan samles i pakke-gaten |
| **Standard** | Vanlig UI, produktlogikk, komponenter, navigasjon, klienttilstand og reversible integrasjoner uten sensitive data | Fresh-context review av et sammenhengende kandidat-sett |
| **Høy** | Sikkerhet, anbefalingsmotor, RLS/auth, roller, betaling/entitlement, migrering, sletting, PII, lokasjon, varsling, scheduler, safety-copy eller produksjonsaktivering | Full uavhengig to-nøkkel-verifikasjon per oppgave |

### Automatisk eskalering til høy risiko

En oppgave er alltid høy risiko dersom den kan:

- endre et sikkerhets- eller helserelatert råd;
- gi en bruker tilgang til andre husholdningers data;
- gi eller fjerne betalt tilgang;
- miste, irreversibelt endre eller lekke data;
- eksponere PII i logger, analytics, push eller widgets;
- aktivere produksjonsmigrering, credentials eller ekstern betalt bruk;
- endre rollback-, feature-flag- eller guardrail-mekanismen;
- gjøre en paywall- eller personvernpåstand usann.

En oppgave som starter i lett eller standard løype, skal eskaleres straks nye
funn utløser et høyrisikokriterium.

---

## 4. Felles arbeidsflyt

```text
IDÉ
  │
GATE 0 — godkjent oppgave eller pakke
  │
DEFINITION OF READY — mål, kriterier, scope og risiko
  │
IMPLEMENTASJON — korte, verifiserte steg
  │
IMPLEMENTØRBEVIS — ferske relevante kontroller
  │
KANDIDAT-COMMIT — uforanderlig SHA
  │
REVIEW ETTER RISIKOLØYPE
  ├─ PASS    — lukk eller inkluder i pakke
  ├─ FAIL    — korriger og re-verifiser etter påvirkning
  └─ BLOCKED — dokumenter manglende myndighet/avhengighet
  │
PAKKE-/RELEASE-GATE — samlet integrasjon og brukerreise
```

### Tillatte statuser

- `PLANNED`
- `IN_PROGRESS`
- `READY_FOR_REVIEW`
- `READY_FOR_PACKAGE_REVIEW` — kun lett løype
- `PASS`
- `FAIL`
- `BLOCKED`

Implementøren kan ikke gi eget arbeid `PASS` i standard eller høy løype.
Implementøren kan merke lett arbeid `READY_FOR_PACKAGE_REVIEW` når alle
relevante kontroller er grønne.

---

## 5. Implementasjon og teststrategi

### 5.1 Når TDD kreves

Bruk test-først for observerbar atferd:

1. Skriv den minste testen som beskriver neste oppførsel eller reproduserer
   feilen.
2. Kjør testen og bekreft at den feiler av forventet grunn.
3. Implementer akkurat nok til grønt.
4. Kjør fokuserte tester.
5. Gjenta for neste oppførsel.

Ikke konstruer kunstige feilende tester for dokumentasjon, ren copy, visuelle
finjusteringer eller konfigurasjon uten testbar atferd. Bruk i stedet relevant
statisk kontroll, kontraktskontroll, skjermbilde eller manuell evidens.

### 5.2 Kommandoer under arbeidet

Under den indre implementasjonsløkken kjøres fokuserte tester. Full global suite
skal normalt ikke kjøres etter hvert lite red/green-steg.

Etter siste endring kjøres kontrollene som risikoløypen krever:

| Kontroll | Lett | Standard | Høy |
|---|---|---|---|
| Fokuserte tester eller relevant statisk kontroll | Ja | Ja | Ja |
| `git diff --check` og scope-kontroll | Ja | Ja | Ja |
| Lint for berørte filer / lint-delta | Ved kode | Ja | Ja |
| `npm test` | Ved atferd eller felleskode | Ja, én gang etter siste edit | Ja, både implementør og verifier |
| `npm run build` | Ved byggpåvirkning | Ja, én gang etter siste edit | Ja, både implementør og verifier |
| Relevant E2E-reise | Ved påvirket reise | Ved påvirket reise | Ja for påvirket domene |
| Domene-/sikkerhetstester | Nei | Ved behov | Alltid |

Hvis CI kjører nøyaktig samme deterministiske kontroll på kandidat-SHA-en, kan
verifikatoren referere til CI-resultatet i lett og standard løype. Høyrisiko-
kommandoer og direkte sikkerhetstester skal fortsatt kjøres eller inspiseres av
den uavhengige verifikatoren.

### 5.3 Scope og commits

- Én commit skal ha ett tydelig formål.
- En oppgave kan bruke flere ryddige kandidat-commits dersom det gjør review,
  rollback eller bisect tryggere.
- Pakken kan squash-merges dersom sporbarheten i evidensfilene beholdes.
- Nødvendige nye filer utenfor opprinnelig scope skal deklareres før de legges
  til. Uforklarte filer er scope-brudd; forklarte og nødvendige filer er ikke
  automatisk FAIL.

---

## 6. Visuell verifikasjon

Visuell kontroll skal følge hva endringen faktisk kan påvirke.

### 6.1 Berørt-tilstandsmatrise

For hver endret visuell flate dokumenteres:

- standardtilstanden;
- tilstander som er direkte endret;
- tilstander som med rimelighet kan ha fått regresjon;
- relevant viewport og tekstskalering;
- tastaturfokus, redusert bevegelse eller skjermleser når endringen berører
  interaksjon, animasjon eller semantikk.

390 × 844 brukes som fast mobilreferanse. Andre viewporter legges til når
endringen kan påvirke responsivitet, safe areas eller native innpakking.

### 6.2 Når full visuell matrise kreves

Full matrise med default, loading, error/offline, kald, mild, varm, stor tekst,
redusert bevegelse og tastaturfokus kreves for:

- ny eller vesentlig redesignet kjerneskjerm;
- endring i design tokens, global layout eller felles navigasjon;
- endring i temperaturreaktiv presentasjon;
- release-gaten for berørte hovedreiser;
- enhver oppgave der risikoanalysen eksplisitt krever full matrise.

En liten copy-, farge- eller spacingendring trenger ikke automatisk ni nye
fixtures dersom upåvirkede tilstander allerede har gyldig regresjonsdekning.

### 6.3 Menneskelig brukersjekk

Fem-foreldre-test eller tilsvarende kvalitativ brukersjekk er en milepælsgate,
ikke en obligatorisk port per skjerm eller komponent. Den brukes ved valg eller
vesentlig endring av North Star og anbefales før release av hovedreisen.

Gjeldende eierbeslutning om å frafalle testen som forhåndsport for R7 skal
respekteres. Restrisiko og eventuell forenklet release-sjekk dokumenteres.

Menneskelig review er fortsatt påkrevd for genererte avatarer, anatomi,
plaggidentitet, materiale, visuell sannhet og subjektiv merkevaretilpasning.

---

## 7. Uavhengig verifikasjon

### 7.1 Felles regler

- Implementøren oppretter kandidat-commit før uavhengig review.
- Verifikatoren vurderer eksakt SHA eller et eksplisitt SHA-intervall.
- Verifikatoren får oppgave, akseptansekriterier, relevant systemkontekst,
  denne prosessen og diffen — men ikke implementørens ønskede konklusjon.
- Verifikatoren rapporterer funn før eventuell kodeendring.
- Verifikatoren kjører eller validerer kontrollene som kreves av risikoløypen.
- Enhver endring etter PASS opphever PASS og krever ny kandidat-SHA.

### 7.2 Lett løype

- Implementøren dokumenterer relevante kontroller og kandidat-SHA.
- Oppgaven kan gå videre som `READY_FOR_PACKAGE_REVIEW`.
- Uavhengig review kan gjøres samlet i pakke-gaten.
- Oppgaven eskaleres til standard dersom bevisene krever kvalitativ vurdering,
  atferden er bredere enn forventet eller diffen ikke lenger er liten.

### 7.3 Standard løype

- Fresh-context reviewer vurderer ett sammenhengende endringssett.
- Reviewer kontrollerer kriterier, diff, tester, runtime og berørte visuelle
  tilstander.
- Full test/build skal være grønn på kandidat-SHA før PASS.
- Flere små oppgaver kan vurderes sammen dersom de tilhører samme brukerutfall,
  har samme risikoprofil og fortsatt gir en oversiktlig diff.

### 7.4 Høy løype

- Implementør og verifier skal være separate kontekster og bruke to-nøkkel-
  modellen definert for domenet.
- Alle globale og domenespesifikke kontroller kjøres ferskt.
- Rollback, feature flag, failure/recovery og misbrukstilfeller verifiseres.
- Ingen kritisk eller høy sak kan aksepteres stille.
- Manglende kvalifisert verifier, fysisk enhet, credential eller faglig
  myndighet gir `BLOCKED`, aldri en nedgradert PASS.

---

## 8. Re-verifikasjon etter FAIL

Re-verifikasjon styres av påvirkning, ikke bare av at et funn eksisterer.

| Funn/endring | Påkrevd ny kontroll |
|---|---|
| P0/P1, sikkerhet, data, betaling, migrering eller felleslogikk | Full ny implementør- og verifierrunde for løypen |
| Endring som påvirker flere moduler eller brukerreiser | Alle berørte tester/tilstander + full global sluttkontroll |
| Lokal P2/P3 uten delt atferd | Funnets berørte kontroller + diff-siden-sist + én global sluttkontroll før PASS |
| Kun dokumentasjonsretting uten atferdseffekt | Dokument-/lenke-/diffkontroll; ingen kunstig full app-suite |

Verifieren skal dokumentere hvorfor re-verifikasjonsomfanget er tilstrekkelig.
Hvis påvirkningen er uklar, brukes full runde.

---

## 9. Høyrisikogater

### 9.1 Sikkerhet og data

For familie, Supabase, betaling, kalibrering og varsling skal relevante tilfeller
inkludere:

- eier, guardian, caregiver, read-only, revoked og uautentisert;
- forsøk på tilgang på tvers av husholdninger;
- direkte database-/API-test av RLS, ikke bare skjult UI;
- invitasjons-replay, utløp, feil mottaker og samtidig aksept;
- forsøk på å gi rolle eller entitlement via klientkontrollert tilstand;
- migrerings-idempotens, rollback, konflikt, offline replay og sletting;
- søk etter PII i logger, analytics, push og widgets;
- relevante Supabase security/performance advisors;
- menneskelig beslutning før produksjonshemmeligheter, billing-produkter,
  destructive migrations eller eksterne produksjonsendringer aktiveres.

### 9.2 Safety og anbefalingsmotor

- Guardrails skal testes som kontrakter som ikke kan omgås av override,
  kalibrering eller fallback.
- Gullscenarioer og relevante randtilfeller skal være automatiserte og
  deterministiske.
- Safety-relatert copy og anbefaling skal stemme med faktisk motoratferd.
- Faglig review kreves der gjeldende plan eller eierbeslutning krever det.
- Manglende faglig signatur skal håndteres eksplisitt med blokkering, feature
  flag eller godkjent disclaimer — aldri med skjult antakelse.

### 9.3 Avatar og genererte assets

- Hvert produksjonsasset skal mappe én-til-én til dokumentert tilstand.
- Ukjent nøkkel skal gi nøytral fallback, aldri nearest-match-gjetting.
- Identitet, anatomi, synlige plagg, materiale, alpha, lys/skygge og mobilcrop
  kontrolleres menneskelig.
- Godkjent kostnadsramme og spend-logg skal følges.
- Manglende verifisert bilde skal ikke gjøre den visuelle fremstillingen mer
  autoritativ enn den tekstlige plagglisten.

---

## 10. Pakke- og release-gate

Pakke-gaten kjøres når et sammenhengende brukerutfall eller teknisk delmål skal
regnes som verifisert. Den skal ikke opprettes kunstig etter hver mikroskopiske
endring.

Fra ren checkout av kandidat-SHA eller kandidat-intervallet:

- kjør komplett test, build, lint og relevante audit-kommandoer;
- gjennomgå samlet diff for interaksjoner som oppgavereview kan ha oversett;
- kjør ende-til-ende brukerreiser, inkludert feil og recovery;
- gjennomgå alle lette oppgaver som kun var `READY_FOR_PACKAGE_REVIEW`;
- bekreft at dokumentasjon, analytics-allowlist, personverncopy, feature flags,
  paywall og runtime-atferd samsvarer;
- utfør påkrevd fysisk iOS-/Android-, VoiceOver-, haptikk- og tekstskaleringstest;
- bekreft at ingen credentials, secrets, build-output eller uvedkommende filer
  inngår;
- produser én pakkeevidens med lenker til oppgaver, kandidat-SHA-er og funn.

Pakken får `VERIFIED` først etter uavhengig pakke-PASS. Release krever i tillegg
at alle eksterne App Store/Play-, personvern-, pris- og provisioningporter enten
er lukket eller eksplisitt dokumentert som release-blokkerende.

---

## 11. Modell- og reviewer-ruting

Prosessen definerer kapabilitetsnivåer; konkrete modellnavn er en operasjonell
mapping som kan oppdateres uten å omskrive kvalitetsreglene.

| Kontrollnivå | Krav |
|---|---|
| Mekanisk | Egnet for ren dokumentasjon og deterministisk transformasjon; kan ikke gi standard/høy PASS |
| Standard | Sterk kode-/produktmodell i fresh context; kan gi standard PASS |
| Høy implementering | Høyeste godkjente kapabilitetsnivå for domenet |
| Høy verifikasjon | Separat høyeste godkjente modell/reviewer; kan ikke være implementeringskonteksten |
| Menneskelig/faglig | Påkrevd for subjektiv visuell sannhet, ekstern safety-vurdering og produksjonsmyndighet |

Gjeldende operasjonelle mapping beholdes inntil den erstattes eksplisitt:

- Sonnet 5 Medium: mekanisk dokumentasjon;
- Sonnet 5 High: vanlig produkt/UI og standard review;
- Fable 5 Extra: safety, Motor V2, RLS/auth, entitlement, kalibrering og
  scheduler/personvern;
- Opus 4.8 Extra: godkjent separat fallback/reviewer for høy risiko.

En utilgjengelig standardmodell kan erstattes av en likeverdig godkjent modell
og fresh-context review. Høy risiko skal stoppes dersom godkjent høyt
kapabilitetsnivå ikke er tilgjengelig.

---

## 12. Evidensformat

Akseptansekriteriene skal ikke bli en ny konkurrerende sannhetskilde. Evidensen
skal peke på låst oppgave/spec ved filsti og commit-SHA og vise resultatet for
hvert kriterium. Dersom kriteriene ikke finnes i en versjonert kilde, kopieres
de én gang til oppgaveevidensen før implementering.

```markdown
# Verification: <task-id>

Verdict: PASS | FAIL | BLOCKED | READY_FOR_PACKAGE_REVIEW
Risk lane: LIGHT | STANDARD | HIGH
Reviewer/session: <navn eller modell> / fresh-context yes|no
Task/spec source: <path>@<sha>
Candidate reviewed: <sha eller sha-intervall>

## Acceptance criteria
- PASS|FAIL — <criterion> — <test/file/runtime evidence>

## Commands and deterministic checks
- `<command>` — PASS|FAIL — <kort eksakt resultat>

## Scope
- Expected paths: <liste eller mønster>
- Actual paths: <liste>
- Unexpected paths: none | <forklaring>
- `git diff --check`: PASS|FAIL

## Runtime and visual states
- <state> — PASS|FAIL|N/A — <artifact>

## Security, privacy and accessibility
- <check> — PASS|FAIL|N/A — <evidence>

## Findings
- None | P0/P1/P2/P3 — <fil:linje, konsekvens, nødvendig retting>

## Re-verification scope
<Hva må kjøres på nytt ved retting, og hvorfor dette omfanget er tilstrekkelig.>

## Final reason
<Kort begrunnelse for verdict basert på evidensen.>
```

---

## 13. Stoppbetingelser

Stopp og be om retning når:

- autorisasjon, mål eller akseptansekriterier mangler;
- arbeidskopien har uforklarte eller overlappende brukerendringer;
- scope eller risikonivå endres vesentlig under arbeidet;
- migrering kan ødelegge eller irreversibelt transformere produksjonsdata;
- en secret, credential, betalt kreditt eller ekstern produksjonsendring kreves;
- tester avdekker safety-, sikkerhets-, personvern- eller entitlement-regresjon;
- funksjonen ikke kan innfri paywall- eller personvernpåstanden sin;
- fysisk iOS-/Android-verifikasjon kreves, men ikke er tilgjengelig;
- kvalifisert høyrisikoverifier eller nødvendig faglig myndighet mangler;
- implementør og verifier fortsatt er uenige om risiko eller akseptansekriterier
  etter én dokumentert reparasjonssyklus.

Vanlige P2/P3-funn, forventede testfeil under TDD eller et behov for mer arbeid
er ikke i seg selv stoppbetingelser.

---

## 14. Mål om balanse mellom fart og kontroll

Prosessen evalueres etter hver større pakke eller minst hver tiende oppgave.
Følgende måles enkelt, uten å skape en ny rapporteringsbyrde:

- tid fra godkjent oppgave til kandidat;
- tid brukt på verifikasjon;
- andel som består første review;
- antall funn per alvorlighetsgrad;
- feil som oppdages først i pakke-/release-gaten;
- feil som når produksjon;
- hvor ofte risikoløypen måtte eskaleres.

Hvis lett arbeid bruker mer verifikasjonstid enn implementasjonstid uten å finne
reelle feil, forenkles den lette løypen. Hvis standardarbeid ofte gir feil i
pakke-gaten, styrkes standardløypen. Høyrisikokontroller svekkes ikke uten
dokumentert evidens og eksplisitt eierbeslutning.

Målet er ikke flest mulig gates. Målet er raskest mulig trygg læring og kode som
kan forklares, verifiseres, rulles tilbake og videreutvikles.
