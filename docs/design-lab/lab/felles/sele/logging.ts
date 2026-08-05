/**
 * Hendelseslogg for testselen (spec v2 §1 pkt. 4: «Testsele eier
 * eksperimentet: … logging»).
 *
 * Innslag: { tidISO, prototype, scenario, event, detalj } — tidISO hentes
 * ALLTID fra den virtuelle klokka (aldri Date.now()), slik at loggen er
 * reproduserbar per scenario + spoling.
 *
 * Retningene har ulike logg-signaturer (P1 sender objekt-events med `type`,
 * P2/P3 sender streng + detaljer); loggerFor() normaliserer begge til det
 * felles innslaget uten at retningene må endres.
 */

export type LoggInnslag = {
  tidISO: string;
  prototype: string;
  scenario: string;
  event: string;
  detalj?: unknown;
};

export type NormalisertEvent = { event: string; detalj?: unknown };

/** Normaliserer en vilkårlig logg-signatur til {event, detalj}. */
export function normaliserEvent(args: unknown[]): NormalisertEvent {
  const [forste, andre] = args;
  if (typeof forste === 'string') {
    return andre === undefined
      ? { event: forste }
      : { event: forste, detalj: andre };
  }
  if (
    forste !== null &&
    typeof forste === 'object' &&
    typeof (forste as { type?: unknown }).type === 'string'
  ) {
    const { type, ...rest } = forste as { type: string } & Record<
      string,
      unknown
    >;
    return Object.keys(rest).length > 0
      ? { event: type, detalj: rest }
      : { event: type };
  }
  return { event: 'ukjent_event', detalj: forste };
}

export type Logg = {
  innslag(): LoggInnslag[];
  /**
   * Logger bundet til (prototype, scenario, klokke) — sendes som
   * props.logg til retningene. Tåler både objekt- og streng-signatur.
   */
  loggerFor(
    prototype: string,
    scenario: string,
    klokke: { naaISO(): string },
  ): (...args: unknown[]) => void;
  /** Hele loggen som JSON (eksportformatet). */
  tilJSON(): string;
  toem(): void;
  abonner(cb: () => void): () => void;
};

export function lagLogg(): Logg {
  const alle: LoggInnslag[] = [];
  const lyttere = new Set<() => void>();

  function varsle(): void {
    for (const cb of [...lyttere]) cb();
  }

  return {
    innslag() {
      return [...alle];
    },
    loggerFor(prototype, scenario, klokke) {
      return (...args: unknown[]) => {
        const { event, detalj } = normaliserEvent(args);
        alle.push({
          tidISO: klokke.naaISO(),
          prototype,
          scenario,
          event,
          ...(detalj === undefined ? {} : { detalj }),
        });
        varsle();
      };
    },
    tilJSON() {
      return JSON.stringify(alle, null, 2);
    },
    toem() {
      alle.length = 0;
      varsle();
    },
    abonner(cb) {
      lyttere.add(cb);
      return () => {
        lyttere.delete(cb);
      };
    },
  };
}
