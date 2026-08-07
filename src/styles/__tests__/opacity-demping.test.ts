/**
 * OPACITY-FORBUDET PÅ ESPRESSO-SIDEN.
 *
 * ═══ FUNNET ═══════════════════════════════════════════════════════════════
 * Tokenfilen har hatt regelen siden den ble skrevet: «Tekst på petrol dimmes
 * ALDRI med opacity — bruk panel-tekstrampen» (design-tokens-v2.css:30).
 * Espresso-siden hadde ingen tilsvarende regel. Impeccable fant asymmetrien
 * (A1); DoD fase 5 ba om en port.
 *
 * Det var ikke teoretisk. MÅLT 2026-08-05 i Juster: `opacity: 0.55` på hele
 * resultatflaten når svaret var utdatert.
 *
 *              full       ved 0.55
 *   ink-hi     15,0:1  →  5,25:1   (mørk, holdt)
 *   ink-mid    10,1:1  →  3,89:1   ← under 4,5
 *   ink-low     6,5:1  →  2,85:1   ← under
 *   ink-hi     15,0:1  →  3,66:1   ← under (LYS — selv sterkeste tekst)
 *   ink-mid     5,7:1  →  2,31:1   ← under
 *   ink-low     6,6:1  →  2,46:1   ← under
 *
 * Fem av seks nivåer under kravet — og signalet var samtidig helt usynlig for
 * en skjermleser, siden alpha ikke sier noe til noen.
 *
 * ═══ HVA PORTEN MÅLER, OG HVORFOR SKILLET ER HELE POENGET ═════════════════
 * `opacity` er legitim i BEVEGELSE: et element toner inn fra 0 og ender på 1.
 * Feilklassen er en verdi mellom 0 og 1 som blir STÅENDE som en tilstand.
 * `tools/opacity-detektor.mjs` er instrumentet, og det utelater @keyframes,
 * `initial`-verdier og `opacity: 0`/`1`. Porten leser samme regel her, så det
 * finnes ÉN definisjon av hva som telles.
 *
 * ═══ RATSJETTEN ══════════════════════════════════════════════════════════
 * Porten fødes med dagens 22 funn som FROSSET SETT, ikke som et tall. Et rent
 * tall kan gås rundt: fjern én, legg til én, og summen står. Registeret
 * navngir hver enkelt med fil og verdi.
 *
 * Ratsjen går tre veier:
 *   1. NYE funn utenfor registeret → RØDT. Det er selve forbudet.
 *   2. Funn som er RYDDET → RØDT til linjen slettes fra registeret. Ellers
 *      lyver registeret om restgjelden.
 *   3. Registeret kan bare KRYMPE. Heves det for å få porten grønn, er
 *      forbudet borte.
 *
 * IKKE-VAKUØSITET: porten asserterer at detektoren FANT noe. En detektor som
 * stille slutter å se rapporterer «null brudd» og høres ut som en godkjenning.
 */
import { execFileSync } from 'node:child_process';
import { describe, expect, it, vi } from 'vitest';
/* SUBPROSESS-TESTER TRENGER MER ENN FEM SEKUNDER.

   Denne filen starter ekte `git`- og `npm`-prosesser. Vitests standardgrense
   er 5 000 ms, og det holder pa CI (ubuntu-latest) men ikke pa Windows, der
   ett prosess-spawn alene koster sekunder — og verre nar 200 testfiler deler
   maskinen. Malt 2026-08-06: `npm test` ga 35 rode her mens de samme testene
   var gronne isolert og gronne i CI. En port som svinger med maskinlast er
   ingen port; da slutter folk a lese den.

   Grensen er hevet lokalt i stedet for globalt med vilje: de ovrige ~3 000
   testene skal fortsatt ryke pa 5 sekunder, sa en ekte henging blir synlig. */
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });


type Funn = { fil: string; linje: number; verdi: number; tekst: string };

const FUNN: readonly Funn[] = JSON.parse(
  execFileSync('node', ['tools/opacity-detektor.mjs', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }),
) as Funn[];

/**
 * REGISTERET — hver hvilende demping som fantes 2026-08-05, med grunn.
 *
 * Nøkkelen er `fil::verdi`, ikke linjenummer: en port som knytter seg til
 * linjenumre blir rød av at noen legger til en kommentar over, og da blir den
 * slått av. Flere funn med samme verdi i samme fil kollapser til én
 * oppføring — det er tilsiktet: registeret svarer på «har denne filen lov til
 * å dempe med denne verdien», ikke «hvor mange ganger».
 */
