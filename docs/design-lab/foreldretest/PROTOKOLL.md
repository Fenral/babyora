# Foreldretest — gjennomføringsprotokoll (5–8 deltakere)

> Skrevet for eier som operatør — ingen forskerbakgrunn kreves. Følg dokumentet
> fra topp til bunn. Alt som skal sies ordrett står i anførselstegn i egne
> bokser. Rekruttering og samtykke står i `REKRUTTERING.md` i samme mappe.
>
> Kildekontrakter: `docs/design-lab/12-prototype-spec.md` (v2),
> `lab/p1..p4/manifest.ts` (oppgaver, fasit, farlige feil, stoppregler),
> `lab/felles/sele/rekkefolge.ts` (Williams-design), `nullarmer.ts`,
> `deltakermodus.ts` (URL-kontrakten), `disclaimer.tsx` (etikk-teksten).

---

## 1. Hva denne testen er — og ikke er

- **Er:** en retningstest. 5–8 foreldre løser de samme påkledningsoppgavene i
  fem varianter (P1–P4 + en nullmodell uten app-hjelp). Vi ser etter om folk
  gjør riktig første handling, om de gjør farlige feil, og om de forstår
  utløpte/maskerte råd som trygg degradering.
- **Er ikke:** statistikk. Med 5–8 deltakere kan ingenting «bevises» — vi
  samler retningssignal og enkeltobservasjoner. Én farlig feil teller likevel
  fullt ut (se stoppreglene i §9).
- **Alt er fiktivt:** barn, vær og råd er laget for testing. Ingen deltaker
  skal bruke noe fra testen på et ekte barn (§10).

---

## 2. Før testdagen — forberedelse

### 2.1 Utstyr

- **Én telefon** til deltakeren (din egen, nyladet, forstyrrelser av).
- **Én PC** (din) som kjører laben på samme Wi-Fi som telefonen.
- **Stoppeklokke** (bruk din egen mobil eller et armbåndsur — ikke
  deltaker-telefonen).
- **Utskrifter:** ett skjema per deltaker (§8), kjøreplanen for
  deltakernummeret (§4), manuset (§6), samtykkeskjema (fra REKRUTTERING.md).
- Penn, og gjerne en klype kontanter/gavekort som oppmerksomhet.

### 2.2 Start laben

1. Åpne terminal i `babyora/` og kjør:
   ```
   npm run dev:lab -- --host
   ```
2. Finn PC-ens IP-adresse (Windows: `ipconfig` → «IPv4 Address», f.eks.
   `192.168.1.42`).
3. På telefonen: åpne `http://<PC-IP>:5173/lab/` og sjekk at laben laster.
   Basen i alle URL-er under er:

   ```
   http://<PC-IP>:5173/lab/
   ```

   (heretter kalt `LAB` — bytt ut med din faktiske adresse).

### 2.3 Legg URL-listen på telefonen

Å taste lange URL-er mellom oppgavene er upraktisk. Gjør ett av dette på
forhånd:

- Lim hele URL-listen for dagens deltaker (fra kjøreplanen i §4 + tabellen i
  §3) inn i en notat-app på telefonen, som klikkbare lenker, **eller**
- lagre hver URL som bokmerke i telefonens nettleser, navngitt
  «D3-2b» osv. etter kjøreplanen.

Mellom hver oppgave tar du telefonen, åpner neste lenke, og gir den tilbake.

### 2.4 Spole-bokmerker (virtuell klokke)

Labens klokke er virtuell. I deltakermodus finnes ingen synlige
tidskontroller — du spoler via to **bokmerker med JavaScript** som du lager på
telefonens nettleser på forhånd:

- Bokmerke «SPOL 30» med adressen: `javascript:window.__lab&&window.__lab.spol(30)`
- Bokmerke «SPOL 120» med adressen: `javascript:window.__lab&&window.__lab.spol(120)`

