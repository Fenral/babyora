import { describe, expect, it } from 'vitest';
import { assertReadOnlyQuery, buildCapturePlan, seededUrl } from './capture';
/* Produktets EGEN parser, ikke en kopi av den. Det er hele poenget med denne
   filen: den beviser at URL-en revisjonen faktisk åpner, tolket av koden
   appen selv kjører, gir en IKKE-betalende forelder. En test som bare leste
   katalogen ville vært grønn selv om produktet døpte om håndtaket sitt. */
import { resolveDemoEntitlementOverride } from '../../src/state/subscription-store';

const BASE = 'http://localhost:4173';

function planItem(pageId: string) {
  const item = buildCapturePlan().find((entry) => entry.pageId === pageId);
  if (!item) throw new Error(`Katalogen mangler «${pageId}»`);
  return item;
}

/** Entitlement-status slik PRODUKTET leser den ut av fangstens URL. */
function entitlementFor(pageId: string): boolean | null {
  const item = planItem(pageId);
  const url = new URL(seededUrl(BASE, pageId === 'onboarding', item.query));
  return resolveDemoEntitlementOverride(url.search);
}

/* ═══ BETALINGSMUREN HAR EN KOMPLETT VEI ═══════════════════════════════════

   FUNN 2026-08-06: revisjonen fanget 10 av 11 skjermer. Den ellevte,
   betalingsmuren, var uoppnåelig — ikke fordi navigasjonen var feil, men
   fordi `?seed=demo` seeder en mock-ABONNENT. Det finnes ingen mur å vise
   den som allerede betaler.

   Testene under låser de tre leddene som til sammen utgjør veien. Fjernes
   ett av dem, faller nøyaktig den testen som beskriver leddet:
     1. URL-en må gi en ikke-betalende bruker (målt av produktets parser),
     2. seremonien må produsere den første anbefalingen, og
     3. en reload etterpå må åpne en NY økt, som er det som armerer muren.
   ═══════════════════════════════════════════════════════════════════════ */
describe('betalingsmuren er fangbar', () => {
  it('åpnes som en IKKE-betalende forelder — målt av produktets egen parser', () => {
    expect(
      entitlementFor('paywall'),
      'Fangstens URL gir en mock-ABONNENT. En som betaler ser ingen '
      + 'betalingsmur — trykket på Pluss-kortet fører til '
      + 'abonnementsadministrasjon i stedet (InnstillingerScreen.tsx:1561). '
      + 'Katalogens paywall-tilstand må bære query { entitlement: "none" }.',
    ).toBe(false);
  });

  it('lar de ti andre skjermene beholde sin demo-abonnent', () => {
    /* Ikke-vakuøsitet OG avgrensning: overstyringen skal gjelde ÉN skjerm.
       Slår den inn bredt, blir de ti andre fangstene stanset av
       AppPaywallGate og revisjonen mister det den allerede kunne måle. */
    const andre = buildCapturePlan()
      .map((item) => item.pageId)
      .filter((id) => id !== 'paywall' && id !== 'onboarding');
    expect(andre.length).toBeGreaterThanOrEqual(9);
    for (const id of andre) {
      expect(entitlementFor(id), `${id} skal fortsatt kjøre som demo-abonnent`).toBe(true);
    }
  });

  it('produserer først anbefalingen, RELOADER så — det er reloaden som armerer muren', () => {
    /* AppPaywallGate er due først når firstRecommendationSeenAt er satt OG
       «les ferdig»-vinduet er lukket. Vinduet står åpent hele den økten som
       satte tidspunktet (subscription-store.ts:95-97), så muren kan ikke
       nås uten et øktskifte. En reload ER øktskiftet. */
    const handlinger = planItem('paywall').actions;
    const scan = handlinger.findIndex(
      (a) => a.type === 'button' && /Finn dagens antrekk/i.test(a.pattern),
    );
    const reload = handlinger.findIndex((a) => a.type === 'reload');

    expect(scan, 'uten seremonien blir ingen anbefaling sett, og muren armeres aldri')
      .toBeGreaterThanOrEqual(0);
    expect(reload, 'uten en ny økt står «les ferdig»-vinduet åpent og muren viser seg aldri')
      .toBeGreaterThanOrEqual(0);
    expect(reload, 'reloaden må komme ETTER anbefalingen — ellers er det ingenting å armere med')
      .toBeGreaterThan(scan);
    expect(
      handlinger.slice(reload).some((a) => a.type === 'wait' && a.milliseconds >= 1000),
      'etter reload kjører ikke fangstens egen oppstartspause; tilstanden må vente selv',
    ).toBe(true);
  });

  it('beviser at den traff muren og ikke abonnementssiden', () => {
    expect(planItem('paywall').expectedText).toBe('Best verdi');
  });
});

/* ═══ GRENSEN HOLDER SELV OM KATALOGEN VOKSER ═════════════════════════════
   `query` er revisjonens eneste håndtak inn i produktets tilstand. Den skal
   kunne be om MINDRE tilgang, aldri mer — og aldri om noe produktet ikke
   selv har dokumentert. Uten denne listen ville neste tilstand kunne skrive
   inn hva som helst i URL-en og kalle det en fangst.
   ═════════════════════════════════════════════════════════════════════ */
describe('lese-only-grensen gjelder også URL-en', () => {
  it('slipper gjennom produktets dokumenterte håndtak', () => {
    expect(() => assertReadOnlyQuery({ entitlement: 'none' })).not.toThrow();
    expect(() => assertReadOnlyQuery(undefined)).not.toThrow();
  });

  it('avviser en parameter produktet ikke har dokumentert', () => {
    expect(() => assertReadOnlyQuery({ purchase: 'true' })).toThrow(/read-only/i);
  });

  it('avviser at revisjonen gir seg selv Pluss', () => {
    /* Ville gjort revisjonen til en måling av en app ingen forelder har. */
    expect(() => assertReadOnlyQuery({ entitlement: 'active' })).toThrow(/read-only/i);
  });

  it('legger håndtaket faktisk inn i URL-en, ved siden av seed', () => {
    const url = new URL(seededUrl(BASE, false, { entitlement: 'none' }));
    expect(url.searchParams.get('seed')).toBe('demo');
    expect(url.searchParams.get('entitlement')).toBe('none');
  });
});
