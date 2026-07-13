/**
 * P2.2-blocker bevis (Fable 5 R3 2026-06-12):
 *
 * «Hvorfor i dette antrekket?»-teksten skal interpolere faktiske
 * verdier — samme plagg ved to ulike temperaturer/aktiviteter skal
 * gi ULIK tekst. Dette er kontrakt-bevis for at koden ikke fallback-er
 * til en hardkodet streng.
 */

import { describe, expect, it } from 'vitest';
import { whyForGarment, type WhyContext } from './garment-info';

function ctx(over: Partial<WhyContext>): WhyContext {
  return {
    childName: 'Lillian',
    activity: 'vogn',
    tempC: 10,
    feelsLikeC: 10,
    windMs: 0,
    precipMmH: 0,
    ...over,
  };
}

describe('whyForGarment — dynamisk interpolering', () => {
  it('sovepose: feels-temp 18 vs 22 → ulik tekst (TOG-tilpasning)', () => {
    const cold = whyForGarment('sovepose-2-5-tog', ctx({ activity: 'soevn', tempC: 18, feelsLikeC: 18 }));
    const warm = whyForGarment('sovepose-2-5-tog', ctx({ activity: 'soevn', tempC: 22, feelsLikeC: 22 }));
    expect(cold).not.toBe(warm);
    expect(cold).toContain('18');
    expect(warm).toContain('22');
  });

  it('childName interpoleres', () => {
    const lillian = whyForGarment('sovepose-2-5-tog', ctx({ activity: 'soevn', childName: 'Lillian' }));
    const olav = whyForGarment('sovepose-2-5-tog', ctx({ activity: 'soevn', childName: 'Olav' }));
    expect(lillian).toContain('Lillian');
    expect(olav).toContain('Olav');
    expect(lillian).not.toBe(olav);
  });

  it('pyjamas i søvn: feels-temp 18 vs 25 → ulik tekst', () => {
    const cold = whyForGarment('pyjamas', ctx({ activity: 'soevn', tempC: 18, feelsLikeC: 18 }));
    const warm = whyForGarment('pyjamas', ctx({ activity: 'soevn', tempC: 25, feelsLikeC: 25 }));
    expect(cold).toContain('18');
    expect(warm).toContain('25');
    expect(cold).not.toBe(warm);
  });
});
