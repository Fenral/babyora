/**
 * ResultSurface — den nummererte plagglisten på én hevet resultatflate
 * (docs/mocks/monter/hjem-result.html `.rows` + `.actions`).
 *
 * Rekkefølgen (innerst→ytterst) og radene selv kommer fra
 * `result-rows.ts` sin `deriveResultRows` (flatmapper HELE
 * `resolvedRecommendation.layers` — scene.ts sin `deriveSceneModelFromLegacy`
 * gir kun de 3–5 ytterste SYNLIGE ankrene og brukes derfor ikke her, se
 * result-rows.ts sin filhode-kommentar). scene.ts er ikke endret.
 *
 * A11y (oppgavens krav): ekte `<ol>` med `<li>` per plagg → skjermlesere
 * annonserer «rad N av M» uavhengig av den dekorative `.hjm-num`-sirkelen.
 * `.is-fresh`-koreografien (radene glir inn) gates STRENGT av `isFresh`
 * (kun ved fersk beregning i dag — cachede åpninger rendrer rette frem,
 * jf. DESIGN.md «later openings use cached result immediately») OG av
 * `reducedMotion` (ingen animasjon uansett når redusert bevegelse er på).
 */
import type { MouseEvent } from 'react';
import './hjem-monter.css';
import type { ResultRow } from './result-rows.js';
import { MonterGarmentRow } from './MonterGarmentRow.js';
import { getGarmentImage } from '../../lib/monter-assets.js';

const ROW_STAGGER_MS = 80;
const ROW_STAGGER_START_MS = 50;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export type ResultSurfaceProps = Readonly<{
  rows: readonly ResultRow[];
  childLabel: string;
  isFresh: boolean;
  reducedMotion: boolean;
  /**
   * P6: receives the row's own click event too (not just the row data) so
   * the caller can capture `event.currentTarget` as the focus-return target
   * for whatever it opens (PlaggDetailSheet, same pattern PaakledningScreen/
   * MinGarderobeScreen already use).
   */
  onSwapRow: (row: ResultRow, event: MouseEvent<HTMLButtonElement>) => void;
  onStartDressing: (event: MouseEvent<HTMLButtonElement>) => void;
  startDressingDisabled: boolean;
  onWhy: () => void;
}>;

export function ResultSurface({
  rows,
  childLabel,
  isFresh,
  reducedMotion,
  onSwapRow,
  onStartDressing,
  startDressingDisabled,
  onWhy,
}: ResultSurfaceProps) {
  const animateRows = isFresh && !reducedMotion;

  return (
    <div className="hjm-result" data-scrollable="true">
      <h1>Dagens antrekk</h1>
      <p className="hjm-sub">{childLabel}</p>
      <ol className="hjm-rows" data-fresh={animateRows ? 'true' : 'false'}>
        {rows.map((row, index) => (
          <MonterGarmentRow
            key={row.key}
            position={row.position}
            label={row.displayLabel}
            roleLabel={row.roleLabel}
            imageSrc={getGarmentImage(row.garmentId)}
            onSwap={(event) => onSwapRow(row, event)}
            animationDelayMs={animateRows ? ROW_STAGGER_START_MS + index * ROW_STAGGER_MS : null}
          />
        ))}
      </ol>

      <div className="hjm-actions">
        <button type="button" className="hjm-cta" onClick={onStartDressing} disabled={startDressingDisabled}>
          Kle på, steg for steg
          <ArrowIcon />
        </button>
        <button type="button" className="hjm-why" onClick={onWhy}>
          Hvorfor akkurat dette?
        </button>
      </div>
    </div>
  );
}