const REGISTER: Readonly<Record<string, string>> = {
  /* DEKORASJON — ingen tekst i det hele tatt. */
  'src/components/AtmosphereBackground.tsx::0.55': 'atmosfærepartikler, rent dekorative',
  'src/components/AtmosphereBackground.tsx::0.32': 'atmosfærepartikler, rent dekorative',
  'src/components/PaywallDialog.tsx::0.16': 'dekorativt bakgrunnsskjær, ingen tekst',
  'src/screens/OnboardingScreen.tsx::0.18': 'kantlys på hevet flate — duell §6 (12–20 %)',
  'src/screens/OnboardingScreen.tsx::0.001': 'usynlig treffflate over native input, ikke dempet tekst',

  /* IKONER — piktogrammer, ikke lesetekst. Kontrastkravet for ikoner er 3:1
     (WCAG 1.4.11) og gjelder grafikkens egen form, ikke en tekstrampe. */
  /* Stedsikonet sto her på 0.8. RYDDET 2026-08-06: chevronen var eneste
     tegn på at stedet kan byttes, og revisjonen målte den til 8,5 px —
     dempet på toppen av det. Den står nå på 16 px i --dw-ink-panel-mid,
     uten alpha, inne i en synlig pille. */
  'src/components/hjem/hjem-monter.css::0.75': 'værikon i dempet tilstand',
  'src/screens/OnboardingScreen.tsx::0.7': 'chevron i nedtrekk',
  'src/components/instrument/vertical-gauge.css::0.75': 'målestrek på instrumentet',

  /* TILSTANDER SOM ALLEREDE ER NAVNGITT I MARKUP — dempingen er en
     forsterkning av noe skjermleseren alt får vite (aria-disabled, aria-
     current), ikke det eneste signalet. */
  'src/components/BottomTabBar.css::0.55': 'inaktiv fane — aria-current bærer tilstanden',
  'src/components/BottomTabBar.css::0.32': 'inaktiv fane, ikondel',
  /* NEDBETALT 2026-08-05 (DoD fase 5, punkt 4):
     'src/components/instrument/vertical-gauge.css::0.45'. Deaktivert
     steg-knapp målte 3,81:1 mørk og 2,78:1 lys — begge under kravet.
     Erstattet med --dw-ink-low (5,78 / 7,00). */

  /* ── FUNNET DA INSTRUMENTET BLE SKARPERE, 2026-08-05 ──────────────────
     Detektoren krevde først et TALL rett etter `opacity:` og var derfor
     blind for betingede verdier (`x ? 0.55 : 1`) — nøyaktig formen feilen i
     Juster hadde. Portens egen mutasjonsprøve avslørte det: bruddet ble
     gjeninnført og porten BESTO. Etter rettingen dukket disse opp.
     De er GJELD, ikke frikjennelser. Koden ble ikke verre; blikket ble
     bedre. Derfor heves gulvet 22 → 26 med denne begrunnelsen, og ikke for
     å få porten grønn. */
  'src/components/instrument/TemperatureInstrument.tsx::0.45':
    'GJELD: steg-knapp ved maks/min dempes med alpha (aria-disabled finnes)',
  'src/components/PaywallDialog.tsx::0.92': 'GJELD: knapp dempes mens den venter',
  'src/screens/InnstillingerScreen.tsx::0.55': 'GJELD: deaktivert kontroll dempet med alpha',
  'src/screens/InnstillingerScreen.tsx::0.5': 'GJELD: dempet flate i Innstillinger',
  'src/screens/InnstillingerScreen.tsx::0.85': 'GJELD: av/på-tilstand dempet med alpha',

  /* GJENSTÅENDE GJELD PÅ ESPRESSO-SIDEN. Disse er IKKE frikjent — de er
     målt, navngitt og venter på samme behandling som Juster fikk. */
  'src/components/hjem/hjem-monter.css::0.55': 'GJELD: dempet flate på Hjem',
  'src/components/hjem/hjem-monter.css::0.85': 'GJELD: dempet flate på Hjem',
  'src/components/hjem/hjem-monter.css::0.7': 'GJELD: dempet flate på Hjem',
  'src/components/hjem/hjem-monter.css::0.9': 'GJELD: dempet flate på Hjem',
  'src/components/planning/SnartPlan.css::0.55': 'GJELD: dempet plankort',
  'src/screens/UkeScreen.css::0.9': 'GJELD: dempet flate i Planlegg',
  'src/screens/UkeScreen.css::0.55': 'GJELD: dempet flate i Planlegg',
  'src/screens/TogGuideScreen.tsx::0.6': 'GJELD: dempet tekst i Tog-guiden',
  'src/screens/VarmEllerKaldScreen.tsx::0.85': 'GJELD: dempet flate',
};

