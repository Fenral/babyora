# Babyora product audit

Read-only UI/UX and purchase-willingness audit for every Babyora page. It creates screenshots, a structured vision-analysis prompt, validated scores, a total report, and one bounded improvement prompt. It never applies the prompt or edits the product.

## 1. Bygg og server PRODUKSJONSBYGGET (ikke dev)

```powershell
npm run build
npm run preview -- --port 4173
```

> **Ikke bruk `npm run dev`.** Dev-bygget viser flater som aldri sendes til
> en forelder — «De som passer»-forhåndsvisningen og widget-spike-panelet
> ligger begge bak `import.meta.env.DEV`. Målt 2026-08-06 meldte et
> dommerpanel BLOKKERENDE på en av dem, og funnet var umulig å skille fra
> et ekte: et bevis fra feil bygg er ikke et svakere bevis, det er et bevis
> for noe annet. `capture.ts` nekter derfor å revidere en dev-server.
>
> Bruk `localhost`, ikke `127.0.0.1` — Vite binder til `::1`, og IPv4 gir
> ERR_CONNECTION_REFUSED på alle elleve fangster.

## 2. Prepare a run

```powershell
npm run audit:prepare
```

(Standard base-url er `http://localhost:4173`. Bruk `-- --base-url ...`
bare hvis preview kjører på en annen port.)

The command creates `tools/product-audit/runs/<timestamp>/` containing:

- `manifest.json`
- `screenshots/*.png`
- `analysis-prompt.md`

Failed pages remain in the manifest. Old screenshots are never silently substituted.

## 3. Analyze

Give `analysis-prompt.md` and all captured screenshots to a vision-capable reviewer. Save its JSON-only response as `analysis.json` in the same run directory. Mobbin may be used selectively for onboarding, paywall, location, planning, or family-sharing patterns; it is optional and never a visual target.

## 4. Finalize

```powershell
npm run audit:finalize -- --run tools/product-audit/runs/<timestamp>
```

Optional comparison with a prior run:

```powershell
npm run audit:finalize -- --run tools/product-audit/runs/<timestamp> --previous tools/product-audit/runs/<older-timestamp>
```

Finalization creates:

- `scored-analysis.json`
- `report.md`
- `next-improvement-prompt.md`

## Safety boundary

There is no `apply` command. Capture blocks purchases, restoration, deletion, invitations, notifications, and production writes. Run the tool against a local or dedicated preview build with fixtures. Product implementation is a separate, explicitly approved task.

## Tests

```powershell
npm run audit:test
```

If the app cannot start, a required page cannot be captured, or the analysis JSON is invalid, the audit reports the failure instead of presenting a complete total.

