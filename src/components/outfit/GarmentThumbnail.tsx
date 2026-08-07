import type { CSSProperties } from 'react';
import {
  GENERIC_GARMENT_SVG,
  garmentIdFor,
  garmentPngSafe,
} from '../../data/garment-illustrations.js';

type Props = Readonly<{
  label: string;
  className?: string;
  style?: CSSProperties;
}>;

/**
 * Ett bestemt plaggbilde for både antrekkskartet og den ordnede listen.
 *
 * ETT MATERIALE, IKKE TO (eierbeslutning 2026-08-07). Her sto
 * `garmentClayPng` som primærkilde, mens Plaggbiblioteket, plaggdetaljarket
 * og Plan tegnet det FLATE settet. Samme plagg så altså ulikt ut avhengig
 * av hvilken skjerm forelderen sto på — vinterdressen var marineblå i
 * biblioteket og grønn i antrekket.
 *
 * Art bible (2026-08-02, «Materialer») avgjør hvilket som er riktig:
 * «Ullplagg: ekte strikkefiber-detalj (masker, fibre), ALDRI plastisk.»
 * Clay-settet er nettopp plastisk. DESIGN.md sier i tillegg at maskot,
 * plagg og værscener skal holdes i ÉN materialfamilie. Clay-settet kom inn
 * i F80a, altså før art bible ble skrevet; koden fulgte bare aldri etter.
 *
 * Den egentlige grunnen er likevel produktmessig: plaggbildets jobb er
 * GJENKJENNELSE. Forelderen skal se på det og finne genseren i skuffen.
 *
 * SVG-en er fortsatt siste utvei for plagg uten eget bilde.
 */
export function GarmentThumbnail({ label, className, style }: Props) {
  const garmentId = garmentIdFor(label);
  const source = garmentPngSafe(garmentId);

  return (
    <img
      className={className}
      style={style}
      src={source}
      alt=""
      aria-hidden="true"
      onError={(event) => {
        // Ett trinn igjen: uten clay-mellomleddet går et manglende plagg
        // rett til SVG-en. `dataset` hindrer at en feilende SVG looper.
        if (event.currentTarget.dataset.fallbackStage === undefined) {
          event.currentTarget.dataset.fallbackStage = 'generic';
          event.currentTarget.src = GENERIC_GARMENT_SVG;
        }
      }}
    />
  );
}
