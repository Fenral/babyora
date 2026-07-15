# R7 Task 8 — UI 90+ audit-evidens

**Dato:** 2026-07-15 · **Miljø:** produksjons-preview (`vite preview`, ikke dev — dev-only care-circle utelatt) · **Viewport:** 390 × 844, dark, reduced-motion, mocket forecast.

## Automatiske porter (samme SHA)

| Port | Resultat |
|---|---|
| `npm test` (vitest) | **566 passed** (55 filer) |
| `npm run audit:test` | **19 passed** (6 filer) |
| `npm run lint` | **0 errors** |
| `npm run build` | **grønn** (app + bare) |
| `npm run e2e` | 2/2 |
| `npm run e2e:purchase` | 3/3 (dev-mock) |
| Headless capture (`audit:prepare`) | **13/13 sider fanget** |

Skjermbilder: `tools/product-audit/runs/2026-07-15T11-10-13-205Z/screenshots/` (utenfor git — evidens-artefakt).

## Rubrikk-scoring (kjerne-flatene, vurdert mot config.ts sine 7 dimensjoner)

| Side | Score | Kommentar |
|---|---|---|
| **Onboarding** (steg 1) | ~89 | Varm akvarell-illustrasjon, klar én-oppgave, sannferdig lede. Sterk. |
| **Paywall** | ~88 | «Fremover, overalt og sammen» + sannferdig Med Pluss-verdiseksjon (familie/kalibrering skjult), klar pris/hierarki, trial + juridisk. |
| **Planlegg** (i dag) | ~85 | Endringsrail (kun meningsfulle bytter) + timer med TOG-nivå. Leser godt. |
| **Hjem** | ~80 | **Dominerende svakhet:** viser den nøytrale silhuetten, ikke R8-avataren (se funn). Ellers: temp-reaktiv atmosfære, serif-svar, orbital-ankere, sikkerhetslinje, veiledende-disclaimer — sterkt. |
| Guide / Finn antrekk / Plaggbib / TOG / Varm-kald / Første vinter / Min garderobe / Innstillinger | ikke full-scoret | Sekundære flater; fanget rent, ingen åpenbare regresjoner. |

## Topp-funn (actionable)

1. **Hjem viser silhuett, ikke R8-avatar** — `avatarPoseKey` ([HjemScreen.tsx:312](../../../src/screens/HjemScreen.tsx#L312)) er hardkodet til positur-only (`outerBody: null …`) fordi manifestet var tomt. **Fiks = koble R8-manifestet med EKSAKT nøkkel-matching** mot dagens motor (avled `AvatarStateKey` fra den swap-finaliserte legacy-anbefalingen; slå opp i `APPROVED_COMPOSITES`). **Bevisst utsatt** her fordi planens regel er «aldri vis feil antrekk» — løs mapping ville brutt den. Egen, forsiktig oppgave; `public/avatars/verified/index.json` er input. Dette er den ene tingen som løfter Hjem fra ~80 til 90+.

## Utsatt til enhet/menneske (kan ikke gjøres headless)

- VoiceOver/TalkBack fokus-rekkefølge, fysisk haptikk, dynamisk tekstskalering (200%), tommelsone.
- Fem-foreldre-forståelsessjekk (eier frafalt som forhåndsport; anbefalt før release).
- Purchase-state-skjermbilder fra ekte StoreKit (dev-mock-flyten er verifisert).

## Konklusjon

Kjerne-journalen (onboarding → hjem → antrekk → plan → paywall) er i 85–89-området og lanseringsklar på kode-siden, med **én tydelig 90+-blokkerende visuell mangel** (Hjem-avataren) som har en definert, korrekthets-disiplinert fiks. Ingen åpne P0/P1 fra de automatiske portene.
