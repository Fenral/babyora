# Selvsjekk før hver overlevering · byggeren

Lagt inn på eierens instruks 14.08.2026: *«Legg inn slik at du selvsjekker deg som et godt nummer 2.»*

Dette er byggerens egen port. Den erstatter **ikke** Codex, og den er ikke en dom over eget arbeid — den er det du gjør *før* du bruker et av de tre forsøkene dine. En forespørsel som ryker på noe du kunne funnet selv, er et bortkastet forsøk og en time tapt for begge parter.

Rekkefølgen er fast: **egne porter → rødt lag → ærlighetsblokk → overlevering.**

---

## 1. Egne porter (G1–G4) — fang output, ikke gjenfortell den

Lagt om 2026-08-14 etter at SN-003 f2 ble underkjent for en «rå output»-blokk som ikke
kom fra den overleverte committen: den oppga 2410 moduler og `dist/index.html` 0,62 kB,
mens kontrollørens kjøring på samme tilstand ga 672 moduler og 14,47 kB. En gjenfortalt
transkripsjon er ikke evidens — den er en påstand forkledd som måling.

**Kjør portene ETTER siste commit, og fang dem til fil i samme kommando:**

```bash
mkdir -p loop/evidens/SN-###
{ npm run lint; echo "EXIT=$?"; } > loop/evidens/SN-###/g1-lint.txt 2>&1
{ npx tsc --noEmit; echo "EXIT=$?"; } > loop/evidens/SN-###/g2-tsc.txt 2>&1
{ npm test; echo "EXIT=$?"; } > loop/evidens/SN-###/g3-test.txt 2>&1
{ npm run build; echo "EXIT=$?"; } > loop/evidens/SN-###/g4-build.txt 2>&1
```

Requesten siterer **fra disse filene** — `tail -n 20 loop/evidens/SN-###/g4-build.txt` —
og filene committes med oppgaven. Da kan kontrolløren sammenligne ordrett, og du kan
ikke huske feil. Skriver du et tall i requesten som ikke står i en av filene, er det
per definisjon udekket.

Feiler én port, er du ikke ferdig: rett, commit på nytt, og **fang alle fire på nytt**.
Evidens fra en tidligere kjøring gjelder ikke for en ny commit.

Tell testene før og etter. Færre tester etter enn før er en regresjon du skal forklare, ikke et tall du skal la stå.

## 2. Rødt lag — les arbeidet som om det var en annens

Dette er kjernen i selvsjekken. Send ut en **fersk** kontrolleragent (Task/Agent) som ikke har bygget noe, med denne bestillingen:

> «Her er diffen for SN-###. Du er kontrollør, ikke medforfatter. Finn grunnen til at denne skal underkjennes. Gå gjennom DOD-SNUDLY.md sine globale porter G1–G10 og alle portene for type <A–E>. Svar med funn og filreferanse, eller `INGEN FUNN` med hva du faktisk sjekket.»

Krav til det røde laget:
- Det ser diffen og DoD-en, ikke resonnementet ditt om hvorfor arbeidet er riktig.
- «Ser bra ut» er ikke et svar. Enten et funn med filreferanse, eller en liste over hva som ble kontrollert.
- Det **anbefaler ikke godkjenning**. Et rødt lag som konkluderer med «anbefaler godkjent»
  har byttet rolle fra motstander til sertifiserer, og da er kontrollen verdiløs. Dets
  eneste to lovlige utfall er funn eller en liste over hva det faktisk kontrollerte.
- For type A: minst én agent som *bare* sammenligner mot `loop/referanse/snudly-mock.html`, og én som *bare* måler kontrast og trykkflater.
- For type B: minst én agent som forsøker å konstruere et moteksempel mot B2/B3/B4, ikke bare lese testene.

Finner det røde laget noe, retter du det **før** overlevering. Da har det kostet deg fem minutter i stedet for et forsøk.

## 2b. Påstandsrevisjon — det rødt lag ikke fanger