Slik lager du dem: lagre en hvilken som helst side som bokmerke, rediger
bokmerket og lim inn `javascript:`-linjen som adresse. Test på forhånd: åpne en
P3-oppgave, trykk bokmerket (i Chrome på Android: skriv bokmerkenavnet i
adressefeltet og velg det), og se at det lille klokkemerket øverst («kl. HH:MM
· lab») flytter seg. Spoling logges automatisk som `sele:spol`.

Når protokollen sier «SPOL +30» tar du telefonen, aktiverer bokmerket, og gir
den tilbake uten kommentar utover manuset.

### 2.5 To ting du aldri gjør

- **Aldri bruk `&bekreftet=1`** i noen URL under foreldretest. Parameteren
  hopper over etikkporten og er kun for skjermbevis-skript.
- **Aldri operatørmodus på deltaker-telefonen.** Deltakeren skal bare se
  låste `modus=deltaker`-flater.

---

## 3. URL-kontrakten — eksakte URL-er per arm × scenario

Kontrakten fra `deltakermodus.ts`:

```
LAB?modus=deltaker&arm=<p1|p2|p3|p4|null>&scenario=<scenario-id>
```

For nullmodellen velges i tillegg oppgavetype med
`&oppgave=<paakledning|validering|handoff>`. Uten gyldig `arm` faller siden
til operatørmodus — da har du skrevet feil, prøv igjen.

De ti scenario-id-ene: `normal-dag`, `grensevaer`, `sovende-vognbarn`,
`bilstol`, `manglende-vaerdata`, `endret-vaer`, `utlopt-raad`,
`ny-omsorgsperson`, `dynamic-type`, `utendorslys`.

**P1 (Protokollen):**

```
LAB?modus=deltaker&arm=p1&scenario=normal-dag
LAB?modus=deltaker&arm=p1&scenario=grensevaer
LAB?modus=deltaker&arm=p1&scenario=sovende-vognbarn
LAB?modus=deltaker&arm=p1&scenario=bilstol
LAB?modus=deltaker&arm=p1&scenario=manglende-vaerdata
LAB?modus=deltaker&arm=p1&scenario=endret-vaer
LAB?modus=deltaker&arm=p1&scenario=utlopt-raad
LAB?modus=deltaker&arm=p1&scenario=ny-omsorgsperson
LAB?modus=deltaker&arm=p1&scenario=dynamic-type
LAB?modus=deltaker&arm=p1&scenario=utendorslys
```

**P2 (Spennet):** samme ti linjer med `arm=p2`.
**P3 (Briefen):** samme ti linjer med `arm=p3`.
**P4 (Brief → protokoll):** samme ti linjer med `arm=p4`.

**Nullmodellen** (oppgavetypen følger regelen i §5.3):

```
LAB?modus=deltaker&arm=null&scenario=normal-dag&oppgave=paakledning
LAB?modus=deltaker&arm=null&scenario=dynamic-type&oppgave=paakledning
LAB?modus=deltaker&arm=null&scenario=ny-omsorgsperson&oppgave=handoff
LAB?modus=deltaker&arm=null&scenario=endret-vaer&oppgave=validering
LAB?modus=deltaker&arm=null&scenario=bilstol&oppgave=paakledning
LAB?modus=deltaker&arm=null&scenario=utendorslys&oppgave=paakledning
LAB?modus=deltaker&arm=null&scenario=utlopt-raad&oppgave=paakledning
```

---

## 4. Rekkefølgen — Williams-design, konkret per deltaker

Rekkefølgen kommer fra `rekkefolge.ts` (Williams-konstruksjonen: 10 sekvenser
som balanserer både posisjon og hvilken arm som kom rett før). Deltaker nr. N
bruker sekvens N. **Ikke bytt om på rekkefølgen** — balansen er hele poenget.
Full balanse krever 10 deltakere; med 5–8 er balansen delvis, og det noteres i
analysen (§11).

