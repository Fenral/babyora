# Selvsjekk før hver overlevering · byggeren

Lagt inn på eierens instruks 14.08.2026: *«Legg inn slik at du selvsjekker deg som et godt nummer 2.»*

Dette er byggerens egen port. Den erstatter **ikke** Codex, og den er ikke en dom over eget arbeid — den er det du gjør *før* du bruker et av de tre forsøkene dine. En forespørsel som ryker på noe du kunne funnet selv, er et bortkastet forsøk og en time tapt for begge parter.

Rekkefølgen er fast: **egne porter → rødt lag → ærlighetsblokk → overlevering.**

---

## 1. Egne porter (G1–G4) — ingen unntak

Kjør dem, i denne rekkefølgen, og lim inn faktisk output. Feiler én, er du ikke ferdig — da retter du, og kjører alle fire på nytt fra toppen.

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
```

Tell testene før og etter. Færre tester etter enn før er en regresjon du skal forklare, ikke et tall du skal la stå.

## 2. Rødt lag — les arbeidet som om det var en annens

Dette er kjernen i selvsjekken. Send ut en **fersk** kontrolleragent (Task/Agent) som ikke har bygget noe, med denne bestillingen:

> «Her er diffen for SN-###. Du er kontrollør, ikke medforfatter. Finn grunnen til at denne skal underkjennes. Gå gjennom DOD-SNUDLY.md sine globale porter G1–G10 og alle portene for type <A–E>. Svar med funn og filreferanse, eller `INGEN FUNN` med hva du faktisk sjekket.»

Krav til det røde laget:
- Det ser diffen og DoD-en, ikke resonnementet ditt om hvorfor arbeidet er riktig.
- «Ser bra ut» er ikke et svar. Enten et funn med filreferanse, eller en liste over hva som ble kontrollert.
- For type A: minst én agent som *bare* sammenligner mot `loop/referanse/snudly-mock.html`, og én som *bare* måler kontrast og trykkflater.
- For type B: minst én agent som forsøker å konstruere et moteksempel mot B2/B3/B4, ikke bare lese testene.

Finner det røde laget noe, retter du det **før** overlevering. Da har det kostet deg fem minutter i stedet for et forsøk.

## 3. De faste spørsmålene

Svar ærlig på alle seks i hodet før du skriver forespørselen. Ett «nei» er nok til å stoppe.

1. Har jeg **sett** at det virker, eller antar jeg det fordi koden ser riktig ut? (Type A: har jeg faktisk sett skjermbildet, i begge temaer?)
2. Er diffen begrenset til oppgaven (G5), eller har jeg ryddet på si?
3. Endret jeg noe som var **låst**? Bundle-id, Apple-produkt-IDer, `feature-flags.ts`, grensene i `finalize-safety` — alle skal stå urørt med mindre oppgaven eksplisitt gjelder dem.
4. Er det noe i diffen jeg ville trukket frem hvis jeg var kontrollør og ville underkjenne den?
5. Har jeg dekning for hver påstand i forespørselen, eller står det noe der jeg *tror*?
6. Løser dette oppgaven som er beskrevet, eller den jeg fant det mer interessant å løse?

## 4. Ærlighetsblokken

Feltet **«Det jeg er minst trygg på»** fylles alltid ut med noe konkret. «Ingenting» er aldri riktig svar — hvis du virkelig ikke finner noe, har du ikke lett, og da skriver du det i stedet.

Pek kontrolløren mot det svakeste punktet. En kontrollør som må lete blindt bruker forsøket ditt på å finne det du allerede visste.

## 5. Etter dommen

**BESTÅTT:** sett oppgaven `FERDIG` og gå videre. Ikke bygg videre på den.

**UNDERKJENT:** rett nøyaktig det dommen krever — ikke mer, ikke mindre. Er du uenig i dommen, retter du likevel, og fører uenigheten som en `Ruling:`-linje i `LEDGER.md`. Du har ikke stemmerett over egen kontroll.

**To underkjente forsøk på samme oppgave:** stopp og les oppgaven på nytt før forsøk tre. To bom på rad betyr som regel at du løser feil problem, ikke at du løser det dårlig. Forsøk tre er det siste — bruk det på riktig problem.

## 6. Når Codex ikke svarer

`vent-paa-baton.sh` returnerer `TIMEOUT` etter en time. Kontrolløren kan være startet senere enn deg (eier gjorde det slik 14.08).

Ved timeout:

1. Skriv én linje i `LEDGER.md`: `TIMEOUT SN-### f<N> — venter fortsatt på kontroll`.
2. **Stå ikke stille.** Ta neste oppgave i arbeidslisten som er `KLAR`, som ikke avhenger av oppgaven til kontroll, og som ikke rører de samme filene. Bygg den ferdig gjennom hele denne selvsjekken og legg forespørselen i køen.
3. Oppgaven til kontroll blir stående `TIL KONTROLL` — den settes aldri `FERDIG` av deg selv. Køen dømmes når kontrolløren våkner.
4. Er alt gjenstående avhengig av noe som venter på kontroll, da — og bare da — venter du på nytt.

Grensen er absolutt: **du godkjenner aldri ditt eget arbeid, uansett hvor lenge kontrolløren er borte.** Selvsjekken gjør køen tryggere; den gjør den ikke godkjent.

Tre timeouter på rad uten at noe kan bygges videre er en eskalering: `BATON: EIER`.
