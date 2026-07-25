import { useId } from 'react';
import './SegmentedControl.css';

export type SegmentOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  legend: string;
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (next: T) => void;
};

export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
}: Props<T>) {
  const name = useId();
  return (
    <fieldset className="segmented-control">
      <legend className="segmented-control__legend">{legend}</legend>
      <div className="segmented-control__group">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              className={`segmented-control__segment${checked ? ' is-checked' : ''}`}
              key={option.value}
            >
              <input
                className="segmented-control__input"
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
