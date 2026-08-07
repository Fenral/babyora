# Onboarding imagery bake-off

Isolert, statisk testflate for fase 3. Den importeres ikke av appen og endrer ingen produksjonskontrakter.

## Åpne

Start den read-only statiske testserveren fra reporoten:

```powershell
node tools/onboarding-imagery/serve-bakeoff.mjs 4174
```

Åpne deretter:

```text
http://127.0.0.1:4174/docs/mocks/onboarding-imagery-bakeoff/
```

Deltakerflate uten lab-kontroller:

```text
?arm=k3&frame=1&theme=dark&state=normal&text=normal&motion=full&mode=participant
```

## Kandidater

- K0: dagens kontroll, med maskot og direkte navnespørsmål.
- K1: autentisk foto som situasjonsgjenkjenning, ikke som antrekksfasit.
- K2: CSS-motion som testbar proxy for et mulig Higgsfield-storyboard. Ingen Higgsfield-generering er utført.
- K3: native, statisk minidemonstrasjon av input → ordnet lagliste.

## Tilstander

Lab-panelet kan kombinere lys/mørk, standard/stor tekst, full/Reduce Motion og normal/offline/treg/error. `resume=warm` uten eksplisitt `frame` gjenoppretter sist viste ramme fra `sessionStorage`.

K0 beholder den observerte navnekonflikten: feltet sier valgfritt, men kontrollskjermen stopper uten navn. Utfordrerne gjør navnet reelt valgfritt. Dette merkes som kontrollfeil og skal ikke feilaktig tilskrives mediet.

## Fotostimulus

K1 bruker [«Mother Dressing Her Baby» av Anna Shvets](https://www.pexels.com/photo/mother-dressing-her-baby-11369315/) fra Pexels, oppgitt som «Free to use» ved innhenting 2026-08-07. Filen er bare en teststimulus. Rettighet, samtykke, representasjon og produksjonsegnethet er ikke godkjent.

## Ikke produksjon

Mocken har ingen kobling til anbefalingsmotor, `finalizeSafety`, betaling, brukerdata, analytics eller native byggeflyt. Tall og råd i overflaten er en fast testfixture, ikke motorutdata.