const nøkkel = (f: Funn): string => `${f.fil}::${f.verdi}`;
const NØKLER = new Set(FUNN.map(nøkkel));

describe('opacity-forbudet — hvilende demping på espresso-siden', () => {
  it('IKKE-VAKUØSITET: detektoren fant faktisk noe', () => {
    /* Null funn kan bety to ting: at appen er ren, eller at detektoren har
       sluttet å se. De to ser identiske ut i en grønn logg. Så lenge
       registeret har oppføringer, MÅ det finnes funn. */
    expect(
      FUNN.length,
      'opacity-detektoren fant null hvilende dempinger, men registeret lister '
      + `${Object.keys(REGISTER).length}. Enten er all gjeld nedbetalt (da skal `
      + 'registeret tømmes i samme endring), eller så måler detektoren ingenting.',
    ).toBeGreaterThan(0);
    expect(FUNN.every((f) => f.verdi > 0 && f.verdi < 1), 'detektoren slapp inn 0 eller 1').toBe(true);
  });

  it('INGEN NY hvilende demping utenfor registeret', () => {
    const nye = FUNN.filter((f) => REGISTER[nøkkel(f)] === undefined)
      .map((f) => `${f.fil}:${f.linje}  opacity: ${f.verdi}   ${f.tekst}`);
    expect(
      nye,
      'Ny hvilende opacity-demping. Petrol-panelet har hatt forbudet hele '
      + 'tiden; espresso-siden fikk det 2026-08-05 etter at `opacity: 0.55` i '
      + 'Juster tok fem av seks tekstnivåer under 4,5:1 — og var samtidig '
      + 'usynlig for skjermleser.\n\nDemp med FARGE (--dw-ink-demoted eller '
      + 'rampen), og la et ORD bære tilstanden. Er dempingen på ren dekorasjon '
      + 'eller et ikon, før den inn i REGISTER med en grunn.\n\n  '
      + nye.join('\n  '),
    ).toEqual([]);
  });

  it('REGISTERET LYVER IKKE: hver oppføring er fortsatt et ekte funn', () => {
    /* Den viktigste assertionen. En detektor som begynner å se FOR LITE —
       en glob som ryker, en mappe som faller ut av skopet — vil melde null
       brudd og se fantastisk ut. Da ryker denne i stedet. */
    const nedbetalt = Object.keys(REGISTER).filter((k) => !NØKLER.has(k));
    expect(
      nedbetalt,
      'Disse står i registeret, men finnes ikke lenger i koden. Er dempingen '
      + 'ryddet: slett linjen i SAMME endring, så registeret viser den ekte '
      + 'restgjelden. Er den ikke ryddet, ser ikke detektoren den lenger — og '
      + 'det er en alvorligere feil.',
    ).toEqual([]);
  });

  it('gulvet kan bare krympe', () => {
    /* 22 → 26 den 2026-08-05, deretter 26 → 25 samme dag, ÉN gang, og ikke fordi koden ble verre:
       detektoren var blind for betingede verdier og fant fem dempinger til da
       den lærte å lese dem. Det er den eneste lovlige grunnen til å heve et
       gulv — at instrumentet ble skarpere — og den skal stå skrevet, ellers
       er «gulvet kan bare krympe» en regel uten kraft. */
    expect(
      Object.keys(REGISTER).length,
      'registeret er utvidet. Det kan bare KRYMPE — en ny oppføring skal være '
      + 'en dokumentert dekorasjon eller et ikon, aldri dempet tekst.',
    ).toBeLessThanOrEqual(25);
  });

  it('Juster demper IKKE lenger med opacity', () => {
    /* Det opprinnelige funnet, navngitt. Eierrapporterte og DoD-navngitte
       funn kan ALDRI baselines — de må måles hver gang. */
    const juster = FUNN.filter((f) => f.fil.includes('FinnAntrekkScreen'));
    expect(
      juster.map((f) => `${f.fil}:${f.linje} opacity: ${f.verdi}`),
      'Juster demper igjen med opacity. Det var DoD fase 5s første punkt: '
      + 'resultatflaten skal demotes med --dw-ink-demoted og ordet «Utdatert», '
      + 'ikke med alpha.',
    ).toEqual([]);
  });
});
