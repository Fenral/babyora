/**
 * KlePaaOverlay — SØMMEN mellom CTA-en og sekvensen.
 *
 * ═══ HVORFOR DENNE FILEN FINNES ═══════════════════════════════════════════
 * MÅLT 2026-08-05: `KlePaaStepper` var bygget, portet og grønn — og nådd fra
 * ingen steder. Et grep etter komponentnavnet utenfor dens egen mappe ga null
 * treff. Knappen «Kle på, steg for steg» gikk fortsatt til Påkledning, som
 * viser hele antrekket som en liste.
 *
 * Det er verdt å si rett ut, for det er en egen feilklasse: EN KOMPONENT SOM
 * IKKE ER NÅDD HAR IKKE RETTET NOE. Porten målte stepperen isolert og var
 * ærlig grønn; den sa ingenting om hvorvidt CTA-en kom fram. Derfor bærer
 * denne filen sin egen port (`klepaa-sommen.test.tsx`) som måler nettopp
 * VEIEN — ikke destinasjonen.
 *
 * ═══ HVA OVERLAYET EIER, OG HVA DET LÅNER ════════════════════════════════
 * Eier: den modale skallet (`<dialog>.showModal()` — fokusfelle, ESC,
 * backdrop, husets mønster fra Sheet.tsx) og avledningen bundel → steg.
 *
 * LÅNER, uendret: hele byttemaskineriet. `useOutfitSelectionStore` +
 * `OutfitComparisonDialog` er allerede i drift og allerede testet i
 * OutfitExperience. Å skrive et nytt bytte her ville laget en ANDRE vei
 * gjennom sikkerhetsfinaliseringen — og to veier som skal gjøre det samme
 * drifter fra hverandre. Autorisasjonsgaten (`session.base === snapshot &&
 * session.options === options`) er kopiert ordrett av samme grunn: den er
 * det som gjør at et alternativ ikke kan velges mot et annet antrekk enn
 * det som faktisk står på skjermen.
 *
 * ═══ ET BEVISST TAP, SAGT HØYT ════════════════════════════════════════════
 * Delt-element-landingen fra Hjem (`registerOutfitRow`) landet på
 * Påkledningens RADER. Sekvensen har ingen radliste å lande på, så
 * overgangskontrakten faller tilbake til `staticOnly('missing-target-row')`
 * — dens egen dokumenterte reserve, ikke en krasj. Det er en reell
 * nedgradering på denne ene veien, og alternativet var å beholde listen,
 * altså å beholde defekten. Eier bør vite om byttet.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { OutfitAlternativeOptionV1 } from '../../lib/outfit/alternative-options.js';
import type { OutfitItemId } from '../../lib/outfit/outfit-truth.js';
import { useOutfitSelectionStore } from '../../state/outfit-selection-store.js';
import {
  OutfitComparisonDialog,
  createComparisonFocusLifecycle,
} from '../outfit/OutfitExperience.js';
import { KlePaaStepper, deriveKlePaaSteps, type KlePaaStep } from './KlePaaStepper.js';

import './kle-paa-overlay.css';

const INGEN_ALTERNATIVER = Object.freeze([]) as readonly OutfitAlternativeOptionV1[];

export type KlePaaOverlayProps = Readonly<{
  /** Kun den støttede bundelen har `base` + `options`. Kallstedet siler. */
  bundle: Readonly<{
    base: Parameters<typeof deriveKlePaaSteps>[0]['base'];
    options: readonly OutfitAlternativeOptionV1[];
  }>;
  onClose: () => void;
}>;

export function KlePaaOverlay({ bundle, onClose }: KlePaaOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [compareId, setCompareId] = useState<OutfitItemId | null>(null);
  const [sammenligningsfokus] = useState(createComparisonFocusLifecycle);

  const snapshot = bundle.base;
  const options = bundle.options;

  const session = useOutfitSelectionStore((s) => s.session);
  const open = useOutfitSelectionStore((s) => s.open);
  const select = useOutfitSelectionStore((s) => s.select);
  const close = useOutfitSelectionStore((s) => s.close);

  /* Samme livssyklus som OutfitExperience: lukk en eventuell gammel økt før en
     ny åpnes, og lukk igjen ved avmontering. Uten `close()` FØRST kan en økt
     mot et annet antrekk bli stående og autorisere feil alternativer. */
  useEffect(() => {
    close();
    open(snapshot, options);
    return close;
  }, [snapshot, options, open, close]);

  useEffect(() => () => sammenligningsfokus.clear(), [sammenligningsfokus]);

  /* `showModal()` ALLTID, aldri `open`-attributtet: bare den modale formen
     gir fokusfelle og inert bakgrunn. Samme vedtak som Sheet.tsx. */
  useEffect(() => {
    const d = dialogRef.current;
    if (d === null || d.open) return undefined;
    d.showModal();
    return () => {
      if (d.open) d.close();
    };
  }, []);

  const autorisert =
    session.kind === 'open' && session.base === snapshot && session.options === options;
  const gjeldende = autorisert ? session.current : snapshot;
  const autoriserteValg = autorisert ? session.options : INGEN_ALTERNATIVER;

  /* Stegene avledes av den GJELDENDE snapshoten, ikke av bundelen: velger
     brukeren et alternativ, skal sekvensen vise det nye plagget umiddelbart. */
  const steps = useMemo<readonly KlePaaStep[]>(
    () => deriveKlePaaSteps({ base: gjeldende, options: autoriserteValg }),
    [gjeldende, autoriserteValg],
  );

  const option = useMemo(
    () => autoriserteValg.find((k) => k.sourceItemId === compareId) ?? null,
    [autoriserteValg, compareId],
  );

  const lukkSammenligning = useCallback(
    (returnerFokus: boolean) => {
      if (sammenligningsfokus.close({ restoreFocus: returnerFokus })) setCompareId(null);
    },
    [sammenligningsfokus],
  );

  useEffect(() => {
    if (option !== null) headingRef.current?.focus();
  }, [option]);

  /* ESC HAR TO BETYDNINGER, og rekkefølgen er hele poenget: står
     sammenligningen åpen, gjelder ESC DEN. Uten `preventDefault` ville
     nettleseren lukket det modale skallet, og brukeren mistet både
     sammenligningen og hele sekvensen på ett tastetrykk. */
  const onCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>) => {
      if (option === null) return;
      event.preventDefault();
      lukkSammenligning(true);
    },
    [option, lukkSammenligning],
  );

  return (
    <dialog
      ref={dialogRef}
      className="kle-paa-overlay"
      aria-label="Kle på, steg for steg"
      onCancel={onCancel}
      onClose={onClose}
    >
      <KlePaaStepper
        steps={steps}
        onClose={() => dialogRef.current?.close()}
        onFinish={() => dialogRef.current?.close()}
        onSwap={(steg, trigger) => {
          sammenligningsfokus.open(trigger);
          setCompareId(steg.itemId as OutfitItemId);
        }}
      />
      {option !== null && (
        <OutfitComparisonDialog
          option={option}
          sourceLabel={gjeldende.garments.find((g) => g.itemId === option.sourceItemId)?.label ?? ''}
          headingRef={headingRef}
          onConfirm={() => {
            if (select(option).ok) lukkSammenligning(false);
          }}
          onCancel={() => lukkSammenligning(true)}
        />
      )}
    </dialog>
  );
}
