/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useMemo, useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { WeatherScene } from '../../components/hjem/WeatherScene.js';
import { recommendCanonical } from '../../lib/clothing-engine-v2/canonical-engine.js';
import type { Activity, RecommendInput } from '../../lib/wool-layers/types.js';

const WEATHER: RecommendInput['weather'] = {
  tempC: 4,
  feelsLikeC: 1,
  windMs: 3,
  precipMmH: 0,
};

afterEach(cleanup);

function CalculationHarness() {
  const [activity, setActivity] = useState<Activity>('utelek');
  const [roomTempC, setRoomTempC] = useState(18);
  const recommendation = useMemo(() => recommendCanonical({
    weather: activity === 'soevn'
      ? { tempC: roomTempC, feelsLikeC: roomTempC, windMs: 0, precipMmH: 0 }
      : WEATHER,
    child: { ageMonths: 8, canRoll: true },
    activity,
    ...(activity === 'vogn' ? { vognMode: 'awake' as const } : {}),
  }), [activity, roomTempC]);

  return (
    <>
      <WeatherScene
        cityLabel="Trondheim"
        nuance="cloudy"
        tempC={4}
        feelsLikeC={1}
        weatherIconSrc={null}
        weatherIconAlt="Skyet"
        freshnessLabel="Oppdatert nå"
        activity={activity}
        onActivityChange={setActivity}
        roomTempC={roomTempC}
        onRoomTempChange={setRoomTempC}
      />
      <output aria-label="Beregnet aktivitet">{recommendation.activity}</output>
    </>
  );
}

describe('HjemScreen — fast activity-to-answer interaction', () => {
  it('offers all four activity contexts as one accessible radio group', () => {
    render(<CalculationHarness />);
    const group = screen.getByRole('radiogroup', { name: 'Aktivitet' });

    expect(within(group).getAllByRole('radio').map((radio) => radio.textContent)).toEqual([
      'Utelek',
      'I vogn',
      'Bæresele',
      'Søvn inne',
    ]);
  });

  it('moves with arrow keys and recalculates the canonical answer for the selected activity', async () => {
    const user = userEvent.setup();
    render(<CalculationHarness />);
    const group = screen.getByRole('radiogroup', { name: 'Aktivitet' });
    const outdoorPlay = within(group).getByRole('radio', { name: 'Utelek' });

    outdoorPlay.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');

    const carrier = within(group).getByRole('radio', { name: 'Bæresele' });
    expect(document.activeElement).toBe(carrier);
    expect(carrier.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('status', { name: 'Beregnet aktivitet' }).textContent).toBe('baeresele');

    await user.keyboard('{End}');
    const indoorSleep = within(group).getByRole('radio', { name: 'Søvn inne' });
    expect(document.activeElement).toBe(indoorSleep);
    expect(indoorSleep.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('status', { name: 'Beregnet aktivitet' }).textContent).toBe('soevn');

    const roomTemperature = screen.getByRole('slider', { name: 'Romtemperatur for søvn' });
    expect(roomTemperature.getAttribute('value')).toBe('18');
    fireEvent.change(roomTemperature, { target: { value: '19' } });
    expect(screen.getByRole('slider', { name: 'Romtemperatur for søvn' }).getAttribute('value')).toBe('19');
  });

  it('keeps every activity control at or above the 44px touch target', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/components/hjem/hjem-monter.css'),
      'utf8',
    );
    const rule = /\.hjm-toggle button\s*\{(?<body>[\s\S]*?)\}/u.exec(css)?.groups?.body ?? '';

    expect(rule).toMatch(/min-height:\s*(?:4[4-9]|[5-9]\d|\d{3,})px/u);
  });
});
