/**
 * Hardkodet mock-bruker-profil for Fase 1–7.
 * Erstattes med Supabase-data ved Fase 3 (onboarding).
 */

export type MockActivity = 'vogn' | 'baeresele' | 'utelek' | 'tur';

export type MockProfile = {
  childName: string;
  ageMonths: number;
  city: string;
  lat: number;
  lon: number;
  activity: MockActivity;
};

export const MOCK: MockProfile = {
  childName: 'Lillian',
  ageMonths: 8,
  city: 'Trondheim',
  lat: 63.4305,
  lon: 10.3951,
  activity: 'vogn',
};

// Iter 24: ACTIVITIES + SIMPLE_TOGGLE fjernet — defaultActivity slettet fra
// Child-type. Aktivitet styres alene av HomeScreen "I vogn"-toggle (start i 'utelek').
