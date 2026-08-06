/**
 * Oppgavespesifikke nullarmer — Sols fase 10-review (nullmodell-P2):
 * «Nullmodellen inkluderer en meldingsoppgave som ikke er synlig parallelt
 * i de andre retningene. Dersom denne inngår i samme tidsscore, er
 * sammenligningen skjev. Bruk oppgavespesifikke nullarmer: påkledning,
 * validering og handoff må ha hver sin sammenlignbare slutt.»
 *
 * Kontrakten: hver arm består av NØYAKTIG de komponentene spec-en nevner,
 * har sin egen sluttEvent (armens sammenlignbare slutt), og dokumenterer i
 * beslutningstidInkluderer hva som inngår i beslutningstiden — teksten
 * noteres i loggen ved visning (null:vist), slik at analysen aldri kan
 * blande arm-tider ved en feiltagelse.
 */

export type Oppgavetype = 'paakledning' | 'validering' | 'handoff';

export type Nullarm =
  | 'null-paakledning'
  | 'null-validering'
  | 'null-handoff';

export type NullarmSpec = {
  id: Nullarm;
  oppgavetype: Oppgavetype;
  navn: string;
  /** Én setning — deltakerens oppgaveprompt i deltakermodus. */
  oppgavePrompt: string;
  /** Flatene armen består av — og INGENTING mer (kontrollarm-kontrakten). */
  komponenter: readonly string[];
  /** Hva som inngår i beslutningstiden — noteres i loggen ved null:vist. */
  beslutningstidInkluderer: string;
  /** Loggevent som markerer armens sammenlignbare slutt. */
  sluttEvent: string;
};

export const NULLARMER: Record<Nullarm, NullarmSpec> = {
  'null-paakledning': {
    id: 'null-paakledning',
    oppgavetype: 'paakledning',
    navn: 'Nullmodell — påkledning (værapp-rådata + ni-ords-regelen)',
    oppgavePrompt:
      'Bestem hva barnet skal ha på til turen, med værappen og ' +
      'huskeregelen du kan fra før.',
    komponenter: ['raadata', 'regel'],
    beslutningstidInkluderer:
      'Fra rådata og regel vises til «Antrekket er bestemt» trykkes — ' +
      'kun påkledningsbeslutningen, ingen melding.',
    sluttEvent: 'null:antrekk_besluttet',
  },
  'null-validering': {
    id: 'null-validering',
    oppgavetype: 'validering',
    navn: 'Nullmodell — validering (ni-ords-regelen + egen vurdering)',
    oppgavePrompt:
      'Vurder selv, med huskeregelen du kan fra før, om antrekket dere ' +
      'har lagt frem holder for turen.',
    komponenter: ['regel', 'egen-vurdering'],
    beslutningstidInkluderer:
      'Fra regelen vises til «Holder» eller «Holder ikke» trykkes — ' +
      'kun vurderingen, ingen rådata og ingen melding.',
    sluttEvent: 'null:vurdering_avgitt',
  },
  'null-handoff': {
    id: 'null-handoff',
    oppgavetype: 'handoff',
    navn: 'Nullmodell — handoff (vanlig tekstmelding)',
    oppgavePrompt:
      'Skriv meldingen du faktisk ville sendt til den som overtar ' +
      'barnet nå.',
    komponenter: ['meldingsfelt'],
    beslutningstidInkluderer:
      'Fra meldingsfeltet vises til meldingen sendes — kun formuleringen ' +
      'av overleveringen, ingen påkledningsbeslutning.',
    sluttEvent: 'null:melding_sendt',
  },
};

export const ALLE_NULLARMER: readonly Nullarm[] = [
  'null-paakledning',
  'null-validering',
  'null-handoff',
];

export function erNullarm(verdi: unknown): verdi is Nullarm {
  return (
    typeof verdi === 'string' && (ALLE_NULLARMER as string[]).includes(verdi)
  );
}

/**
 * Tolker URL-parameteren «oppgave»: godtar både oppgavetypen
 * («paakledning») og full arm-id («null-paakledning»). Ukjent → null.
 */
export function nullarmFraParam(verdi: string | null): Nullarm | null {
  if (verdi === null) return null;
  if (erNullarm(verdi)) return verdi;
  const somArm = `null-${verdi}`;
  return erNullarm(somArm) ? somArm : null;
}

/**
 * Standard nullarm per scenario når operatøren/URL-en ikke har valgt:
 * ny-omsorgsperson er en overleveringsoppgave (handoff er det man har i
 * dag: en tekstmelding); alle andre scenarier er påkledningsbeslutninger.
 * Valideringsarmen tildeles eksplisitt (URL/operatør) når måloppgaven er
 * en valideringsoppgave (P2-kontrollen).
 */
export function standardNullarm(scenarioId: string): Nullarm {
  return scenarioId === 'ny-omsorgsperson'
    ? 'null-handoff'
    : 'null-paakledning';
}