Hver eksponering kjører (i denne faste rekkefølgen):

1. **Trening:** `normal-dag` — kort innføring i flaten. **Skåres aldri.**
2. **Måling A** (normalfamilien): `ny-omsorgsperson` eller `dynamic-type`
3. **Måling B** (grensefamilien): `endret-vaer`
4. **Måling C** (avviksfamilien): `bilstol` eller `utendorslys`
5. **Måling D** (degradertfamilien): `utlopt-raad`

Hvilket scenario måling A og C bruker, roterer automatisk (fasiten under er
regnet ut fra selens `tildelScenarier` — bare følg tabellen).

**Kjøreplaner (arm — måling A / B / C / D):**

| Deltaker | 1. eksponering | 2. | 3. | 4. | 5. |
|---|---|---|---|---|---|
| **1** | P1 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P2 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | NULL — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P3 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P4 — dynamic-type / endret-vaer / utendorslys / utlopt-raad |
| **2** | P2 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P3 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P1 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P4 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | NULL — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad |
| **3** | P3 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P4 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P2 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | NULL — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P1 — dynamic-type / endret-vaer / utendorslys / utlopt-raad |
| **4** | P4 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | NULL — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P3 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P1 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P2 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad |
| **5** | NULL — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P1 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P4 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P2 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P3 — dynamic-type / endret-vaer / utendorslys / utlopt-raad |
| **6** | P4 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P3 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | NULL — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P2 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P1 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad |
| **7** | NULL — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P4 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P1 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P3 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P2 — dynamic-type / endret-vaer / utendorslys / utlopt-raad |
| **8** | P1 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | NULL — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P2 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad | P4 — dynamic-type / endret-vaer / utendorslys / utlopt-raad | P3 — ny-omsorgsperson / endret-vaer / bilstol / utlopt-raad |

Trening (`normal-dag`) kjøres først i **hver** eksponering, i samme arm.
Trenger deltakeren mer innføring, kan du bruke `grensevaer`,
`sovende-vognbarn` eller `manglende-vaerdata` som ekstra trening — de skåres
aldri. Skåring skjer **kun** på måling A–D.

**Protokollbeslutning (dokumentert antagelse):** selen tildeler fire
målescenarier per eksponering; trening er redusert til ett fast scenario
(`normal-dag`) av tidshensyn, slik at hele økten holder seg rundt 35–45
minutter. `normal-dag` inngår aldri i skåringen, så skillet trening/måling er
intakt.

---

## 5. Slik kjører du én deltaker

### 5.1 Flyt (ca. 35–45 min)

1. **Velkomst + samtykke** (5 min): les intro-manuset (§6.1), få signert
   samtykke, gi deltakeren sitt nummer.
2. **Fem eksponeringer** (5–7 min hver): følg kjøreplanen for
   deltakernummeret. Per oppgave: åpne URL → gi telefonen → deltakeren leser
   etikkporten selv og trykker start → du starter stoppeklokka → deltakeren
   løser oppgaven (be dem tenke høyt) → stopp klokka ved armens sluttpunkt
   (§7.3) → still spørsmålene (§6.4) → fyll skjema.
3. **Etter hver arm:** still «ville du brukt dette?»-spørsmålet (§6.5).
4. **Avslutning** (2 min): takk, oppmerksomhet, minn om at alt var fiktivt.

### 5.2 Spolepunkter (når du bruker bokmerkene)

- **P1, på måling A** (normalfamilie-scenariet): når deltakeren har bekreftet
  stabelen, men **før** kvitteringen: ta telefonen, trykk **SPOL 120**, gi
  tilbake, og still stale-spørsmålene (§6.4). Dette er «rådet utløper midt i
  oppgaven» fra P1-manifestet.
