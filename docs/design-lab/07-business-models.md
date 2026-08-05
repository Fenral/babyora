# 07 — Business Models (Fase 6)

> **REVIDERT 2026-08-05 etter Sols runde 6-review (REVIDER, `appendix/fase6/sol-review-svar-fase6.md`):**
> 1. **A er NEDGRADERT fra anbefalt til «betinget tillatt»** — anbefalingen gjentok
>    fase 3-feilen (bevarer eiervedtak/kode). **B er «sikkerhetsmessig standardgrense
>    inntil motbevist»**: bevisbyrden ligger hos A, og samme amputasjonstest gjelder
>    begge (kan en uerfaren forelder velge trygt antrekk med KUN gratispakken, i
>    samtlige in-scope-scenarier?).
> 2. **Fagpanel-bryteren erstattes av tredelt port:** faglig suffisiens + observert
>    foreldreoppgaveutførelse + scenario-/feilanalyse. Ett avvik der gratispakken leder
>    til farlig handling stopper A.
> 3. **«Stemte 2 av 2» og ordet «verifisert» er FORBUDT** — konverteringsretorikk bygget
>    på barnets sikkerhet. Nøktern form: «Du har brukt Babyora i to ulike situasjoner»
>    + brukerens egen rapport. Etter-tur-status skiller «komfortabel»/«passet»/«sikker».
> 4. **Evalueringsregelen gjort deterministisk** (motsigelsen gulv/tak løst): evalueringen
>    STARTER ved første kvalifiserte bruk, har synlig status hele veien, og avsluttes
>    etter forhåndsforklart antall opplevelser eller fast periode derfra. Været er aldri
>    en skjult forbruksmåler.
> 5. **C omklassifisert til monetiseringskomponent** (kan selges under både A og B);
>    reell tredje modell er **institusjonelt finansiert sikkerhetsverktøy** (kommune/
>    arbeidsgiver/forsikring betaler; klesbransje-sponsor avvist som interessekonflikt).
> 6. **Bs arkitekturkostnad synliggjort:** koordinering/historikk krever identitet+backend
>    — porten velger produktarkitektur, ikke bare monetisering.
> 7. **Portens form (bindende, konvergerer med fase 5-reviewens krav):** eier RANGERER
>    FØRST målene (lønnsomhet / læringshastighet / sikkerhetsrekkevidde / offentlig
>    distribusjon), velger deretter 2–3 TILLATTE rammemodeller + én primærhypotese med
>    motkandidat, dato, budsjett og kill-switch — som **reversibelt risikovalg**, aldri
>    som validert strategi. Pris/paywall låses IKKE før fase 7-prototypene er testet.
> 8. Gjenstående Sol-krav til neste runde: økonomiske spenn (nødvendig betalende andel,
>    realistisk rekkevidde, kostnader, maks CAC), sammenligningsakser på tvers, Bs
>    exiter med terskel/dato/maksinvestering.

> Utført 2026-08-05 av Claude (CD/TL) med fire agenter (336k tokens). Fullrapporter med
> modellkort, etiske innvendinger og suksesskriterier i `appendix/fase6/`. Status:
> **TIL SOL-REVIEW, deretter EIERPORT** — eier velger monetiseringsretning.
> Alle tall uten kilde er merket hypotese; leverandørtall er merket leverandørpåstand.

## 1. Tre sammenlignbare modeller (DoD-krav)

| | **A — Evalueringsport** | **B — Gratis sikkerhetskjerne** | **C — Delta-abonnement** |
| --- | --- | --- | --- |
| Verdihypotese | Betal ETTER at rådet har bevist seg i ditt liv; sikkerhetsminimum alltid gratis | Trygg beslutning er gratis infrastruktur; det som selges er tid/hukommelse/koordinering | Husholdningen betaler for å få ENDRINGEN levert uten appåpning |
| Gratisnivå | Operasjonelt sikkerhetsminimum i alle tilstander + ni-ords-basisråd + delt kort (B4) | Full plaggliste nå/her + alt sikkerhetslag + enkeltdeling — «amputasjonstesten» håndhever grensen | Full vurdering i app (pull) + ALLE sikkerhets-deltaer pushes gratis + kortmottak |
| Premium | Full situasjonsliste, begrunnelser, varighet, delta/widget, garderobe-lite, planlegg | Delta-varsler/widget, historikk, garderobematching, planlegging, stående koordinering | Komfort-deltaer som push, widget/hjemkort, Live Activity på tur, auto-kortlevering, flere barn |
| Prøvetid | Evalueringsperiode (2 situasjoner, tak 14 d, ingen kort) — IKKE StoreKit-trial | Reverse-trial av komfortlaget, samme definisjon | Samme definisjon, på delta-verdi |
| Paywall-øyeblikk | Etter første VERIFIKASJON (anbefaling→tur→mikrosjekk); aldri i farevær | Aldri på svarflaten; første forespørsel på komfortflate etter verifisert komfortøyeblikk | Etter første verifiserte delta-verdi; aldri i sikkerhetsflater |
| Prislogikk [hypotese] | Sesongpass primært + månedlig fleksibelt; aldri årsplan mot 4–6 mnd behov | 29–39 kr/mnd + sesongpass 149–199 kr; kommunal per-aktiv-lisens som undermodell | 19–29 kr/mnd + «Første sesong»-pass 299–399 kr med opt-in-overgang; totalkost vises |
| Familieplan | Apple/Google-deling (gratis) | Samme | Samme; husholdning = betalingsenhet, mottakere alltid gratis |
| Retention | Sesong-gjenkjøp; graduation = designet utfall | Push-laget + sesong-gjenkjøp; dvale i stedet for glemselsinntekt | Værskifte-varsler + widget; aksepterer sommerpause |
| Churn-risiko | Reinstall-omgåelse (bevisst svak håndheving = etikk-kostnad); eksistensiell test se §2 | «Kan jo bare bruke gratisappen» (freemium ~2,1 % median); enveisdør på gratisnivået | Opt-in-tak ~52 %; baseline-forvitring; dør som SKU hvis H3 nedgraderes |

