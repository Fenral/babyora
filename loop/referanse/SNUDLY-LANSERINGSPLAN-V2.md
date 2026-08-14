# Snudly · lanseringsplan v2 — fra repo-virkelighet til App Store

> **For agentiske utførere:** Planen kjøres fase for fase med `superpowers:subagent-driven-development`-disiplin: fersk agent per oppgave, kontroll etter hver, bred sluttkontroll per fase. Oppgaver bruker `- [ ]`-syntaks.

**Mål:** Snudly live i norsk App Store, med Android som fast-follow.

**Arkitektur:** React 19 + Capacitor 8, local-first, met.no-vær via Vercel edge-proxy, RevenueCat-abonnement, legacy-motor i drift med Motor 2.0 bak flagg.

**Spec:** `snudly-mock.html` (gjeldende designreferanse), `SNUDLY-DESIGNSYSTEM.md`, `discussion/`-prosessen, repoets `DECISION-LOG.md`.

**Skrevet:** 14.08.2026, forankret i workflow-kartlegging av `Fenral/babyora` @ `7108499` (main, 8. aug) med fem parallelle lesere + kritiker. Erstatter v1, som undervurderte fremdriften kraftig.

**Status:** UTKAST — går til ChatGPT Work for plansjekk FØR fase 1 starter (se kapittel 6).

---

## 0. Hva kartleggingen endret

V1 antok nybygg. Virkeligheten: appen er **langt mer ferdig enn antatt** — komplett onboarding (1878 linjer, testet), paywall med RevenueCat-wrapper, met.no ende-til-ende med edge-proxy, 12 skjermer, 182 testfiler med ~1856 caser, iOS CI/CD som har levert TestFlight-bygg opp til #157–158, og full Apple-provisjonering (App ID 6776416135, tre abonnementer, RevenueCat koblet).

Men også **messier enn antatt**: tre navn i omløp (Klemeg i bundle-id og UI-spor, Babyora låst i DECISION-LOG 15. juli, Snudly besluttet av eier 13. august — uregistrert i repoet), **to parallelle designprosesser** som motsier hverandre (repoets design-lab: 3 faner, dark-first, retning B «Scenen» — vår discussion-prosess: 4 faner, lys standard, K2b/K5-mocken), tre grener foran main uten merge-plan, en udømt design-lab-overlevering, og dokumentasjon som motsier både seg selv og koden (trial-omfang, produkt-IDer, TestFlight-status).

Planens jobb er derfor ikke å bygge — det er å **forene, verifisere og skipe.**

---

## 1. Globale bindinger

Kopiert fra kildene, gjelder hver oppgave:

- Bundle-id `no.klemeg.app` og Apple produkt-IDene `no.klemeg.app.monthly/quarterly/yearly` **endres aldri** — Apple-produkt-IDer er uforanderlige, ny bundle-id betyr ny app, nye IAP-er, ny review og tapt provisjonering. Snudly-byttet skjer utelukkende i visningsnavn, butikktekst og UI.
- Play produkt-IDer kan aldri gjenbrukes etter sletting — `babyora_premium_*` staves riktig første gang eller navnes om til `snudly_premium_*` FØR opprettelse (eierbeslutning E-3, de finnes ikke ennå).
- Motor 2.0 aktiveres ikke uten ekstern fagsignatur (Task 17). v1 skiper på legacy-motor med veiledende-disclaimer — disclaimeren skal være synlig i alle relevante flater ved innsending (låst beslutning 15. juli).
- «Vær fra met.no»-kreditering skal være synlig i UI ved innsending (lisenskrav).
- Ingen agent godkjenner eget arbeid. Rust betyr klesbytte. `prefers-reduced-motion` respekteres.
- Butikktekst lover aldri funksjonalitet som ikke finnes (push-løftet i STORE-LISTING må enten bygges eller strykes).

---

## 2. Eierbeslutninger som låser planen (fase 1-porten)

Alle seks avgjøres før bygging starter. E-1 og E-2 er de eneste som er vonde; resten er raske.