- **P3 og P4, på måling A, B og C:** etter at deltakeren har lest flaten og
  oppgitt handlingen: **SPOL 30** (da ankommer versjon 2, og en forsinket
  versjon 1 skal synlig forkastes). Etter versjonsspørsmålene: **SPOL 120**
  (utløp) og still stale-spørsmålene.
- **`utlopt-raad`-scenariet starter allerede utløpt** i alle armer — ingen
  spoling der.
- P2 og nullmodellen: ingen spoling.

### 5.3 Nullmodellens oppgavetype

- `ny-omsorgsperson` → `&oppgave=handoff` (skriv meldingen du ville sendt)
- `endret-vaer` → `&oppgave=validering` (holder gårsdagens antrekk?) — dette
  er kontrollen P2 sammenlignes mot
- alle andre scenarier → `&oppgave=paakledning`

---

## 6. Manus — ordrett

### 6.1 Intro (leses ordrett ved oppstart)

> «Takk for at du stiller opp. Du skal prøve noen skisser til en app som
> hjelper foreldre å kle barn for turer ute. Alt du ser er en prototype:
> barnet, været og rådene er fiktive og laget for testing. Ingenting her er
> ekte råd, og ingenting skal brukes på et virkelig barn.
>
> Det er prototypen som testes — aldri deg. Du kan ikke svare feil, og du kan
> ta pauser eller avbryte når som helst uten å si hvorfor.
>
> Jeg kommer til å gi deg en telefon med én oppgave om gangen. Les det som
> står på skjermen og gjør oppgaven. Tenk gjerne høyt underveis. Jeg kan ikke
> hjelpe deg mens du løser oppgaven — det er med vilje, for vi vil se om
> skjermen klarer seg alene. Noen ganger tar jeg telefonen et øyeblikk for å
> stille den om, og gir den rett tilbake.
>
> Jeg noterer på papir med et deltakernummer, aldri navnet ditt. Telefonen
> lagrer en anonym logg over trykkene dine. Er det greit?»

Før **hver** oppgave viser skjermen dessuten etikkporten («Dette er en
forskningsprototype …») som deltakeren selv leser og bekrefter. Første gang
sier du:

> «Denne siden kommer før hver oppgave. Les den, og trykk på knappen når du er
> klar — da starter oppgaven.»

### 6.2 Per oppgave (leses når du gir telefonen)

Skjermen viser selv oppgaveprompten (én setning øverst). Du sier bare:

> «Her er neste oppgave. Les det som står, gjør det oppgaven ber om, og si fra
> når du er ferdig. Tenk gjerne høyt.»

For **P3** legger du til, første gang i armen:

> «I denne varianten skal du klare deg med den lille flaten du ser — som om
> den satt på låseskjermen. Ikke let etter mer app enn det som vises.»

For **nullmodellen** legger du til, første gang i armen:

> «I denne varianten er det ingen app-hjelp — du bruker det du kan fra før,
> pluss det som står på skjermen.»

### 6.3 Hva du IKKE skal si (gjelder hele testen)

- Aldri forklar flaten, pek på elementer, eller les opp innhold fra skjermen.
- Aldri si «riktig», «feil», «bra» eller «nesten» — verken underveis eller
  etterpå. Si «takk» og «notert».
- Aldri bruk ordene «måler», «spennet», «protokoll», «brief», «versjon»,
  «utløpt» eller «maskert» før deltakeren selv gjør det — spørsmålene i §6.4
  er formulert for å unngå å lede.
- Aldri avslør hva som skåres, eller at én observasjon kan stoppe en arm.
- Aldri gi ekte påkledningsråd. Hvis deltakeren spør: «Dette er en prototype
  med fiktive data, så jeg kan ikke gi råd her — helsestasjonen er riktig
  sted for ekte spørsmål.»
- Hvis deltakeren står helt fast i over ett minutt: si «Bare gjør det du
  ville gjort hjemme», noter at det skjedde, og la oppgaven fortsette eller
  avslutt den — aldri løs den for dem.

