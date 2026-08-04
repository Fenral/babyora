/**
 * VEDTAKSREGISTERET — låsen mot å gå i ring.
 *
 * Eieren 2026-08-03: «Jeg opplever at vi går i ring. Fikser en ting og finner
 * noe annet som var fikset. Vi må finne en løsning slik at vi låser etter hvert
 * og får progresjon.»
 *
 * Diagnosen, med belegg fra samme dag:
 *  - `--dw-plate` ble rettet ÉN gang og kom tilbake gjennom den andre
 *    lys-inngangen.
 *  - Portdom 23 ble vedtatt i proofen og aldri portert; funnet fordi eieren
 *    spurte, ikke fordi noe fanget det.
 *  - Dybdekontrakten hadde null forbrukere.
 *  - Sju porter kunne ikke stryke.
 *
 * Fellesnevneren er ikke slurv. Det er at hver retting ble gjort på ÉTT sted
 * mens regelen bak den bare ble skrevet i prosa. Prosa dekker ikke de andre
 * stedene, og den melder ikke fra når den brytes. Derfor forfaller rettinger.
 *
 * Denne testen gjør «låst» til noe maskinelt:
 *  1. Et vedtak med status «laast» MÅ peke på en sjekk som finnes.
 *  2. Antallet låste vedtak kan bare gå OPP (`laastGulv`) — en ratchet.
 *  3. Hvert vedtak må ha en kilde, så ingen regel er hjemløs.
 *
 * Den avgjør IKKE om innholdet i et vedtak er riktig. Den garanterer bare at
 * et vedtak vi har kalt låst, faktisk har noe som håndhever det.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Vedtak = {
  id: string;
  vedtak: string;
  kilde: string;
  handhevesAv: string | null;
  status: 'laast' | 'uportert-sjekk' | 'brutt';
  merknad?: string;
};

const REGISTER = JSON.parse(
  readFileSync(join(process.cwd(), 'docs/design-notes/vedtak.json'), 'utf8'),
) as { laastGulv: number; vedtak: Vedtak[] };

const GYLDIG_STATUS = new Set(['laast', 'uportert-sjekk', 'brutt']);

describe('vedtaksregisteret', () => {
  it('inneholder vedtak i det hele tatt', () => {
    // FORUTSETNING: uten denne kan alt under bestå på en tom liste.
    expect(REGISTER.vedtak.length, 'registeret er tomt').toBeGreaterThan(5);
    expect(typeof REGISTER.laastGulv, 'laastGulv mangler').toBe('number');
  });

  it('har fullstendige felter og gyldig status på hvert vedtak', () => {
    for (const v of REGISTER.vedtak) {
      expect(v.id, `vedtak uten id: ${JSON.stringify(v)}`).toBeTruthy();
      expect(v.vedtak?.length, `[${v.id}] mangler selve vedtaket`).toBeGreaterThan(20);
      expect(v.kilde?.length, `[${v.id}] mangler kilde — et vedtak uten opphav kan ingen etterprøve`)
        .toBeGreaterThan(5);
      expect(GYLDIG_STATUS.has(v.status), `[${v.id}] ugyldig status «${v.status}»`).toBe(true);
    }
  });

  it('har unike id-er', () => {
    const ider = REGISTER.vedtak.map((v) => v.id);
    expect(ider.length, `duplikate id-er: ${ider.filter((x, i) => ider.indexOf(x) !== i).join(', ')}`)
      .toBe(new Set(ider).size);
  });

  it('LÅST betyr at sjekken faktisk finnes', () => {
    const laaste = REGISTER.vedtak.filter((v) => v.status === 'laast');
    const uten: string[] = [];
    for (const v of laaste) {
      if (!v.handhevesAv) { uten.push(`${v.id} (ingen sjekk oppgitt)`); continue; }
      if (!existsSync(join(process.cwd(), v.handhevesAv))) uten.push(`${v.id} → ${v.handhevesAv} finnes ikke`);
    }
    expect(uten, `vedtak merket «laast» uten en sjekk som finnes:\n  ${uten.join('\n  ')}`).toEqual([]);
  });

  it('ratchet: antall låste vedtak kan bare gå opp', () => {
    const antall = REGISTER.vedtak.filter((v) => v.status === 'laast').length;
    expect(
      antall,
      `laastGulv er ${REGISTER.laastGulv}, men bare ${antall} vedtak er låst. ` +
      'Enten er en lås fjernet uten at gulvet ble senket bevisst, eller gulvet er satt for høyt. ' +
      'Låser du et nytt vedtak: hev laastGulv i samme commit.',
    ).toBeGreaterThanOrEqual(REGISTER.laastGulv);
  });

  it('rapporterer hva som gjenstår (informativ — feiler aldri)', () => {
    const apne = REGISTER.vedtak.filter((v) => v.status !== 'laast');
    const brutt = apne.filter((v) => v.status === 'brutt');
    console.log(
      `\n  vedtaksregister: ${REGISTER.vedtak.length - apne.length} låst · ${apne.length} åpne` +
      (brutt.length ? ` · ${brutt.length} BRUTT: ${brutt.map((v) => v.id).join(', ')}` : '') +
      `\n  åpne: ${apne.map((v) => v.id).join(', ')}\n`,
    );
    expect(apne.length).toBeGreaterThanOrEqual(0);
  });
});
