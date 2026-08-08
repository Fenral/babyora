import { useTranslation } from 'react-i18next';
import {
  SELECTABLE_MATERIAL_PREFERENCES,
  onboardingCopyFor,
  type SelectableMaterialPreference,
} from './onboarding-copy.js';

type Props = Readonly<{
  value: SelectableMaterialPreference;
  onChange: (next: SelectableMaterialPreference) => void;
}>;

export function OnboardingMaterialPreference({
  value,
  onChange,
}: Props) {
  const { i18n } = useTranslation();
  const copy = onboardingCopyFor(i18n.resolvedLanguage ?? i18n.language).material;

  return (
    <fieldset className="ob-material-options">
      <legend className="ob-sr-only">{copy.legend}</legend>
      {SELECTABLE_MATERIAL_PREFERENCES.map((preference) => {
        const option = copy.options[preference];
        const selected = value === preference;
        return (
          <label
            className={`ob-material-option${selected ? ' selected' : ''}`}
            key={preference}
          >
            <input
              type="radio"
              name="material-preference"
              value={preference}
              checked={selected}
              onChange={() => onChange(preference)}
            />
            <span className="ob-material-marker" aria-hidden="true" />
            <span className="ob-material-option-copy">
              <span className="ob-material-option-heading">
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </span>
              <span className="ob-material-balance">
                <span><strong>{copy.advantageLabel}</strong>{option.advantage}</span>
                <span><strong>{copy.tradeoffLabel}</strong>{option.tradeoff}</span>
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