### 6.4 Spørsmål etter hver måleoppgave (still i denne rekkefølgen)

Nøytralformuleringene er faste (fra spec v2 §4) — ikke omformuler:

1. **Handling:** «Hva sier appen at du skal gjøre nå?»
   (I nullmodellen: «Hva bestemte du deg for?»)
2. **Grunnlag / svakeste premiss:** «Hva bygger appen dette på?» og «Hva av
   det virker mest usikkert?»
3. **Kun når flaten viser utløpt/maskert tilstand (stale):**
   «Hva betyr det du ser på skjermen nå?» og «Hva gjør du da?»
   — Noter med deltakerens egne ord om de kaller det noe i retning av «feil»,
   «bug» eller «appen er ødelagt».
4. **Kun P3/P4 etter SPOL 30:** «Har noe endret seg siden i stad? Hva?»
5. **Kun P4 ved åpning:** «Er det du ser nå det samme rådet som på den lille
   flaten, eller et annet? Hvordan ser du det?»
6. **Uro:** «På en skala fra 1 til 5 — hvor urolig var du underveis for om
   barnet ville blitt riktig kledd? 1 er helt rolig, 5 er svært urolig.»

### 6.5 Etter hver arm (én gang per eksponering)

> «Ville du brukt dette hjemme, i din egen hverdag? Ja, kanskje eller nei —
> og hvorfor?»

---

## 7. Måling per oppgave — hva du noterer

### 7.1 De sju målene

| Mål | Slik avgjør du det |
|---|---|
| **Korrekt første handling** | Sammenlign deltakerens første handling/svar med fasiten for scenariet i armens manifest (kortversjon i §7.2). J/N. |
| **Farlig feil** | Skjedde noe fra armens farlig feil-liste (§9)? Noter koden — én observasjon utløser stoppregelen. |
| **Tid** | Stoppeklokke fra deltakeren trykker startknappen på etikkporten til armens sluttpunkt (§7.3). Sekunder. Labloggens klokkeslett er virtuelle og kan ikke brukes til tid. |
| **Svakeste premiss** | Klarer deltakeren å gjenfortelle hva rådet bygger på, og peke på det usikreste (flaten viser selv en «Usikrest …»-linje)? K = korrekt, D = delvis, F = feil/blankt. |
| **Stale-forståelse** | Kun ved utløpt/maskert tilstand: forstås den som «må beregnes på nytt» + fallback (K), eller som feil/bug eller noe som kan brukes videre (F)? Ellers «–». |
| **Uro 1–5** | Deltakerens eget tall. |
| **Ville du brukt dette?** | Per arm: ja/kanskje/nei + hvorfor (fritekst). |

### 7.2 Fasit-kortversjon (fullversjonen står i manifestene)

**P1:** normalfamilien → bekreft hele stabelen med ett trykk + utfør
nakkesjekken; `endret-vaer` → bekreft stabelen OG kjenn på nakken underveis;
`bilstol` → bilstol-steget (tynne lag, sele tett, dress over som teppe) FØR
ytterlaget; `utlopt-raad` → ikke gjenbruk den gamle listen, fallback + «Beregn
på nytt».

**P2** (kandidaten «trygg» er lastet, se §12): normalfamilien → les «i trygt
spenn» → gå ut som planlagt, kjenn på nakken; `endret-vaer` → døm antrekket
mot DAGENS spenn, ikke gårsdagens følelse; `bilstol` → følg den harde
bilstolhendelsen uansett posisjon i spennet; `utendorslys` → samme avlesning i
høykontrast; `utlopt-raad` → utløpt/maskert spenn = fallback, aldri gyldig
grunnlag; `ny-omsorgsperson` → les posisjon, «Usikrest …» og gyldighet rett
fra flaten.

