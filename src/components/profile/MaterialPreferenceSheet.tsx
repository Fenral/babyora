/**
 * Motor 2.0 Task 15 — materialpreferanse-ark (design-spec §15.1/§15.4).
 *
 * Bygget på Sheet-primitiven (2026-08-04). Hadde for det: ingen bakdropp-
 * lukking, ingen maksimal høyde, ingen rulleområde, ingen safe-area, ingen
 * ::backdrop og ingen animasjon — seks av hullene primitiven lukker.
 * Opprinnelig: native <dialog> etter repoets PlaggDetailSheet-mønster. Apply-on-select
 * (lead-krav 5): valget lagres umiddelbart, ingen bekreft-knapp; ESC/
 * backdrop lukker uten videre semantikk. Analytics fires kun ved reell
 * verdiendring, uten gammel/ny verdi (spec §18). IKKE wiret inn i skjermer
 * ennå — konsumeres av R7/Familie-profilen.
 *
 * A11y (lead-krav): initial fokus på VALGT radio (autoFocus), «anbefalt»
 * inngår i tilgjengelig navn via i18n-teksten, native radios i fieldset.
 */

import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { track } from '../../lib/analytics/track.js';
import type { MaterialPreference } from '../../lib/clothing-engine-v2/types.js';
import { Button } from '../controls/Button';
import { Sheet } from '../controls/Sheet';

const PREFERENCES: MaterialPreference[] = ['best_for_conditions', 'prefer_wool', 'avoid_wool'];

type Props = {
  open: boolean;
  value: MaterialPreference;
  onChange: (next: MaterialPreference) => void;
  onClose: () => void;
  /** Fokus-retur-mål (repo-mønster fra PlaggDetailSheet). */
  triggerRef?: { current: HTMLElement | null };
};

const optionRow: CSSProperties = {
  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 8px',
  minHeight: 44, borderRadius: 12, cursor: 'pointer',
};
const radioStyle: CSSProperties = { marginTop: 3, width: 20, height: 20, accentColor: 'var(--accent-cta)', flex: 'none' };

export function MaterialPreferenceSheet({ open, value, onChange, onClose, triggerRef }: Props) {
  const { t } = useTranslation();
  const initialValueRef = useRef(value);
  const sporetRef = useRef(false);

  useEffect(() => {
    if (open) {
      initialValueRef.current = value;
      sporetRef.current = false;
    }
    // value med vilje utelatt: verdien skal fryses ved AAPNING, ikke folge endringer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Analytics kun ved reell endring, uten gammel/ny verdi (spec §18).
     sporetRef gjor kallet idempotent: bade «Ferdig»-knappen og arkets egen
     close-hendelse kaller lukk(), og uten vakten ville en enkelt lukking
     rapportert to ganger. */
  const lukk = useCallback(() => {
    if (!sporetRef.current && initialValueRef.current !== value) {
      sporetRef.current = true;
      track({ type: 'material_preference_changed' });
    }
    onClose();
  }, [value, onClose]);

  return (
    <Sheet
      open={open}
      onClose={lukk}
      triggerRef={triggerRef}
      title={t('engineV2.materialSheet.title')}
      closeLabel={t('common.close', { defaultValue: 'Lukk' })}
      footer={<Button full onClick={lukk}>{t('engineV2.materialSheet.done')}</Button>}
    >
      <p style={{ margin: '0 0 14px', color: 'var(--dw-ink-mid)', fontSize: 14 }}>
        {t('engineV2.materialSheet.intro')}
      </p>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {t('engineV2.materialSheet.title')}
        </legend>
        {PREFERENCES.map((pref) => (
          <label key={pref} style={optionRow}>
            <input
              type="radio"
              name="material-preference"
              value={pref}
              checked={value === pref}
              /* Vinner over primitivens lukkeknapp fordi showModal() velger
                 elementet med autofocus foran det forste fokuserbare. */
              autoFocus={value === pref}
              onChange={() => onChange(pref)}
              style={radioStyle}
            />
            <span>
              <span style={{ display: 'block', fontWeight: 650, fontSize: 15 }}>
                {t(`engineV2.materialSheet.${pref}.label`)}
              </span>
              <span style={{ display: 'block', color: 'var(--dw-ink-mid)', fontSize: 13.5 }}>
                {t(`engineV2.materialSheet.${pref}.description`)}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
    </Sheet>
  );
}