Lagt til 2026-08-14 etter at tre underkjennelser på rad hadde samme form: **koden var
riktig, forespørselen var ikke det.** SN-001 f1/f2 og SN-002 f1 falt alle på tall og
påstander i requesten, mens diffen besto. Det røde laget meldte «ingen funn» hver gang,
fordi det gransket arbeidet — ingen gransket rapporten om arbeidet.

Send derfor ut en **andre** kontrolleragent med et helt annet mandat:

> «Her er `loop/requests/SN-###-f<N>.md`. Ikke vurder om arbeidet er godt. Verifiser at
> hver eneste faktapåstand i dokumentet er sann akkurat nå. Kjør kommandoen som beviser
> hver påstand, og sammenlign tegn for tegn. Rapporter hver uoverensstemmelse med
> linjenummer i requesten og den faktiske verdien.»

Den agenten leser ikke koden. Den leser dokumentet mot virkeligheten.

**Kjør faktaskriptet ETTER commit og push, FØR du skriver requesten:**

```bash
loop/leveranse-fakta.sh SN-###
```

Det skriver ut SHA, emne, trailere, G6-formatsjekk, eksakt diffstat per fil (`numstat`,
ikke den skalerte grafen) og synkstatus mot origin. **Lim outputen rått inn i requesten.**
Skriver du et tall som ikke står der, er det per definisjon udekket.

Bakgrunnen er hard: SN-003 og SN-005 brukte opp alle tre forsøk hver, uten at arbeidet
var feil. Begge falt fordi requesten ble skrevet som et forhåndsdokument med påstander om
hva som *ville* skje etter commit, og aldri ble kontrollert mot den faktiske committen.
Codex' dom om SN-005: «Den materielle oppgaven ser ut til å være ferdig fra forsøk 2.
Hindringen er leveransens dokument- og sporbarhetsprosess.» Skriv requesten **etter**
committen, ikke før.

G6-formatet håndheves nå også av en `commit-msg`-hook i klonen: en commit uten
`SN-###: `-emne og begge trailerne blir avvist før den finnes. Ren loop-bokføring uten
oppgave merkes `[admin]` i emnet.

**Requesten beskriver MATERIALCOMMITEN — aldri «hele leveransen».** Dette er den
enkeltfeilen som har kostet flest forsøk i denne loopen: SN-003, SN-005, SN-006 og
SN-W02 brøt alle tre forsøk hver på den. Årsaken er strukturell, ikke slurv — i det du
lagrer requesten, oppretter du en commit som endrer tallene requesten nettopp beskrev.
Skriver du «full pakke: to commits», har kontrolløren fire når den ser etter.

Formuler derfor alltid slik:

> Materialcommit `<sha>`: N filer, +X/−Y.
> Request-, evidens- og BATON-commits kommer etter denne målingen og er bokføring,
> ikke innhold.

Da måler du noe som står stille, og påstanden forblir sann etter at du har levert.

**Regelen bak, som gjelder deg selv også:** hvert tall i en forespørsel skal være
**limt inn fra kommandoutput kjørt etter siste commit** — aldri skrevet fra hukommelsen,
aldri anslått, aldri regnet i hodet. Dette gjelder særlig:

| Påstand | Kommandoen som eier sannheten |
| --- | --- |
| Diffomfang, antall filer, +/- linjer | `git diff --stat <forrige>..<HEAD>` |
| Testtall | faktisk `npm test`-hale, ikke «alle grønne» |
| Build | faktisk `npm run build`-hale — «exit 0» er en påstand, ikke evidens |
| Filstatus i arbeidslisten | `git show HEAD:loop/ARBEIDSLISTE-SNUDLY.md` |
| Commit-SHA og trailere | `git log -1 --format='%H%n%b'` |
| Tidspunkt | `date -u +%Y-%m-%dT%H:%M:%SZ` |

Og for **type C** (betaling og butikk): requesten skal si eksplisitt at det ikke er gjort
endringer i App Store Connect, Play Console eller RevenueCat. Ingen diff kan bevise
fravær av en handling utenfor repoet — derfor må fraværet erklæres. Er en slik endring
faktisk gjort, er det en eskalering, ikke en linje i requesten.

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