**P3:** oppgi handlingen fra gjeldende brief uten å åpne noe mer; etter SPOL
30 skal endringen fra V1 oppdages og en forsinket V1 aldri behandles som
gjeldende; `bilstol` → bilstol-innholdet er FØRSTE handling; `utlopt-raad` →
maskert = «må beregnes på nytt» + fallback; kvitter med «Åpnet».

**P4:** utfør protokollens steg 1 rett fra briefen uten å grave i gårsdagens
grunnlag; ved åpning skal deltakeren bekrefte at det er SAMME versjon;
nakkesjekken bekreftes sist; `endret-vaer` → deltaet er sekundær opplysning,
aldri en konkurrerende handling nå; `utlopt-raad` → som P3.

**Nullmodellen:** her finnes ingen app-fasit — noter beslutningen, tiden og om
deltakeren selv nevner nakkesjekk/bilstolhensyn uoppfordret.

### 7.3 Sluttpunkt for stoppeklokka per arm

- **P1:** kvitteringen vises (sløyfen fullført).
- **P2:** deltakeren har lest posisjonen og sagt hva de gjør nå.
- **P3:** «Åpnet»-knappen er trykket.
- **P4:** kontrollpunktet (nakkesjekken) er bekreftet i den åpnede protokollen.
- **Null:** armens egen sluttknapp («Antrekket er bestemt» / «Holder»–«Holder
  ikke» / meldingen sendt).

Spoling og spørsmål skjer ETTER at klokka er stoppet — stale-delen tidsmåles
ikke.

---

## 8. Skjema (skriv ut ett sett per deltaker)

```
FORELDRETEST — DELTAKER NR: ____   DATO: ________   OPERATØR: ________
(Aldri navn på dette arket.)

EKSPONERING ___ av 5    ARM: ____    FOREGÅENDE ARM: ____ (fra kjøreplanen)

Trening (normal-dag) gjennomført: [ ]   Notat: __________________________

+----+----------------------+--------+--------+------+---------+-------+------+
| #  | Scenario             | Korrekt| Farlig | Tid  | Svakeste| Stale | Uro  |
|    |                      | første | feil   | (s)  | premiss | K/F/– | 1–5  |
|    |                      | J/N    | (kode) |      | K/D/F   |       |      |
+----+----------------------+--------+--------+------+---------+-------+------+
| A  |                      |        |        |      |         |       |      |
+----+----------------------+--------+--------+------+---------+-------+------+
| B  | endret-vaer          |        |        |      |         |       |      |
+----+----------------------+--------+--------+------+---------+-------+------+
| C  |                      |        |        |      |         |       |      |
+----+----------------------+--------+--------+------+---------+-------+------+
| D  | utlopt-raad          |        |        |      |         |       |      |
+----+----------------------+--------+--------+------+---------+-------+------+

Kun P1: utløp midt i oppgave A (SPOL 120): stale-forståelse K/F: ____
Kun P3/P4: oppdaget endringen etter SPOL 30 (J/N): ____
           forsinket V1 avvist/ignorert korrekt (J/N): ____
Kun P4: bekreftet samme versjon ved åpning (J/N): ____

«Ville du brukt dette?» (ja/kanskje/nei): ______
Hvorfor (deltakerens ord): _______________________________________________
Sitater/observasjoner: ___________________________________________________
```

Fyll «Scenario» i rad A og C fra kjøreplanen (§4). Kopier siden fem ganger per
deltaker (én per eksponering).

---

## 9. Stoppregler — farlige feil (nulltoleranse)

**Én observasjon av en farlig feil stopper DEN armen for resten av studien:**
ikke kjør armen for flere deltakere før den er redesignet og skal testes på
nytt. De andre armene fortsetter som planlagt (hopp over den stoppede armen i
kjøreplanen og noter det). En terskel som «85 % forsto det» kan aldri viske ut
én farlig enkeltobservasjon.

**P1-koder:**
- P1-F1: bekrefter bilstol-protokollen uten å ha sett/utført bilstol-steget
  (tykk dress under selen).
