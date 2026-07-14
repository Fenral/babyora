import { describe, it, expect } from 'vitest';
import {
  summarizeCareCircle,
  caregiverInitials,
  caregiverStatusLabel,
  CARE_CIRCLE_MAX_TOKENS,
  type Caregiver,
} from '../care-circle-model';

const cg = (id: string, status: Caregiver['status'] = 'active'): Caregiver => ({
  id,
  name: `Navn ${id}`,
  role: 'Forelder',
  status,
});

describe('summarizeCareCircle', () => {
  it('viser alle når antallet er ≤ maxTokens (ingen overflow)', () => {
    const s = summarizeCareCircle([cg('a'), cg('b'), cg('c')]);
    expect(s.visible).toHaveLength(3);
    expect(s.overflowCount).toBe(0);
    expect(s.total).toBe(3);
  });

  it('kapper til maxTokens og legger resten i overflow', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => cg(id));
    const s = summarizeCareCircle(many);
    expect(s.visible).toHaveLength(CARE_CIRCLE_MAX_TOKENS);
    expect(s.overflowCount).toBe(6 - CARE_CIRCLE_MAX_TOKENS);
    expect(s.total).toBe(6);
  });

  it('eksakt maxTokens gir ingen overflow', () => {
    const four = ['a', 'b', 'c', 'd'].map((id) => cg(id));
    expect(summarizeCareCircle(four).overflowCount).toBe(0);
  });

  it('tom liste gir tomme tokens og null overflow', () => {
    const s = summarizeCareCircle([]);
    expect(s.visible).toEqual([]);
    expect(s.overflowCount).toBe(0);
    expect(s.total).toBe(0);
  });

  it('respekterer et eksplisitt maxTokens-argument', () => {
    const s = summarizeCareCircle([cg('a'), cg('b'), cg('c')], 2);
    expect(s.visible).toHaveLength(2);
    expect(s.overflowCount).toBe(1);
  });
});

describe('caregiverInitials', () => {
  it('gir stor forbokstav', () => {
    expect(caregiverInitials('mona')).toBe('M');
  });
  it('faller tilbake til prikk for tomt navn', () => {
    expect(caregiverInitials('   ')).toBe('·');
  });
});

describe('caregiverStatusLabel', () => {
  it('bruker aldri tilstedeværelses-språk', () => {
    expect(caregiverStatusLabel('active')).toBe('Deler');
    expect(caregiverStatusLabel('pending')).toBe('Venter på svar');
    // Vokterprøve mot regresjon til «online/her nå/tilstede».
    for (const s of ['active', 'pending'] as const) {
      expect(caregiverStatusLabel(s)).not.toMatch(/online|her nå|tilstede|posisjon/i);
    }
  });
});
