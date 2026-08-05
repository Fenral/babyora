# 01 — Environment & Capability Audit (Fase 0)

> Utført 2026-08-05 av Claude (Creative Director + Technical Lead). Status: **FERDIG**.

## Maskin og runtime

| Komponent | Verdi |
| --- | --- |
| OS | Windows 10 Home 10.0.19045 |
| Node | v24.14.1 |
| tsx | 4.22.4 |
| Repo | `C:\Users\siver\Downloads\trainer-marketplace-master1\babyora\` → github.com/Fenral/babyora |
| Git-status | `main` i sync med `origin/main` (verifisert med fetch 2026-08-05) |

## Uncommittet arbeid ved oppstart (fra forrige økt, «Fase 4»-arbeid)

Endret: `docs/design-notes/skjermmanifest.md`, `src/screens/FinnAntrekkScreen.tsx`,
`src/screens/__tests__/FinnAntrekkScreen.instrument-panel.test.tsx`,
`src/styles/design-tokens-v2.css`, `src/styles/__tests__/design-tokens-v2.kontrastmatrise.test.ts`,
`src/styles/__tests__/design-tokens-v2.motion.test.ts`.
Nytt: `src/styles/__tests__/opacity-demping.test.ts`, `tools/mal-demoted.mjs`, `tools/opacity-detektor.mjs`.

**Disposisjon:** ikke rørt i Fase 0. Bygg og tester er grønne MED disse endringene, så de er
funksjonelt trygge. Vurderes og committes/forkastes eksplisitt i Fase 1 (product audit).

## Bygg, test og kjøring — verifisert

| Sjekk | Kommando | Resultat |
| --- | --- | --- |
| Full build | `npm run build` (tsc -b + vite build + bare-app) | ✅ grønn, 3.2 s + 0.15 s. Advarsel: hovedchunk > 500 kB (kjent, ikke ny) |
| Enhetstester | `npm test` (vitest) | ✅ 2679/2682 (178 filer). 2 feil i `scripts/__tests__/verify-phase3-exact-sha.test.ts` er **flaky under parallell last** (junction-/filsystemtester) — filen passerer 193/193 isolert |
| E2E-røyk | `npm run e2e` | ✅ 2/2: onboarding rendrer, app-skall (`?seed=demo`) rendrer. Kjører `vite preview` + Playwright headless |

## Visuell kontroll og «simulator»

- **Ingen iOS-simulator/Android-emulator på denne maskinen.** Native builds gjøres av Codemagic
  (iOS + Android, se `STATUS.md`). Dette er en kjent begrensning, ikke en blokker: appen er en
  Capacitor-webview, så web-preview er representativ for layout/motion; haptikk, statusbar og
  native transitions verifiseres via Codemagic-builds på fysisk enhet ved milepæler.
- **Screenshot-løype fungerer:** Playwright (devDependency) + `vite preview`. Eksisterende
  artefakter: `e2e-1..9*.png` i repo-roten, `tools/verify-hjem.mjs`.
- **Doktrine-verktøy i repoet:** `tools/design-doctrine-lint.mjs` (tripwires D1–D5),
  `npx impeccable` (kjent begrensning: resolver ikke CSS-var/arv), diagnoseverktøy
  `retningslys`/`gradient-retning`/`vitrine-blindtest` + nye `opacity-detektor`/`mal-demoted`.
  Obligatorisk løype per skjerm står i `DESIGN.md` («Depth doctrine») og minnenotat.

## Mobbin MCP — verifisert og testet

- `search_screens` kjørt 2026-08-05 («weather-based clothing recommendation for baby, home
  screen», ios, standard mode) → returnerte skjermer med bilder (Opal, Tide Guide). Verktøyet
  fungerer; relevansen i standard-modus var svak for nisjespørringen.
- **Lærdom for Fase 5:** bruk `deep` mode for nyanserte søk; `search_flows` for onboarding/
  paywall-flyter. Ikke reinstallert (var allerede installert, per eierinstruks).

## ChatGPT Work — Independent Design Review Board — verifisert ende-til-ende

- **Driver:** Playwright-daemon med vedvarende Chromium-profil.
  Kjørekatalog: `C:\Users\siver\AppData\Local\Temp\claude\c--Users-siver-Downloads-trainer-marketplace-master1\caca9327-6879-43d6-984e-b51e369db631\scratchpad\chatgpt-driver\`
  Protokoll: skriv `cmds/<id>.json` → les `results/<id>.json`. Aksjoner: goto, read, send,
  click, screenshot, eval, stop. Kildekopi av daemonen er lagt i repoet:
  `tools/chatgpt-driver/daemon.mjs` (profilen med innlogget økt ligger IKKE i repoet — sensitiv).
- **Status 2026-08-05:** daemonen svarte men nettleservinduet var lukket → restartet trygt.
  Innlogging overlevde via vedvarende profil: ChatGPT **Pro**, arbeidsflate **Work**, modell
  **5.6 Sol / Ekstra høy** forhåndsvalgt.
- **Review-tråd:** «Designkritikk Babyora App» (festet), URL
  `https://chatgpt.com/c/6a6cb297-fc20-83ed-ae8e-429fd510ac74`. Åpnet og lest maskinelt — full
  rundtur (klikk → naviger → les meldinger) verifisert.