- P1-F2: utløpt tilstand tolkes som «appen er ødelagt» og den gamle listen
  følges videre.
- P1-F3: avviksmodus omgås med ett-trykks-bekreftelse (kritiske steg hoppes
  over).
- P1-F4: nakkesjekk-steget nås aldri (faller fra før siste steg).
- P1-F5: stoppkriteriet leses som informasjon, ikke avbruddsregel (feil svar
  på «klam nakke»).

**P2-koder:**
- P2-F1: deltakeren tror figuren har målt barnets tilstand.
- P2-F2: kald side / invertert tilstand leses som trygg (feil beskyttet ende).
- P2-F3: hard hendelse (særlig bilstol) overses fordi posisjonen «ser grei ut».
- P2-F4: maskert eller utløpt spenn brukes som gyldig beslutningsgrunnlag.

**P3-koder:**
- P3-F1: innhold fra maskert/utløpt brief brukes i en beslutning.
- P3-F2: forsinket eldre brief (V1 etter V2) oppfattes som gjeldende.
- P3-F3: delta leses i feil retning (tar av lag når briefen sier legg til).
- P3-F4: bilstol-innholdet mangler i eller utelates fra beslutningen.
- P3-F5: maskert tilstand leses som feil/bug slik at flaten avvises.
  **Tilleggsregel:** kaller to av de fem første deltakerne spontant den
  maskerte tilstanden «feil» eller «bug», stoppes P3 selv uten annen feil.

**P4-koder:**
- P4-F1: brieffelten viser en annen handling enn protokollens steg 1.
- P4-F2: flaten har to likestilte handlinger (neste handling blir tvetydig).
- P4-F3: åpnet protokoll har en annen versjon enn briefen. **Dette stopper i
  tillegg hele P4-BYGGET umiddelbart** — komposisjonskontrakten er brutt, og
  ingen ny deltaker eksponeres for P4 før den er rettet.
- P4-F4: innhold fra maskert/utløpt brief/protokoll brukes i en beslutning.
- P4-F5: bilstol-innholdet mangler i briefen eller i den åpnede protokollen.
- P4-F6: kontrollpunktet (nakkesjekken) nås aldri.

**Trivselsstopp (gjelder alle armer):** virker deltakeren stresset eller
ukomfortabel, tilby pause eller avslutt økten. Deltakerens ve og vel går foran
alle data.

---

## 10. Etikk

1. **Fiktivt-disclaimeren håndheves dobbelt:** du leser intro-manuset (§6.1)
   høyt, OG hver oppgave starter med etikkporten på skjermen, som deltakeren
   selv må bekrefte. Skjermteksten er ordrett:
   > «Barnet, været og rådene i denne oppgaven er fiktive og laget for
   > testing. Ingenting her er ekte påkledningsråd, og ingenting skal brukes
   > på et virkelig barn. Oppgaven bruker ingen posisjon og ingen ekte
   > værdata. Det du gjør i oppgaven, lagres i en anonym hendelseslogg for
   > analyse.»
2. **Ingen ekte råd**, verken under eller etter testen (§6.3). Henvis til
   helsestasjonen.
3. **Frivillig avbrudd:** pauser og avbrudd når som helst, uten begrunnelse,
   uten at oppmerksomheten bortfaller. Avbrutte data beholdes bare hvis
   deltakeren sier ok — ellers makuleres skjemaet.
4. **Anonymt:** skjema og logg bruker kun deltakernummer. Koblingslisten
   nummer↔navn finnes bare på papir hos deg, og makuleres når analysen er
   ferdig. Ingen lyd- eller videoopptak.
5. **Barn til stede:** helt greit at deltakeren har med barnet — men testen
   handler aldri om barnet, og ingen oppgave skal utføres på et ekte barn.

---

## 11. Analyseregler — hva du kan og ikke kan konkludere

### 11.1 Slik sammenlignes armene