| # | Beslutning | Anbefaling |
| --- | --- | --- |
| E-1 | **Design-forening:** snudly-mocken (4 faner, lys standard) vs. repoets design-lab-beslutninger (3 faner, dark-first, retning B). Din uttalte lås 13.08 sier mocken — men da må design-lab-overleveringen dømmes og DECISION-LOG oppdateres, ellers bygger to prosesser mot hverandre. | Mocken vinner; design-lab-artefakter dømmes behold/endre/forkast mot den. |
| E-2 | **Navn i alle flater:** Snudly som visningsnavn overalt (app, ASC, butikktekst, IAP display names, PRIVACY). Krever navnesjekk: App Store-søk, domene, varemerke — udokumentert for Snudly. | Kjør navnesjekken i fase 1; Snudly gjennomføres kun display-side. |
| E-3 | **Play produkt-ID-prefiks** (`snudly_premium_*` anbefalt siden de ikke finnes ennå) og iOS-først-sekvens. | iOS først, Android fast-follow 2–4 uker etter. |
| E-4 | **Trial-omfang:** 7 dager på alle planer (eierbeslutning 31.07) eller kun årsplan (NEXT-STEPS + feltkommentar i koden). Én sannhet må velges og konfigureres likt i ASC, kode og paywall-copy. | Alle planer, slik 31.07-beslutningen sier. |
| E-5 | **Release-kandidat:** dømme de tre grenene foran main (`feat/hjem-list-detail-sheet`, `feat/kontekstvalg-hjem`, `agent/babyora-polish-slide`) og design-lab-overleveringen; sette RC-tag og kodefrys-regel. | Døm i fase 1, merge det som overlever E-1. |
| E-6 | **Support og drift:** support-URL/e-post (klemeg.no vs snudly-domene), hvem svarer, og at Paid Apps Agreement + bank/skatt i ASC bekreftes aktiv. | Avklares parallelt med fase 1. |

---

## 3. Fasene

### Fase 1 · Forening og sannhetsetablering — 1 uke

- [ ] Kjør navnesjekk Snudly (App Store, Google Play, domene, varemerkesøk) — *workflow W1*
- [ ] Døm design-lab-overleveringen og de tre grenene mot snudly-mocken (E-1/E-5) — adversarielt agentpar per gren
- [ ] Sett RC: merge overlevende grener, tag, kodefrys-regel («kun P0 etter RC»)
- [ ] Avstem dokumentene mot konsollene: STATUS/NEXT-STEPS/IAP-SETUP rettes mot faktisk ASC/RevenueCat/Play-tilstand; slett den utdaterte mismatch-kommentaren i `revenuecat.ts` — *workflow W2*
- [ ] Verifiser i konsollene (ikke dokumentene): ASC-nøkkelrolle, Paid Apps Agreement, RevenueCat-mapping, intro-trial-konfig
- [ ] Commit og push `discussion/`-prosessen (backup-risikoen lukkes)
- [ ] Registrer Snudly-beslutningen og E-1–E-6 i `DECISION-LOG.md`

**Port 1:** Én sannhet — ett navn besluttet, én designreferanse, én RC, dokumenter som stemmer med konsollene.

### Fase 2 · Snudly-redesign av eksisterende flater — 2–3 uker

Ikke nybygg: de 12 skjermene restiles til designsystemet (tokens inn i `design-tokens-v2.css`-etterfølgeren, de åtte avvikene lukkes), Hjem/Planlegg/Verktøy/Familie bringes til mock-paritet (tidssone-graf med lag-soner, situasjonsmerke/ikonknapp-mønsteret, ring-layout i Familie), display-navn byttes (Info.plist, strings.xml, capacitor appName, i18n-strenger) — *workflow W3 for den mekaniske ~610-filers teksten, håndverk for skjermene*. Onboarding restiles og K0-vs-K3-finalen avgjøres. met.no-kreditering og veiledende-disclaimer verifiseres synlige.

**Port 2:** Skjermbildediff mot mocken godkjent i begge temaer; ingen «Babyora»/«Klemeg» synlig for bruker.

### Fase 3 · Kjøpsflyt bevist på ekte enhet — 1 uke (parallell med fase 2)

Apple-priser + norsk localization + Review Information per IAP legges inn; trial-konfig etter E-4; RevenueCat-nøkler og `VITE_FORECAST_PROXY` inn i native-bygg; deretter det viktigste enkeltbeviset i hele planen: **ekte sandbox-kjøp på TestFlight-enhet** — configure → offering → kjøp → entitlement → restore. Dokumenteres med skjermopptak.

