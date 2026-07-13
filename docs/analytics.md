# Babyora Analytics — gullstandard

> P9.4 (2026-06-13). Verktøy: **PostHog Cloud EU**. Begrunnelse,
> personvern-grunnlov, event-skjema.

## Hvorfor PostHog (ikke Mixpanel/Amplitude/GA)

| Krav | PostHog Cloud EU |
|---|---|
| Funnels + retention + feature flags i ett | ✅ |
| EU-data-residens (Frankfurt) | ✅ — eu.posthog.com |
| Ingen reklame-SDK / cross-app tracking | ✅ — egen førsteparts-SDK |
| Ingen ATT-prompt nødvendig | ✅ — ingen IDFA/cross-app |
| Session recording AV | ✅ — opt-in default off |
| Autocapture AV | ✅ — kun eksplisitte events |
| Self-host fallback | ✅ — hvis EU-cloud blir for dyrt |

## Personvern-grunnlov

1. **Anonym distinct_id.** Generert via `crypto.randomUUID()`,
   persisteres i localStorage. Aldri e-post, aldri navn som id.
2. **Aldri barnedata.** Ingen child.name, child.dob, child.lat/lon i events.
   Maks: `country: 'NO'` hvis nødvendig.
3. **GDPR-opt-out.** Bryter i Innstillinger → "Anonym statistikk".
   Når av: `posthog.opt_out_capturing()` + clearer distinct_id.
4. **Personvernerklæring oppdatert** — egen seksjon "Analytics" listet
   under "Behandling".
5. **PII-verifisering før release.** Manuell gjennomgang av 50
   nyeste events i PostHog Live → ingen PII = grønt for merge.

## Event-skjema (eneste lovlige events)

| Event | Properties | Forklaring |
|---|---|---|
| `app_opened` | `{ source: 'direct' \| 'push' \| 'widget' \| 'deeplink' }` | Hver gang appen åpnes / kommer i forgrunnen |
| `onboarding_step` | `{ step: 1\|2\|3, completed: boolean }` | Steg-progresjon |
| `rec_shown` | `{ activity, layer_count, has_topptiltaa, has_utstyr }` | Etter motoren returnerer rec |
| `garment_opened` | `{ source: 'rec' \| 'library' }` | LayerDetailSheet eller GarmentDetailScreen åpnes |
| `guide_opened` | `{ section: string }` | Tab-bytte til Guide |
| `feedback_given` | `{ value: 'kald' \| 'passe' \| 'varm' }` | P9.5 «Var det passe?» svar |
| `notification_optin` | `{ enabled: boolean }` | Bruker svarer på push-prompt |
| `paywall_viewed` | `{ trigger: string }` | PaywallSheet åpnes |
| `paywall_converted` | `{ plan: string }` | RevenueCat-webhook proxies |
| `widget_bridge_updated` | `{}` | Hver gang snapshot pushes — proxy for widget-installasjon |
| `garment_ownership_toggled` | `{ owned: boolean, premium_required: boolean }` | P9.6 «Mine plagg» |

**Lint-regel:** rå `posthog.capture()` forbudt utenfor `track()`-wrapperen.

## Nordstjerne

**Morgenåpninger per aktivt barn per uke** (`app_opened` med
lokal tid 05–10).

PostHog insight-config:
- Event: `app_opened`
- Filter: `hour(timestamp) BETWEEN 5 AND 10`
- Breakdown: unique users per week

## Dashboards (oppretts av Sivert i PostHog UI)

1. **Aktiveringsfunnel:** install → onboarding_step(3, completed) →
   første rec_shown → notification_optin(true)
2. **D1/D7/D30 retention** — kohorter på `app_opened`
3. **Premium-konvertering** — paywall_viewed → paywall_converted per trigger

## Implementasjons-status (P9.4)

- [x] `track()`-wrapper i `src/lib/analytics/track.ts` med typed event-union
- [x] `useAnalytics()`-hook for sources og opt-out state
- [x] No-op når `VITE_POSTHOG_KEY` mangler
- [x] localStorage opt-out-bryter
- [!] PostHog-konto opprettes av Sivert. Sett env-vars i Vercel +
      Codemagic env-group `klemeg_revenuecat` (legg til
      `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST=https://eu.posthog.com`).
- [!] PII-gjennomgang av 50 events — krever PostHog Live-tilgang.
- [!] Personvernerklæring oppdatert — venter på Sivert.
