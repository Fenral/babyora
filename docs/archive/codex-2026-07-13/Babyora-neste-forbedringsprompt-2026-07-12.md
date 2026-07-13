# Forbedringsprompt — Babyora

**Mål:** Løft Babyora fra 73.3/100 ved å gjøre dagens gratisverdi raskere og mer troverdig, og Plus-verdien fremover, overalt og sammen mer konkret.

## Dette skal bevares

- Varm eller kald: Umiddelbart handlingsrettet — Forelderen får én kontroll, tre mulige signaler og konkret handling uten å måtte lære et system.
- Varm eller kald: God semantisk fargebruk — Varm, passe og kald kombinerer tekst, ikon og farge slik at mening ikke er fargeavhengig.
- TOG: Sterk og fokusert veileder — Romtemperatur, anbefalt TOG og soveposevisualisering er samlet i én tydelig oppgave.
- TOG: Svært god visuell temperaturkontroll — Gradient, temperaturpunkter og TOG-verdier gjør sammenhengen lett å utforske.
- Hjem: Særpreget temperaturatmosfære — Kuldepaletten, været og 3D-babyen gir Babyora et tydelig uttrykk som ikke ligner en generisk værapp.

## Prioriterte tiltak

### Tiltak 1: Gratis- og Plus-logikken forteller feil historie

- **Berørte sider:** Flere sider
- **Hvorfor:** Brukeren får ikke et intuitivt svar på hvorfor abonnementet er nødvendig, og paywallen risikerer å kannibalisere tilliten til gratisløftet.
- **Evidens:** repository — Settings viser automatisk posisjon uten Plus-merke og Morgenvarsel med Plus-merke; paywallen leder med «Våkn opp til ferdig antrekk». Koden i InnstillingerScreen gater morgenvarsel, mens automatisk posisjon ikke sjekker premium.
- **Endring:** La gratis beholde dagens komplette anbefaling og enkel morgenpåminnelse; samle Plus rundt kommende dager, automatisk sted, flere steder/barn og reell omsorgsdeling før dette markedsføres.
- **Godkjenningskriterium:** Ny skjermfangst viser at problemet er løst uten å svekke dagens komplette gratisråd, tilgjengelighet eller eksisterende styrker.

### Tiltak 2: Paywallen selger gratisproduktets kjerne

- **Berørte sider:** Betalingsvegg
- **Hvorfor:** Brukeren kan oppfatte gratisløftet som en demo eller ikke forstå hva abonnementet utvider.
- **Evidens:** repository — paywall--default.png og PAYWALL_COPY.flagshipHeadline
- **Endring:** Led med «Fremover, overalt og sammen» og vis tre konkrete situasjoner: morgendagens endring, råd hos bestemor og delt anbefaling.
- **Godkjenningskriterium:** Ny skjermfangst viser at problemet er løst uten å svekke dagens komplette gratisråd, tilgjengelighet eller eksisterende styrker.

### Tiltak 3: Tilgangsreglene er motsatt av produktretningen

- **Berørte sider:** Innstillinger
- **Hvorfor:** Gratisbrukeren får «overalt», men må betale for vanemekanismen som kunne etablert daglig bruk hjemme.
- **Evidens:** repository — settings--default.png og gating-logikken i InnstillingerScreen.tsx
- **Endring:** Gjør enkel morgenpåminnelse gratis og flytt automatisk sted/flere steder til Plus, med tydelig fallback til hjemsted.
- **Godkjenningskriterium:** Ny skjermfangst viser at problemet er løst uten å svekke dagens komplette gratisråd, tilgjengelighet eller eksisterende styrker.

### Tiltak 4: Språk og merkevare skifter mellom skjermene

- **Berørte sider:** Flere sider
- **Hvorfor:** Ujevn terminologi gjør produktet mindre presist og får flere sterke skjermer til å føles som ulike versjoner av appen.
- **Evidens:** rendered — Påkledning viser «8 lag», Finn antrekk viser «4 lag», garderoben bruker «plagg», paywallen bruker Babyora Plus og samtidig «Én Premium», mens Guide har KLEMEG i toppteksten.
- **Endring:** Bruk «plagg» i brukergrensesnittet, «Babyora Plus» konsekvent og Babyora som eneste synlige produktnavn.
- **Godkjenningskriterium:** Ny skjermfangst viser at problemet er løst uten å svekke dagens komplette gratisråd, tilgjengelighet eller eksisterende styrker.

### Tiltak 5: Faglig autoritet kommuniseres for kategorisk

- **Berørte sider:** Flere sider
- **Hvorfor:** Den visuelle presisjonen kan gi forelderen større sikkerhet i utsagnene enn det er grunnlag for, noe som øker tillits- og sikkerhetsrisiko.
- **Evidens:** rendered — Guide og Finn antrekk kobler utendørskalkulatoren til «TOG-standarden», TOG leder med «Riktig varme for natten», og Varm eller kald sier at kalde hender og føtter ikke betyr at barnet fryser.
- **Endring:** Skill TOG tydelig fra uteklær, moderer absolutte formuleringer og vis relevante forbehold eller produsentråd uten å fylle skjermene med juridisk tekst.
- **Godkjenningskriterium:** Ny skjermfangst viser at problemet er løst uten å svekke dagens komplette gratisråd, tilgjengelighet eller eksisterende styrker.

## Ikke gjør

- Ikke gjennomfør et generelt redesign eller endre Babyoras visuelle identitet uten evidens.
- Ikke gjør gratisanbefalingen mindre korrekt eller mindre komplett.
- Ikke bruk fake urgency, frykt, skam eller manipulerende opt-out-copy.
- Ikke påstå at en funksjon finnes før den er verifisert i kode og runtime.
- Ikke legg til nye funksjoner utenfor tiltakene.

## Verifisering

Kjør relevante tester, ta de samme skjermbildene på 390×844, og rapporter scoreendring med samme rubrikkversjon.
