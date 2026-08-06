/**
 * Deltakermodus — Sols fase 10-review (FELLES-P0): «I alle tolv bilder
 * ligger scenario, P1–P4/NULL, laboratorieklokke, spolekontroller,
 * Williams-knapp og hendelseslogg i deltakerens flate. […] bygg en låst
 * ‘deltakermodus’ der operatørkontroller og logg finnes i separat
 * panel/vindu. Første viewport skal vise oppgaveprompt og retningens
 * kjerne.»
 *
 * URL-kontrakten (skjermbevis-skriptet er avhengig av den):
 *   ?modus=deltaker&arm=p1&scenario=bilstol
 * Valgfritt i tillegg:
 *   &oppgave=paakledning|validering|handoff  (kun for arm=null)
 *   &bekreftet=1  (forhåndsbekreftet disclaimer — KUN for skjermbevis;
 *                  logges som sele:disclaimer_forhandsbekreftet)
 *
 * Låst modus krever en definert arm: modus=deltaker uten gyldig arm
 * degraderes til operatørmodus (en deltaker skal aldri stå i en flate
 * uten tildelt oppgave).
 */

import { ARMER, type Arm } from './rekkefolge';
import { nullarmFraParam, type Nullarm } from './nullarmer';
import type { LoggInnslag } from './logging';

export type LabModus = 'operator' | 'deltaker';

/**
 * window.__lab — operatør-/automatiseringskontrakt UTENFOR deltakerens
 * DOM (Sols fase 11 runde 2, P1): P3/P4 har ingen egne tidskontroller
 * eller synlig hendelseslogg. Skjermbevis-skriptet (og operatøren via
 * konsollen) spoler den virtuelle klokka og leser selens logg her —
 * ingenting av det rendres i deltakerflaten. Monteres av LabShell.
 */
export type LabVinduAPI = {
  /** Spol den virtuelle klokka `min` minutter frem (logges som sele:spol). */
  spol(min: number): void;
  /** Labklokkas nå-tidspunkt (labISO). */
  naaISO(): string;
  /** Selens hendelseslogg — samme innslag som Operatør-panelet viser. */
  hendelser(): LoggInnslag[];
};

export type LabParametre = {
  modus: LabModus;
  /** Gyldig arm fra URL-en, ellers null. */
  arm: Arm | null;
  /** Rå scenario-id fra URL-en — valideres mot scenarioForId i skallet. */
  scenarioId: string | null;
  /** Tildelt nullarm (kun meningsbærende for arm=null). */
  nullarm: Nullarm | null;
  /** Disclaimer forhåndsbekreftet via &bekreftet=1 (skjermbevis). */
  forhandsbekreftet: boolean;
};

export function lesLabParametre(search: string): LabParametre {
  const p = new URLSearchParams(search);
  const armRaa = p.get('arm');
  const arm = (ARMER as readonly string[]).includes(armRaa ?? '')
    ? (armRaa as Arm)
    : null;
  const modus: LabModus =
    p.get('modus') === 'deltaker' && arm !== null ? 'deltaker' : 'operator';
  return {
    modus,
    arm,
    scenarioId: p.get('scenario'),
    nullarm: nullarmFraParam(p.get('oppgave')),
    forhandsbekreftet: p.get('bekreftet') === '1',
  };
}

/**
 * Reduserer en oppgavetekst til ÉN setning: kutter ved første
 * setningsslutt, stryker en avsluttende parentes (metodenotat som
 * «(teach-back)») og normaliserer til punktum.
 */
export function forsteSetning(tekst: string): string {
  const trimmet = tekst.trim();
  const treff = trimmet.match(/^[^.!?]*[.!?]/);
  let setning = treff ? treff[0] : trimmet;
  setning = setning.replace(/[.!?]\s*$/, '');
  setning = setning.replace(/\s*\([^()]*\)\s*$/, '');
  return `${setning.trim()}.`;
}

/**
 * Oppgaveprompten i deltakermodus: én setning fra manifestets aktive
 * oppgave. Manifestene har to former:
 *  - P1/P3/P4: oppgaver er string[] → første oppgave, redusert til én
 *    setning.
 *  - P2: oppgaver er objekter med navn/scorbar → den aktive (scorbare)
 *    oppgavens navn, uten det avsluttende metodenotatet i parentes.
 * Ukjent form → null (skallet viser da kjerneflaten uten prompt).
 */
export function oppgavePromptFraManifest(manifest: unknown): string | null {
  const oppgaver = (manifest as { oppgaver?: unknown } | null | undefined)
    ?.oppgaver;
  if (!Array.isArray(oppgaver) || oppgaver.length === 0) return null;

  const forste: unknown = oppgaver[0];
  if (typeof forste === 'string') return forsteSetning(forste);

  const kandidater = oppgaver.filter(
    (o): o is { navn: string; scorbar?: unknown } =>
      typeof (o as { navn?: unknown } | null)?.navn === 'string',
  );
  const aktiv = kandidater.find((o) => o.scorbar === true) ?? kandidater[0];
  if (!aktiv) return null;
  return aktiv.navn.replace(/\s*\([^()]*\)\s*$/, '').trim();
}
