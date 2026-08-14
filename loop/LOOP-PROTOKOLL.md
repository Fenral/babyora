# Snudly byggeloop · protokoll

Delt håndtrykk mellom **Claude Code** (bygger) og **Codex** (kontrollør). Begge leser denne filen. Ingen av dem endrer den.

Loopen kjører til hele `ARBEIDSLISTE-SNUDLY.md` er `FERDIG` og sluttoppgaven `SN-FINAL` er bestått. Da, og bare da, stopper den.

---

## 1. Tegnet

Tegnet er én linje øverst i `loop/BATON.md`. Den forteller hvem som har tur, hvilken oppgave det gjelder, og resultatet av forrige steg.

```
<<<BATON: CODEX · SN-042 · FORSOEK-1 · 2026-08-14T12:34:56Z>>>
```

Gyldige mottakere: `CODEX`, `CLAUDE`, `EIER`, `FERDIG`.

Tegnet finnes også i git, som trailer på oppgavens siste commit — slik at det er sporbart uten å lese arbeidsfiler:

```
SN-042: flytt situasjonsmerket til statuskomponent

Review-Request: SN-042
Forsoek: 1
```

`loop/BATON.md` er sannheten om hvem som har tur. Commit-traileren er sannheten om hva som skal granskes.

## 2. Filene

Alt ligger i `loop/` i byggegrenen og er versjonert.

| Fil | Skrives av | Innhold |
| --- | --- | --- |
| `BATON.md` | begge | Tegnet + kort kontekstlinje |
| `requests/SN-###-f<N>.md` | Claude Code | Hva som er gjort, hvilke filer, evidens |
| `verdicts/SN-###-f<N>.md` | Codex | Portsjekk, funn, dom |
| `LEDGER.md` | begge, kun tillegg | Én linje per hendelse |
| `ESKALERING-SN-###.md` | den som stopper | Hvorfor eier må inn |
| `ARBEIDSLISTE-SNUDLY.md` | Claude Code | Statusfeltet per oppgave |

`f<N>` er forsøksnummer. Første forsøk er `f1`.

En signert fil redigeres aldri. Rettelser leveres som nytt forsøksnummer.

## 3. Syklusen

1. **Claude Code** tar øverste oppgave i arbeidslisten med status `KLAR` og alle avhengigheter `FERDIG`. Setter status `PÅGÅR`.
2. Bygger oppgaven. Kjører alle globale porter selv før den ber om kontroll — en oppgave som ikke passerer egne porter skal ikke sendes videre.
3. Skriver `loop/requests/SN-###-f<N>.md` med faktisk kommandoutput, ikke påstander.
4. Committer med trailer. Skriver tegnet: `BATON: CODEX`.
5. Kaller `loop/vent-paa-baton.sh CLAUDE` og blokkerer.
6. **Codex** våkner på tegnet. Gjør egen preflight, leser diffen for oppgaven, kjører portene på nytt selv.
7. Skriver `loop/verdicts/SN-###-f<N>.md`. Setter tegnet: `BATON: CLAUDE` med `BESTÅTT` eller `UNDERKJENT`.
8. **Ved BESTÅTT:** Claude Code setter oppgaven `FERDIG`, går til neste. **Ved UNDERKJENT:** Claude Code retter nøyaktig det dommen krever, øker forsøksnummer, tilbake til steg 3.

Ingen av partene venter på mennesket mellom oppgaver.

## 4. Ventemekanikken

Begge bruker samme skript, som blokkerer til turen er din. Det sparer tokens sammenlignet med gjentatt polling.

```bash
loop/vent-paa-baton.sh CODEX     # Codex venter på sin tur
loop/vent-paa-baton.sh CLAUDE    # Claude Code venter på sin tur
```

Skriptet returnerer tegnlinjen og avslutter med 0 når turen er din, eller `TIMEOUT` og 1 etter en time. Ved timeout: skriv en linje i `LEDGER.md`, vent på nytt. Tre timeouter på rad er en eskalering.

## 5. Når loopen stopper

Loopen setter `BATON: EIER` og skriver `ESKALERING-SN-###.md` ved:

- **Tre underkjente forsøk** på samme oppgave. Videre forsøk er sløsing; problemet er i oppgaven eller planen, ikke i utførelsen.
- **Kostnad over 500 kr.** Ethvert steg som koster penger utover dette avklares med eier først. Estimatet skrives i eskaleringsfilen.
- **Teknisk blokkering** der alle veier videre er gjetning.
- **Irreversible handlinger uten pengeverdi.** Snever liste: opprettelse av Play-produkt-IDer (kan aldri gjenbrukes), innsending til App Store, sletting av data eller grener, endring av bundle-id eller Apple-produkt-IDer. *Eier kan stryke denne bolken; den står fordi angrefristen er null, ikke fordi mandatet er uklart.*

Alt annet gjør loopen selv, inkludert commit og push til byggegrenen.

## 6. Rulings, ikke stopp

Konflikter, tvetydigheter og planmangler avgjøres av den som møter dem. Beslutningen føres i `LEDGER.md` som:

```
Ruling: <hva som ble bestemt> — <hvorfor> — <hva det koster hvis feil>
```

En feil ruling koster omarbeid eier kan se og omgjøre. En loop som står stille på et spørsmål koster en hel dag og gir ingenting.

## 7. Autoritetsrekkefølge

Ved motstrid gjelder, i denne rekkefølgen:

1. Eierbeslutninger (`EIERVEDTAK-*.md`, nyeste først)
2. `DOD-SNUDLY.md`
3. `snudly-mock.html` og `SNUDLY-DESIGNSYSTEM.md` for alt visuelt
4. `SNUDLY-LANSERINGSPLAN-V2.md`
5. Repoets `DECISION-LOG.md`
6. Øvrige repo-dokumenter

Punkt 5 og 6 er beviselig utdaterte flere steder. Der de motsier kode eller nyere beslutninger, gjelder ikke dokumentet — og avviket noteres i `LEDGER.md`.

## 8. Works plandom

`SNUDLY-LANSERINGSPLAN-V2.md` er til uavhengig kontroll hos ChatGPT Work parallelt med at loopen kjører (eierbeslutning 14.08). Når `18-WORK-PLANKRITIKK-RUNDE-1.md` foreligger, behandles hvert `ENDRE`/`AVVIS` som endringsordre: Claude Code legger nye oppgaver i arbeidslisten med prefiks `SN-W###`, og lar pågående oppgave gjøre seg ferdig først. Works dom stopper ikke loopen med mindre den avdekker en sikkerhets-, personvern- eller betalingsblokker — da settes `BATON: EIER`.