**Port 3:** Kjøp, restore og entitlement verifisert på fysisk enhet, ikke mock.

### Fase 4 · Innsendingsmateriale — 1–2 uker (parallell med fase 2)

Personvernerklæring ferdigstilles (placeholders fylles, juristsjekk ~5–10k NOK bestilles nå — eneste eksterne avhengighet ved siden av fagsignatur), publiseres på offentlig URL sammen med support-side. App Privacy-skjemaet fylles i ASC fra den ferdig utredede tabellen. Supabase-løftene i erklæringen strykes eller bygges (anbefaling: stryk push/server-sletting fra v1-teksten, siden infrastrukturen ikke finnes). Skjermbilder produseres fra det godkjente 6-skjermers-konseptet med Snudly-design — *workflow W4*. Butikktekst konverteres til Snudly og sannferdiggjøres. Crash-rapportering (Sentry e.l.) legges inn — lansering uten er blind. Review-notater skrives (hvordan reviewer tester trial/paywall).

**Port 4:** Alt Apple krever ved innsending eksisterer og er sant.

### Fase 5 · Herding og beta — 2 uker

VoiceOver, Dynamic Type, redusert bevegelse, feilstater (ingen nett, vær-proxy nede, lokasjon avslått), eldre enheter. Ekstern TestFlight med 10–20 husstander i minst to uker faktisk vær; funn inn i inbox-prosessen. Guideline 1.4-risikoen (fysisk skade, spedbarnsråd) adresseres eksplisitt i disclaimer + review-notater.

**Port 5:** Ingen kjente krasj, ingen åpne P0/P1, betaforeldre opplever rådene som fornuftige.

### Fase 6 · Innsending og lansering — 1 uke + review-kø

Innsending med phased release, avslagsberedskap (vanligste risiko: 1.4/barnedata/IAP-metadata), overvåkning av vær-proxy og crash-rate fra dag én, motor-hurtigfiks-løype klar.

**Port 6:** Live i norsk App Store.

### Fase 7 · Android fast-follow — 2–4 uker etter iOS

Den serielle kjeden som ikke kan parallelliseres: keystore i Codemagic → grønt bygg → .aab til Internal testing → opprett de tre Play-abonnementene (riktig prefiks per E-3, staves riktig — irreversibelt) → RevenueCat Play-produkter rekobles fra døde `klemeg_premium_*` → Ireland-skatteinfo → Play-butikktekst → lansering.

**Sum til iOS-innsending: 5–7 uker.** (V1 sa 12–17 — repoet var lenger fremme enn planen visste.)

---

## 4. Modell- og effortplan

Prinsippet fra README videreføres: kvalitet foran hastighet, avvik oppgis med begrunnelse, forslagstiller godkjenner aldri selv.

| Arbeidstype | Modell | Effort | Begrunnelse |
| --- | --- | --- | --- |
| Eierbeslutningsunderlag, design-dommer (E-1, E-5), arkitektur, sikkerhetsvurderinger, endelige synteser | Claude Fable 5 | høy/maks | Påvirker produktbeslutninger — README-policy |
| Skjermredesign (fase 2-håndverk), motion, designsystem-kode | Claude Fable 5 | høy | Designretning er låst; presisjonen ligger i utførelsen |
| Repo-verifisering, doc-avstemming, filsveip, skjermbildegenerering, kontrastmåling | Fable-ledede workflows med lesere på standard effort; mekaniske deloppgaver kan gå på Sonnet/Haiku | lav/medium | Mekanikk med tydelig fasit; Fable eier tolkningen av funnene |
| Produksjonskode etter godkjent retning | Codex | maks på motor/betaling, standard på restyling | Etablert rolle; motor og penger tåler ikke slurv |
| Kritikk, falsifisering, dom (porter 1–5) | Codex (kode/motor) og ChatGPT Work GPT-5.6 Sol (design/plan) | maks | Kvalitetsport-policyen fra README, uendret |
| Plansjekken før start (kap. 6) | ChatGPT Work GPT-5.6 Sol | maks | Eksplisitt eierkrav |
| Konsoll-operasjoner (ASC, RevenueCat, Play) | Menneske (Sivert) med agent-veiledning, eller browser-agent under oppsyn | — | Irreversible registreringer; aldri autonomt |

