# Babyora — Claude-instruksjoner

1. Les `AGENTS.md` — sikkerhets-, kostnads- og git-reglene der gjelder alltid.
2. For Design Lab-arbeidet (aktivt fra 2026-08-05): `docs/design-lab/00-master-brief.md` er
   bindende orkestreringsplan. `docs/design-lab/state.json` viser aktiv fase og neste handling.
3. Designdoktrine og tokens: `DESIGN.md` («Depth doctrine») + `src/styles/design-tokens-v2.css`.
   Obligatorisk verifikasjonsløype per skjerm: `node tools/design-doctrine-lint.mjs` →
   `npx impeccable --json` → kaldt vurderingspanel med eksplisitt doktrinesjekk.
4. Verifiser alltid med `npm run build` (ikke bare tsc) og `npm test` før push.
5. Uavhengig review: ChatGPT Work-tråden «Designkritikk Babyora App» via Playwright-daemonen
   (kilde: `tools/chatgpt-driver/daemon.mjs`, kjørekatalog i `state.json` → `workThread.driver`).