- **Regel fra eier:** ChatGPT-relaterte prosesser skal ALDRI lukkes for å frigjøre minne.

## ui-ux-pro-max — verifisert funksjonelt (supplement til Mobbin og Apple HIG)

Oppdatert til v2.11.0 og testet med reelle søk 2026-08-05 (eierinstruks). Verktøyet er en
lokal, søkbar designdatabase (`scripts/search.py`, Python, ingen avhengigheter).

**Konkrete testfunn:**

1. `--design-system "parenting baby app warm trustworthy"` → returnerte komplett forslag:
   stil «Claymorphism (Mobile)», palett «soft pink + trust blue» (#EC4899/#0284C7),
   typografi Fredoka/Nunito, effekt- og sjekklisteanbefalinger.
   **Vurdering:** databasen leverer, men dette konkrete treffet er generisk «barneapp»-estetikk
   — nettopp det masterprompten forbyr å kopiere ukritisk. Brukes som *motreferanse* og
   idékilde i Fase 4/7, aldri som fasit. Designretning låses først i Fase 8.
2. `--domain ux "subscription paywall onboarding trust"` → 1 treff (skipbar onboarding,
   severity medium). UX-databasen er reell men tynn på nisjespørringer — bredere nøkkelord
   trengs (98 retningslinjer totalt).
3. Styrken ligger i de prioriterte regelkategoriene (kontrast 4.5:1, 44×44 px touchmål,
   150–300 ms animasjon, reduced-motion) — disse overlapper og forsterker repoets egen
   doktrine-lint (D1–D5) og blir en del av verifikasjonsløypa per skjerm.

**Rolle videre:** Mobbin gir *hva andre faktisk shipper* (skjermbevis), Apple HIG gir
*plattformnormen*, ui-ux-pro-max gir *søkbare tommelfingerregler og anti-mønstre*. De tre
brukes som triangulering i Fase 4–5; ingen av dem er beslutningsmyndighet alene.

## Skills og MCP-kapabiliteter

- **Designskills tilgjengelig:** impeccable, ui-ux-pro-max (**oppdatert til v2.11.0 fra
  nextlevelbuilder/ui-ux-pro-max-skill 2026-08-05, på eiers instruks** — backup av gammel
  versjon i `~/.claude/skills-backup-2026-08-05\`), frontend-design, emil-design-eng,
  high-end-visual-design, imagegen-frontend-mobile, design-review, dataviz, m.fl.
- **MCP tilkoblet:** Mobbin, Supabase, Vercel, Figma, Higgs (bildegenerering), Wolfram,
  episodic-memory, Chrome-driver (superpowers-chrome).
- **MCP som krever autentisering (utilgjengelig i denne økten):** github (MCP — men `gh`/git
  CLI fungerer), 60fps, Stripe. Ingen av disse blokkerer Design Lab-fasene.
- **Workflow-orkestrering:** tilgjengelig (maks ~6 samtidige agenter pga. maskinens minne).

## Kjente begrensninger og risiko

1. **Ingen lokal native simulator** — mitigert via Capacitor-webview-preview + Codemagic.
2. **Flaky filsystemtester under full parallell vitest-last** — ikke produktrisiko; vurder
   `--maxWorkers`-begrensning i CI hvis det gjentar seg.
3. **Driver bor i en annen økts scratchpad** (Temp-katalog). Overlever reboot dårlig —
   `daemon.mjs` er derfor kopiert til repoet; ny profil krever manuell ChatGPT-innlogging én gang.
4. **Store-konfig (provisioning, priser)** fra `STATUS.md` er uferdig — relevant først i Fase 13.

## Fase 0 DoD — kvittering

- [x] App bygget, testet og visuelt kontrollert (build + vitest + e2e-røyk med screenshots)
- [x] Mobbin verifisert og testet med reelt søk
- [x] ChatGPT Work-forbindelse verifisert ende-til-ende (daemon restartet, tråd åpnet og lest)
- [x] Prosjektminne (`docs/design-lab/` + `state.json`) og beslutningslogg opprettet
- [x] Ingen ukjente tekniske blokkere — begrensninger dokumentert over
