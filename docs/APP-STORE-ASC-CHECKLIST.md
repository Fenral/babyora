# App Store Connect — gjenstående oppsett (sjekkliste)

Kjør `npx tsx tools/appstore/asc-setup.ts` — den åpner nettleseren på riktige
sider. Logg inn med Apple-ID + 2FA én gang. Gjør så dette:

## STEG A — Ny API-nøkkel med App Manager (låser opp TestFlight)

Årsak: `ryddy-asc-key` har rollen **Developer**; Codemagic trenger **App Manager**
for å auto-generere distribution-profilen (feilet med «No matching profiles»).

1. Fane **API Keys** (Users and Access → Integrations → App Store Connect API → Team Keys)
2. **Generate API Key** / «+»
   - Navn: `Codemagic Babyora`
   - Access: **App Manager**
3. **Generate** → **last ned `.p8`** (kun én gang!) → noter **Key ID** + **Issuer ID**
4. Codemagic → Team settings → Integrations → Developer Portal → **Add key** (lim inn .p8 + Key ID + Issuer)
5. Oppdater `codemagic.yaml`-referansen til den nye nøkkelen (i dag `ryddy-asc-key` / `JQVPW4D944`).
   - Si fra så gjør jeg den koderedigeringen når du har nytt key-navn.
6. Push til `main` → Codemagic-bygg → **TestFlight**.

## STEG B — Pris + norsk localization per abonnement

Prismodell er avstemt med koden (`no.klemeg.app.*`, se DECISION-LOG 2026-07-15).

| Abonnement | Sub ID | Pris (NOK) | Display Name (no) | Beskrivelse (no) |
|---|---|---|---|---|
| Månedlig | 6776416692 | **39** | `Babyora Pluss` | Fremover, overalt og sammen — månedlig. |
| Kvartal | 6776418068 | **99** | `Babyora Pluss 3 mnd` | Pappaperm-pris: 3 måneder med Pluss. |
| Årlig | 6776417937 | **299** | `Babyora Pluss 1 år` | Best verdi. Inkluderer 7 dager gratis. |

**Årlig — Introductory Offer:** Free · varighet **1 week** (7 dagers gratis trial) · territorier Norge (eller alle).

Per abonnement trenger Apple også **Review Information** (skjermbilde av paywallen + kort note til reviewer).

### Sannferdighets-rammer (samme som i appen)
- Ingen absolutte «trygt/riktig»-påstander, ingen ekspert-/helsepersonell-påstander.
- «Fremover, overalt og sammen» = 10-dagersplan, flere steder/auto-posisjon, flere barn. Familiedeling er ikke bygget ennå → ikke lov den.

## Etterpå (kan automatiseres via ASC-API når App Manager-nøkkel finnes)
Når App Manager-nøkkelen er på plass kan pris/localization også settes via App
Store Connect API (JWT med .p8 — ingen nettleser). Si fra om du vil at jeg
skripter det i stedet for manuell utfylling.
