# Codemagic Apple Distribution cert-revoke playbook

Når Codemagic-bygg feiler i steg 10 «Fetch signing files (create cert +
profile if missing)» er det typisk fordi Apple's Distribution-cert-kvota
er full. Apple tillater **maks 2 Distribution-certs per Team Agent**.
Codemagic-flow `fetch-signing-files --create` genererer fersk privat-
nøkkel hver build, og når matching cert ikke finnes, prøver den lage ny
— som feiler hvis kvota allerede er fylt.

Dette dokumentet beskriver hvordan en Claude-sesjon med Playwright MCP
revokerer en eldre cert for å frigjøre kvota-slot, samt hvordan flowen
ble verifisert 2026-06-14.

## Når dette trigger

| Signal | Tolking |
|---|---|
| Codemagic build feiler i steg 10 etter ~2 sek | Cert-quota |
| `gh api repos/Fenral/wool-app/commits/<sha>/check-runs` viser conclusion=failure | Bekreft Codemagic-failure |
| `output.text` inneholder `Fetch signing files ... exited with status code 1` | Bekreft cert-quota-symptom |
| Forrige build på samme branch lyktes (4-5 min) | Forrige build tok cert-slot — kvota er nå full |

## Forutsetninger

- Apple ID med tilgang til Team `PL9G26C26C` (Sivert)
- 2FA-enhet (iPhone)
- Edge eller Chrome (Playwright MCP bruker default sin egen browser)
- Tilgang til Playwright MCP fra Claude-sesjonen

## Steg-for-steg (Claude bruker disse instruksjonene)

### 1. Naviger til cert-listen

```
mcp__plugin_playwright_playwright__browser_navigate
url: https://developer.apple.com/account/resources/certificates/list
```

Forventet redirect: `idmsa.apple.com/IDMSWebAuth/signin?...` (Apple sign-in).

### 2. PAUSE — Sivert logger inn

Sivert taster Apple ID + passord i browseren, godkjenner 2FA på iPhone,
og taster 6-sifret kode. Claude venter på «inne» eller tilsvarende signal.

Apple sign-in bruker iframe + er beskyttet av reCAPTCHA — automatiseres
IKKE av Claude per [feedback_playwright_browser_automation].

### 3. Snapshot cert-listen

```
mcp__plugin_playwright_playwright__browser_snapshot
```

Forventet output: tabell med rader for «Distribution»-certs. Hver rad
har Type=Distribution, Platform=All, Created By=API Key:..., Expiration.

### 4. Klikk første Distribution-rad

Bruk snapshot-ref (typisk `e54` eller tilsvarende). Klikk åpner cert-
detalj-side med URL `developer.apple.com/account/resources/certificates/download/<ID>`.

```
mcp__plugin_playwright_playwright__browser_click
element: "Første Distribution cert"
target: <ref fra snapshot>
```

### 5. Klikk Revoke-knappen

```
mcp__plugin_playwright_playwright__browser_click
element: "Revoke-knapp"
target: <ref fra snapshot, typisk e91>
```

Bekreftelse-dialog åpner.

### 6. Bekreft Revoke

```
mcp__plugin_playwright_playwright__browser_click
element: "Revoke-bekreftelses-knapp i dialog"
target: <ref fra snapshot, typisk e118>
```

Dialog lukker, du returnerer til cert-listen som nå viser én færre
Distribution-cert.

### 7. Verifiser via snapshot

```
mcp__plugin_playwright_playwright__browser_snapshot
```

Forventet: kun 1 Distribution-cert i tabellen (forutsatt 2 var der
før revoke).

### 8. Trigge ny Codemagic-build

```bash
git commit --allow-empty -m "Trigger Codemagic-rebuild etter cert-revoke

Revoket Apple Distribution-cert <ID> via Playwright for å frigjøre
kvota-slot. Codemagic kan nå lage ny cert i denne build.
"
git push origin main
```

### 9. Bakgrunns-poll til build er ferdig

```bash
until result=$(gh api repos/Fenral/wool-app/commits/<sha>/check-runs \
  --jq '.check_runs[] | select(.name=="Babyora iOS · TestFlight") | .conclusion' 2>/dev/null) \
  && [ -n "$result" ] && [ "$result" != "null" ]; \
  do sleep 60; done; \
  echo "BUILD_DONE: $result"
```

Forventet output: `BUILD_DONE: success`.

## Verifisert 2026-06-14

- Cert revoket: `67292KXFCZ` (Sivert Skotvold, Distribution, exp 2027/06/14)
- Build-restart commit: `6a1080d`
- Build-resultat: success (Codemagic genererte fresh cert i ledig slot)
- Tid: ~10 min fra revoke til ny build på TestFlight

## Alternativ: unngå hele problemet

Codemagic kan konfigureres til å GJENBRUKE samme cert mellom builds via
`manual-signing`-blokk i `codemagic.yaml` istedenfor dagens
`fetch-signing-files --create`-mønster.

Trade-off:
- **Pro:** ingen cert-rotering — én cert holder til den utløper (her: 2027/06/14)
- **Con:** krever at vi laster opp `.p12` + provisioning profile til
  Codemagic UI og oppdaterer manuelt hvis Apple revoker den

Sivert + Claude valgte fetch-signing-files-mønsteret 2026-06-12 fordi
cert-revoke skjedde uforklarlig flere ganger fra Apple. Hvis dette
gjentar seg mer enn 1×/måned, vurder switch til manual-signing.

## Triggere som Claude-sesjon kan gjenkjenne

For å starte denne flowen, kan en operatør si:
- «kjør cert-revoke playbook»
- «codemagic feilet på fetch-signing-files»
- «trigge cert-revoke via Playwright»

Claude leser denne fila, åpner Playwright MCP, og følger stegene over.