- Hver arm sammenlignes **mot nullmodellen med samme oppgavetype**:
  P1, P3 og P4 mot null-påkledning; P2 mot null-validering
  (`endret-vaer&oppgave=validering`); overleveringslesing (ny omsorgsperson)
  mot null-handoff. Bland aldri tider på tvers av oppgavetyper —
  nullarm-kontrakten sier uttrykkelig at hver arm har sin egen sammenlignbare
  slutt.
- Tell per arm: antall korrekte første handlinger, antall farlige feil (skal
  være null), stale-forståelse K/F, tidsretning mot matchende nullarm
  (raskere/likt/tregere — ikke gjennomsnitt med desimaler), uro-tall, og
  ja/kanskje/nei.

### 11.2 Carryover-notat

Noter alltid **foregående arm** per eksponering (står i kjøreplanen). Med 10
deltakere er Williams-designet i full balanse; med 5–8 er det bare delvis
balansert. Derfor: hvis en arm ser svak ut, sjekk om observasjonene
systematisk kom rett etter én bestemt annen arm — i så fall er funnet
svakere, og det skrives inn i notatet. Ingen tallmessig carryover-beregning
gjøres på dette antallet.

### 11.3 Hva som IKKE kan konkluderes fra n = 5–8

- **Ingen prosenter som bevis, ingen statistisk sikkerhet, ingen «X av Y
  stemte»-retorikk.** Skriv observasjoner («tre deltakere nølte ved …»), ikke
  andeler som om de var målinger av befolkningen.
- **Ingen vinnerkåring alene på denne testen.** Resultatet er et
  retningssignal inn i eierport-beslutningen, sammen med de andre portene.
- **Ingen native-konklusjoner:** leveringstid, ekte widgets/låseskjerm,
  Dynamic Type i iOS, VoiceOver/TalkBack, batteri og bakgrunnsoppdatering kan
  ikke bedømmes i web — alle slike funn merkes «krever native-sjekk».
- **Ingen tillitskonklusjon for P2:** hypotese-etiketten («ikke fagvalidert»)
  endrer det som måles; P2-testen sier noe om forståelse og interaksjon, ikke
  om tillit i produksjon.
- **Positive unntak:** én farlig feil er et gyldig funn i seg selv (derfor
  stoppreglene), og gjentatte, likelydende misforståelser er et gyldig
  retningssignal selv med få deltakere.

### 11.4 Datahåndtering

Papirskjemaene er primærdata. Telefonens hendelseslogg lever bare per
oppgaveside (den nullstilles når du åpner neste URL) og har virtuelle
klokkeslett — bruk den ikke som tidsmåler, og ikke bygg analysen på den.

---

## 12. Kjente begrensninger (meld fra før testdag hvis de må løses)

1. ~~P2-kandidaten er alltid «trygg»~~ **LØST 2026-08-06 (commit 933e43e):**
   P2-oppgaven styres nå med `&kandidat=kald`, `&kandidat=trygg` eller
   `&kandidat=varm` på deltaker-URL-en. For P2-eksponeringen i kjøreplanen:
   bruk **kald** som måleoppgave (den tester diagnosen — ser deltakeren at
   antrekket er for tynt?), og trygg som treningsoppgave. Eksempel:
   `...?modus=deltaker&arm=p2&scenario=normal-dag&kandidat=kald`
2. **Web måler kvittering og gjenfortelling, ikke fysisk handling.** At noen
   trykker «nakkesjekk bekreftet» beviser ikke at en nakkesjekk ville blitt
   gjort hjemme.
3. **Spoling krever bokmerkene fra §2.4.** Fungerer de ikke på din telefon,
   test i en annen mobilnettleser før testdagen — ikke improviser med
   operatørmodus foran deltakeren.
4. **Tidene er håndmålte** med stoppeklokke og har den presisjonen det gir.
   Det holder for retningssignal, som er alt denne testen skal gi.
