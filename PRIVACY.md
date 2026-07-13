# Personvernerklæring for Babyora

**MERK: Dette er et UTKAST. Må gjennomgås av jurist før publisering.**

**Sist oppdatert:** [DATO]
**Behandlingsansvarlig:** Sivert Skotvold Sende, [ORG.NR HVIS RELEVANT]
**Kontakt:** [E-POST]

## Hva er Babyora?

Babyora er en mobil-app som hjelper foreldre å vite hva barn 0–3 år skal ha
på seg, basert på vær og aktivitet.

## Hva slags data behandler vi?

### Data du oppgir
- **Barnets fornavn** (eller "Barnet" som default)
- **Barnets alder i måneder** (0–36)
- **By/lokasjon** for værvarsel (velges fra liste over norske byer)
- **Standard-aktivitet** (vogn / bæresele / utelek / på tur)

### Data appen henter automatisk
- **Værdata** fra Meteorologisk institutt (api.met.no) for valgt by — denne
  blir mellomlagret lokalt på enheten i 1 time
- **Push-token** (kun hvis du tillater morgenvarsler) — sendes til Apple
  Push Notification Service eller Google Firebase Cloud Messaging for å
  kunne sende deg morgenvarsel

### Data vi IKKE samler inn
- Vi samler IKKE inn nøyaktig GPS-posisjon (kun bynavn)
- Vi samler IKKE bilder eller media
- Vi samler IKKE kontaktliste, kalender eller helsedata
- Vi har INGEN sporings-piksler eller tredjeparts-annonser

## Hvor lagres data?

- **Lokalt på enheten:** all barneprofil-data og cache
- **På våre servere (Supabase, EU-region):** push-tokens og abonnement-status
  hvis du har Premium
- **Apple App Store Connect / Google Play Console:** kjøpshistorikk
  håndteres av Apple/Google, ikke av oss direkte. Vi får anonymisert
  abonnement-status via [RevenueCat](https://www.revenuecat.com/privacy).

## Hvor lenge lagres data?

- **Barnedata:** så lenge du har appen installert. Du kan når som helst
  slette enkelt-barn eller hele kontoen.
- **Push-tokens:** slettes når du skrur av varsler eller avinstallerer appen.
- **Abonnement-data:** beholdes i 5 år i tråd med norsk regnskapslov.

## Dine rettigheter (GDPR)

Du har rett til å:
- Be om innsyn i hvilke data vi har om deg
- Be om sletting ("retten til å bli glemt")
- Be om dataportabilitet
- Klage til [Datatilsynet](https://www.datatilsynet.no/)

Send forespørsel til: [E-POST]. Vi svarer innen 30 dager.

## Barn og personvern

Babyora er en app FOR FORELDRE som handler OM barn. Barnet er IKKE bruker.
Foreldrene oppgir barnedata på vegne av barnet sitt, og er ansvarlig for
denne behandlingen. Vi anbefaler å kun oppgi barnets fornavn (eller bare
"Barnet") — appen krever ikke fullt navn.

## Endringer

Vi varsler om vesentlige endringer i denne erklæringen via in-app-melding
ved neste app-åpning.

---

## TODO før publisering

- [ ] Advokat-gjennomgang (~5–10k NOK)
- [ ] Org.nr hvis du oppretter foretak
- [ ] Kontakt-epost (kan være `sivert@klemeg.no` etter domene-anskaffelse)
- [ ] Bekreft Supabase-region (EU)
- [ ] Innfør faktisk slettings-flyt i appen før personvernet hevder den finnes
- [ ] Avtale med RevenueCat som databehandler
- [ ] Sjekk om vi trenger DPA med Apple og Google (vanligvis dekket av deres
      standard-vilkår, men advokat bør bekrefte for barneapper)