Regel for effort-avvik: en oppgave kan flyttes nedover ett nivå kun når det ikke gir målbar kvalitetsforskjell, og flyttingen oppgis i leveransen — samme formulering som modellpolicyen i README.

**Fallback-regel:** Er Fable 5 tom for tokens (kvote/kapasitet), tar **Claude Opus 5 på maks effort** over samme oppgave uten å vente på Fable. Byttet oppgis i leveransen («utført av Opus 5 maks, Fable utilgjengelig»), og arbeid som påvirker produktbeslutninger (eierunderlag, dommer, endelige synteser) merkes for Fable-ettersyn når kvoten er tilbake — ettersynet bekrefter eller reverserer, det gjentar ikke arbeidet. Mekaniske oppgaver trenger ikke ettersyn. Samme fallback-kjede gjelder i workflows: ledere og kritikere faller til Opus 5 maks, aldri til Sonnet/Haiku.

## 5. Dynamic workflows — hvor og hvordan

Workflows brukes der arbeid er parallelliserbart og etterprøvbart; enkeltagenter der dømmekraft skal holdes samlet. Katalog:

- **W1 Navnesjekk** (fase 1): parallelle søkere — App Store/Play-søk, domenetilgjengelighet, varemerkeregistre, sosiale håndtak — én syntese med GO/NO-GO for Snudly.
- **W2 Dokument-avstemming** (fase 1): én leser per dokumentpar (dok ↔ konsoll/kode), funn → rettelser → adversariell verifisering av at rettelsene stemmer. Mønsteret fra kartleggingen som fant products.ts-feilen gjenbrukes.
- **W3 Navnebytte-sveip** (fase 2): ~610 filer med «babyora»/83 med «klemeg» klassifiseres parallelt i *skal endres / skal aldri endres (bundle-id, produkt-IDer, historiske docs) / usikker* — usikre eskaleres, endringer kjøres i worktree-isolasjon med diff-review.
- **W4 Skjermbildeproduksjon** (fase 4): seks skjermbilder rendres parallelt fra mock + enhetsramme, kontrast- og tekstkontroll per bilde, side-om-side-kontaktark til eiergodkjenning.
- **W5 Herdingsmatrise** (fase 5): feilstater × temaer × tekststørrelser som pipeline — hver celle screenshotes og dømmes.
- **Kartleggingen som skrev denne planen** var selv W0 — mønsteret (lesere → kritiker som selv verifiserer i kildene) gjenbrukes ved hver port.

Fellesregler: maks ~15 agenter per workflow, funn skal ha filreferanse, en kritiker-agent med verifiseringstilgang avslutter hver workflow, og ingen workflow utfører irreversible operasjoner.

## 6. ChatGPT-sjekken før start

Prosessen starter ikke før ChatGPT Work har dømt planen. Pakken ligger klar i `PROMPT-CHATGPT-PLANSJEKK.md`; last opp disse filene i én ChatGPT-samtale:

1. `PROMPT-CHATGPT-PLANSJEKK.md` (instruksen)
2. `SNUDLY-LANSERINGSPLAN-V2.md` (denne planen)
3. `SNUDLY-DESIGNSYSTEM.md`
4. `discussion/README.md` (prosess- og modellpolicy)
5. `discussion/00-INBOX.md`
6. Repoets `NEXT-STEPS.md`, `STATUS.md` og `docs/DECISION-LOG.md` (sannhetsgrunnlaget planen dømmes mot)

Pluss lenkene: `https://snudly-v4.vercel.app/` og `/designsystem`. Dommen (`GODKJENT` / `GODKJENT MED VILKÅR` / `AVVIST` med eksakte endringer) arkiveres i `discussion/` som `17-WORK-PLANSJEKK.md`, og vilkår innarbeides før fase 1.

## 7. Superpowers

`obra/superpowers` er klonet og metodikken er tatt i bruk i denne planen (`writing-plans`-header, porter, subagent-disiplin, `dispatching-parallel-agents`-prinsippene bak workflow-katalogen). Repoet i `wool-app-main` har allerede en `.superpowers`-mappe fra tidligere faser — GSD-prosessen der er samme skole. For å ha den i din egen Claude Code: `/plugin install superpowers@claude-plugins-official`.