## 2. Den strukturelle nøkkelen: fagpanelet avgjør grensen mellom A og B

Alle tre modeller deler Sols r4-krav: **operasjonelt gratis beslutningsminimum** (en hard
block uten konkret handling er juridisk gratis men praktisk ubrukelig). Forskjellen er hvor
grensen går. **Modell As eksistensielle test, sagt rett ut:** hvis den faglige blindtesten
(premiss 4/5) konkluderer at den fulle plagglisten er *nødvendig* for trygg handling i
vanlige norske vinterforhold — ikke bare i block-scenarier — kollapser As verdilag inn i
gratislaget, og **B blir tvunget frem**. Fagpanelet er altså ikke bare lanseringsblokker;
det er beslutningsutløseren mellom A og B. Dette skal stå usminket ved porten.

## 3. Entitlement-matrise, kanalmodeller og klasseinndeling (Sols r4-krav — levert)

- **Entitlement-matrisen** (`appendix/fase6/entitlement-kanaler-klasser.md`): seks
  tilstander × flater, med invariant sikkerhetskolonne — ingen forelder står uten
  sikkerhetsminimum fordi de ikke betalte; utløpt/stale råd degraderes aktivt (utløpt
  grønt råd er farligere enn ingen).
- **Tre kanalmodeller:** rent forbrukerprodukt / gratis offentlig sikkerhetskjerne /
  kommunalt finansiert nytteflate — med krav (faglig signatur, governance,
  merkevareseparasjon), risiko (snikinnførings-kritikken består delvis selv med gratis
  kjerne) og bevisbehov per kanal.
- **Klasseinndelingen av de 41:** 9 plattform-/lovkrav, 1 tilgjengelighetskrav,
  **11 dokumenterte brukerfunn**, 19 analogi-presedens, 1 uprøvd hypotese. Kritisk:
  ingen av de 11 brukerfunnene måler kjernespørsmålet (forskrives/diagnostiseres/motta
  delta) — konsistent med matrisens 0/35. **Produktmodellvalget krever dagbokstudien,
  H2-routeren som instrument og prototypetest mot nullmodell — fase 4-research setter
  rammer, ikke svar.**

## 4. Claudes anbefaling og motanbefaling (DoD-krav)

**Anbefaling: MODELL A (Evalueringsport) med sesongpass-prising.** Begrunnelse: (1) den
bevarer eiervedtakets kjerne (hard gate) i sin sterkeste etiske form — muren flyttes til
etter verifikasjon, som både etikk- og konverteringsargumentene peker mot; (2) den er
gjennomførbar for en solo-utvikler uten governance-apparat; (3) sesongpasset gjør
graduation til ærlig forretningsdesign; (4) den holder B-veien åpen (gratisnivået kan
utvides senere — motsatt vei er en enveisdør).

**Motanbefaling: MODELL B (Gratis sikkerhetskjerne).** Plausibel og potensielt tvungen:
(1) fagpanelet kan tvinge den frem (§2); (2) den er eneste modell som kjøper
helsestasjonskanalen — Norges sterkeste distribusjonsmaskin; (3) den maksimerer
lenke-loopen. Kostnaden er forretningsrisikoen (freemium-konvertering ~2,1 % median og
tre navngitte exiter hvis både konvertering og kommunekanal svikter).

**Modell C** anbefales IKKE som selvstendig retning nå: den arver H3s uavklarte vilkår
(stale-safe, paritet, selvstendig verdi). Dens prislogikk (husholdning betaler, mottakere
gratis, totalkost vises) tas med som tillegg til A/B hvis H3 består vilkårene.

**Hva som IKKE kan avgjøres ved porten:** prispunkter (premiss 7-eksperimentet), reell
konvertering (analytics død), betalingsvilje per jobb (dagbokstudien). Porten velger
RETNING og gratis/betalt-GRENSE — tallene testes etterpå.

## 5. Prosess videre

1. Sol-review av modellene (angrip betalingsvilje, timing, transparens, retention;
   avvis kunstig friksjon) → runde 6 i `11-independent-review.md`.
2. **EIERPORT:** eier presenteres for A/B/C med Sols verdikt, §2-nøkkelen og
   premisslogg-status, og velger monetiseringsretning før full implementering.
