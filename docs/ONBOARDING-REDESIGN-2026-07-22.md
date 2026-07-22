# Babyora onboarding — audit og redesign

Dato: 22. juli 2026

## Hva som faktisk var endret før denne gjennomgangen

De siste onboarding-commitene gjorde dette:

- `70684f0`: la inn `babyora-intro-v3.webp` og en kort MP4-animasjon på første steg.
- `21cc562`: sørget for at animasjonen bare spilles én gang per onboarding-økt.
- `f15a43d`: markerte animasjonen som ferdig når brukeren hoppet videre.
- `766734a`: erstattet fire ulike akvarellillustrasjoner med samme Babyora-baby i kompakt variant på steg 2–5, med små kontekstikoner.

Commit `dd90970` endret ikke onboarding. Den endret bare synlig «Klemeg» til «Babyora» i Guide og rettet TestFlight-versjoneringen.

## Hvorfor forrige onboarding ikke fungerte

1. Toppen hadde tre parallelle navigasjonssignaler: «Steg X av 4», «Hopp over» og vertikale prikker.
2. Obligatoriske opplysninger kunne hoppes over, selv om resten av flyten var avhengig av dem.
3. Den samme kvadratiske illustrasjonen tok uforholdsmessig mye høyde på hvert steg.
4. Fødselsdato brukte en full månedskalender. Den var plasskrevende og krevde mye navigasjon for å velge en dato måneder eller år tilbake.
5. Layouten hadde ingen egne høydebrudd for små telefoner. Den skalerte hovedsakelig etter bredde.
6. Navnefeltet fikk fokus automatisk og kunne åpne tastaturet før brukeren hadde orientert seg.
7. CTA-området var stort samtidig som innholdet over også var høyt. Resultatet ble scrolling og ujevn avstand.
8. Velkomstskjermen lovet funksjoner som ikke burde kommuniseres før de er fullt implementert.

## Mobbin-prinsipper brukt

- Én beslutning per skjerm, kort begrunnelse og fast primærhandling. Referanse: [Aaptiv](https://mobbin.com/screens/f2e8f996-940a-49ae-84f2-016e9df53105) og [Calm](https://mobbin.com/screens/1c39558d-3f43-42bf-b2f6-3f2c37b495e3).
- Bruk plattformens kjente hjul-/datovelger i stedet for å bygge en stor kalender i onboarding. Referanse: [X](https://mobbin.com/screens/03661855-9bf3-4485-a59d-85766f3fd078) og [Replika](https://mobbin.com/screens/4579209c-bec6-43a6-9ab1-c0f9816f852b).
- Forklar lokasjonsverdien før systemdialogen åpnes, og tilby manuell inngang. Referanse: [The Weather Channel](https://mobbin.com/screens/443e5595-d353-44e4-9fec-72fe96d7185c).

Referansene er mønstre, ikke visuelle fasiter. Babyora beholder Morgennatt-paletten, serif/sans-kontrasten, Granmynte-handlinger og den temperatur-/tekstilorienterte identiteten.

## Ny løsning

- Én lav horisontal progresjonslinje i stedet for vertikale prikker.
- Ingen «Hopp over» på nødvendige profilopplysninger.
- Babyora-babyen beholdes som signatur, men skaleres etter tilgjengelig høyde.
- Første steg spiller den eksisterende korte introanimasjonen én gang. Resten bruker et rolig stillbilde.
- Fødselsdato åpner telefonens native datovelger.
- Hjemsted presenteres som et faktisk produktvalg: posisjon eller manuelt søk.
- Knappen ligger konsekvent nederst og forblir synlig på 320×568, 390×844 og 430×932.
- Gjennomgangssteget komprimeres på lave skjermer slik at viktige data prioriteres foran dekorasjon.
- Velkomststeget lover bare verdier produktet faktisk leverer nå.
- Redusert bevegelse respekteres.

## Higgsfield-vurdering

Det ble ikke generert en ny baby. Den eksisterende Babyora-babyen og animasjonen har riktig lue, tydelig karakter og passer produktets 3D-retning. En ny generering ville ikke løst hovedproblemet, som var struktur, rytme og responsivitet. Higgsfield bør brukes senere til en målrettet forbedring av selve signaturbevegelsen, ikke til fire nye dekorative bilder.

## Verifikasjon

Den automatiske responsivitetssjekken går gjennom alle fem skjermer på:

- 320 × 568
- 390 × 844
- 430 × 932

Den kontrollerer at tittelen og CTA-en er synlige og at skjermen ikke får horisontal overflow.
