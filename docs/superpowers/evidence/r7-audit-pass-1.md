# R7 — audit-runde 1 (regresjon etter retning B)

**Dato:** 2026-07-14 · **Basis:** `main` @ 35a1783 (etter merge av feat/r7-retning-b)

Fokus: bevise at retning-B-redesignen og fane-omdøpingen (Uke→Planlegg, Innst→Familie) ikke brøt noen side. Full 90+-rubrikkscoring med populerte vær-flater gjenstår (vær laster ikke i lokal preview — met.no-proxyen er en Vercel-funksjon).

## Automatisk

| Kontroll | Resultat |
|---|---|
| tsc -b | ✓ |
| Enhetstester | ✓ 548 |
| Audit-rubrikk/config-tester | ✓ 19 |
| Lint | ✓ 0 |
| Build (client + bare) | ✓ |
| E2E-røyk (onboarding + demo-skall) | ✓ 2/2 |

## Manuell skjermbilde-verifisering (390×844, demo-seed)

| Skjerm | Status | Merknad |
|---|---|---|
| Hjem (retning B) | ✓ populert | Avatar/atmosfære/serif-svar/ankere/sikkerhetslinje (mocket frost) |
| Antrekk (tekstil-stack) | ✓ populert | Fargetabs per gruppe, aktiv rad løftet, koreografi intakt |
| Planlegg (endringsrail) | ✓ | «Endringer i dag» + korrekt kollaps «Samme antrekk hele dagen» |
| Finn antrekk (instrument) | ✓ populert | Glass-tube, gravert skala, bånd-markører, ± knapper |
| Familie (rot) | ✓ ingen feil | Hoster innstillingsinnhold; fane-omdøping OK |
| Guide (hub) | ✓ ingen feil | Verktøy/Kunnskap-seksjoner rendrer |

Ingen uncaught console-feil på noen navigert side.

## Funn (oppfølging, ikke-blokkerende)

1. **P3 — Familie-tittel:** roten viser fortsatt «Innstillinger» som h1 (FamilieScreen wrapper InnstillingerScreen). Løses når Task 7 restrukturerer roten i Barn / De som passer / Steder / Babyora Plus.
2. **P3 — avatar-inkonsistens:** Hjem viser nøytral silhuett, Antrekk-takeover viser interim clay-baby. Begge erstattes av R8-verifiserte kompositter.
3. Audit-config oppdatert: `tab('Innst')` → `tab('Familie|Innst')`, ellers ville settings/paywall-capture feilet.

## Gjenstår i Task 8 (full rubrikk)

Populert 90+-scoring per side krever kjørende vær (deploy-preview eller mock i audit-verktøyet). Deterministiske skjermbilder av alle 13 sider i alle tilstander (loading/offline/error/paywall/redusert bevegelse) tas i deploy-miljø. Fem-foreldre-porten er frafalt av eier; ≤5s-forståelse beholdes som internt krav.
