/**
 * Motor 2.0 Task 15 — materialpreferanse-ark (design-spec §15.1/§15.4).
 *
 * Native <dialog> etter repoets PlaggDetailSheet-mønster. Apply-on-select
 * (lead-krav 5): valget lagres umiddelbart, ingen bekreft-knapp; ESC/
 * backdrop lukker uten videre semantikk. Analytics fires kun ved reell
 * verdiendring, uten gammel/ny verdi (spec §18). IKKE wiret inn i skjermer
 * ennå — konsumeres av R7/Familie-profilen.
 *
 * A11y (lead-krav): initial fokus på VALGT radio (autoFocus), «anbefalt»
 * inngår i tilgjengelig navn via i18n-teksten, native radios i fieldset.
 */

import { useEffect, useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { track } from '../../lib/analytics/track.js';
import type { MaterialPreference } from '../../lib/clothing-engine-v2/types.js';

const PREFERENCES: MaterialPreference[] = ['best_for_conditions', 'prefer_wool', 'avoid_wool'];

type Props = {
  open: boolean;
  value: MaterialPreference;
  onChange: (next: MaterialPreference) => void;
  onClose: () => void;
  /** Fokus-retur-mål (repo-mønster fra PlaggDetailSheet). */
  triggerRef?: { current: HTMLElement | null };
};

const sheet: CSSProperties = {
  border: 0, borderRadius: 20, padding: 24, maxWidth: 420, width: 'calc(100vw - 32px)',
  background: 'var(--surface-elevated)', color: 'var(--ink-900)',
  boxShadow: '0 18px 48px rgba(33,27,50,.28)',
};
const optionRow: CSSProperties = {
  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 8px',
  minHeight: 44, borderRadius: 12, cursor: 'pointer',
};
const radioStyle: CSSProperties = { marginTop: 3, width: 20, height: 20, accentColor: 'var(--accent-cta)', flex: 'none' };

export function MaterialPreferenceSheet({ open, value, onChange, onClose, triggerRef }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const initialValueRef = useRef(value);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      initialValueRef.current = value;
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open, value]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => {
      // Analytics kun ved reell endring — uten gammel/ny verdi (spec §18).
      if (initialValueRef.current !== value) {
        track({ type: 'material_preference_changed' });
      }
      triggerRef?.current?.focus();
      onClose();
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [value, onClose, triggerRef]);

  return (
    <dialog ref={dialogRef} style={sheet} aria-labelledby="material-pref-title" onCancel={() => onClose()}>
      <h2 id="material-pref-title" style={{ margin: '0 0 4px', fontSize: 19 }}>
        {t('engineV2.materialSheet.title')}
      </h2>
      <p style={{ margin: '0 0 14px', color: 'var(--ink-700)', fontSize: 14 }}>
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
              autoFocus={value === pref}
              onChange={() => onChange(pref)}
              style={radioStyle}
            />
            <span>
              <span style={{ display: 'block', fontWeight: 650, fontSize: 15 }}>
                {t(`engineV2.materialSheet.${pref}.label`)}
              </span>
              <span style={{ display: 'block', color: 'var(--ink-700)', fontSize: 13.5 }}>
                {t(`engineV2.materialSheet.${pref}.description`)}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        onClick={() => dialogRef.current?.close()}
        style={{
          marginTop: 16, minHeight: 44, width: '100%', borderRadius: 12, border: 0,
          background: 'var(--accent-cta)', color: 'var(--accent-cta-ink)',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {t('engineV2.materialSheet.done')}
      </button>
    </dialog>
  );
}
