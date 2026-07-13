# Claude-handoff – Babyora

Kopier teksten under inn i Claude Code når du er klar til å starte. Start i et nytt prosjektvindu som peker på Babyora-repoet.

---

Du skal implementere Babyoras godkjente planer kontrollert, én oppgave og én commit om gangen.

Repo:

`C:\Users\siver\Documents\Apper 2026\wool-app-main`

Les disse filene fullstendig før du gjør endringer:

1. `docs/superpowers/plans/2026-07-13-babyora-90-plus-master-plan.md`
2. `docs/superpowers/specs/2026-07-13-babyora-engine-2-design.md`
3. `docs/superpowers/specs/2026-07-13-babyora-engine-2-validation.md`
4. `docs/superpowers/plans/2026-07-13-babyora-engine-2-plan.md`
5. `docs/superpowers/plans/2026-07-13-babyora-verification-protocol.md`

Bruk `superpowers:executing-plans`, `superpowers:test-driven-development` og `superpowers:verification-before-completion`.

Start bare med Task 0 i Motor 2.0-planen. Ikke fortsett automatisk til Task 1 før Task 0 har egen test-/kvalitetsevidens og commit.

Viktige grenser:

- Hvis `.git` mangler, stopp og be eieren åpne originalrepoet eller godkjenne `git init`. Ikke initialiser Git på eget initiativ.
- Første kodeendringer skal bare gjøre eksisterende lint-baseline grønn uten å endre funksjonell adferd.
- Ikke endre temperaturgrenser, sikkerhetsnivåer eller sikkerhetscopy uten en separat dokumentert beslutning.
- Bygg Motor 2.0 ved siden av `src/lib/wool-layers`; ikke slett eller skriv om legacy-motoren.
- All ny motoradferd skal begynne med en test som feiler av forventet grunn.
- Hold alle V2-visningsflagg av gjennom kontrakt-, adapter- og shadow-fasen.
- `avoid_wool` er en hard regel. Materialpreferanse, gyldige situasjoner og sikkerhet er gratis.
- Ingen garderoberegistrering, fotoanalyse, AI-motor, affiliate-produkter eller merkenavn.
- Ingen feil materialillustrasjon. Bruk `null`/nøytralt ikon når korrekt bilde mangler.
- Ingen PII i fingerprint, analytics, push eller scenarioeksport.
- Claude kan ikke faglig godkjenne sitt eget sikkerhetsarbeid. Nye alderskohorter forblir av til ekstern scenario-signatur foreligger.

Kjør og rapporter etter hver oppgave:

```text
npm test
npm run audit:test
npm run lint
npm run build
git status --short
git diff --stat HEAD~1
```

For hver oppgave skal rapporten vise:

1. Hva testen beviste før implementering.
2. Hvilke filer som ble endret.
3. Eksakt resultat av kvalitetskontrollene.
4. Eventuelle avvik fra planen og hvorfor.
5. Commit-ID.
6. Om uavhengig review eller menneskelig beslutning kreves før neste steg.

Modellvalg fra masterplanen:

- Bruk Fable 5 med Extra effort for Motor 2.0-domene, sikkerhetsport, materialresolver og shadow-review.
- Bruk Sonnet 5 High for avgrensede UI-, test-, copy- og mekaniske oppgaver.
- Bruk ikke betalte ekstra kreditter uten eierens uttrykkelige godkjenning.

Ikke start flere masterplanpakker parallelt. Motor 2.0-kontraktene og adapteren skal stabiliseres før anbefalingsvendt UI, kalibrering, varsler eller widgets integreres.

---

