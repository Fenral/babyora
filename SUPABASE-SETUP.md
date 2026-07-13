# Supabase babyora — setup-notater

Opprettet **2026-06-11** via Supabase MCP. $10/mnd i org «Sivert Apper».

| Attributt | Verdi |
|---|---|
| Project ref | `buwjclpcotsopxxdlmyp` |
| Project URL | `https://buwjclpcotsopxxdlmyp.supabase.co` |
| Region | `eu-north-1` (Stockholm — GDPR-compliant for PRIVACY.md EU-region-løfte) |
| Org | `hsesvgutjgotipfsaksi` (Sivert Apper) |
| Publishable key | `sb_publishable_kxw3UVDlCu1FwFRQUGkldw_hg-kZDqq` (trygg i klient-bundle) |
| Legacy anon JWT | finnes også (for backwards-compat — anbefales ikke for nye apper) |

## Klient-config

`.env.local` og `.env.example` er oppdatert med:

```
VITE_SUPABASE_URL=https://buwjclpcotsopxxdlmyp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_kxw3UVDlCu1FwFRQUGkldw_hg-kZDqq
```

Vercel-env (production preview): legg samme to verdier inn under
**Settings → Environment Variables** for `wool-app`-prosjektet.
Begge er Vite-injekterte (`VITE_` prefix), så de blir bundlet inn i klient.

## Hva er IKKE satt opp ennå

- [ ] **Schema/tabeller** — wool-app har ingen Supabase-modeller ennå.
  Per `children-store.tsx`: «Erstattes med Supabase-data i Fase 3 (onboarding)».
- [ ] **RLS-policies** — må defineres samtidig med første tabell.
- [ ] **Auth** — Apple Sign In + ev. Google. Konfigurer under Authentication
  → Providers når onboarding er klart.
- [ ] **Edge Functions** — push-token-mottak for native varsler.
- [ ] **Service-role key** — kun for edge functions / server-side cron.
  Hentes via Supabase-dashboard når trengs. ALDRI i klient.

## Planlagt schema (Fase 3 — ikke implementert)

Per `PRIVACY.md` og `children-store.tsx`-roadmap:

| Tabell | Formål | RLS |
|---|---|---|
| `children` | Per-bruker barn-profiler (alder, canRoll) | Bruker ser bare egne |
| `device_tokens` | Push-tokens for native varsler | Bruker ser bare egne |
| `subscriptions` | RevenueCat-status-sync (Premium) | Bruker ser bare egne |

## Faktura-cap

$10/mnd = ~110 NOK/mnd. Per memory-feedback: utgifter ≤100 NOK autonome.
Dette er på grensen — Sivert godkjente eksplisitt 2026-06-11 med
«Jeg godkjenner alt».

Hvis Supabase-prosjektet ikke brukes innen 1 uke fra opprettelse,
**vurder å pause prosjektet** (Settings → Project → Pause project) for
å unngå idle-kostnad. Pause stopper fakturering inntil reaktivering.
