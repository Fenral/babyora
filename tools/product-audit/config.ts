import type { AuditDimension, PageDefinition } from './types';

export const RUBRIC_VERSION = '1.0.0';
export const VIEWPORT = { width: 390, height: 844 } as const;

export const RUBRIC: ReadonlyArray<AuditDimension> = [
  { id: 'taskClarity', label: 'Oppgaveforståelse og hierarki', weight: 20, question: 'Forstår forelderen umiddelbart hva siden svarer på og hva som er viktigst?' },
  { id: 'navigationInteraction', label: 'Navigasjon og interaksjon', weight: 15, question: 'Er hovedoppgaven rask, forutsigbar og komfortabel med én hånd?' },
  { id: 'visualCraft', label: 'Visuell kvalitet og konsistens', weight: 15, question: 'Føles siden gjennomarbeidet, sammenhengende og tydelig Babyora?' },
  { id: 'colorTemperature', label: 'Farge og temperaturuttrykk', weight: 10, question: 'Har fargene tydelige roller, god kontrast og nyttig temperaturrespons?' },
  { id: 'copyTrust', label: 'Tekst, tillit og troverdighet', weight: 15, question: 'Er språket tydelig, rolig, sannferdig og internt konsistent?' },
  { id: 'productValue', label: 'Produktverdi og kjøpsbidrag', weight: 20, question: 'Beviser siden gratisverdi, retention eller en troverdig Plus-verdi?' },
  { id: 'accessibilityRobustness', label: 'Tilgjengelighet og robusthet', weight: 5, question: 'Håndteres touch, kontrast, dynamisk tekst, bevegelse og feiltilstander?' },
] as const;

const wait = { type: 'wait', milliseconds: 700 } as const;
const tab = (name: string) => ({ type: 'tab', name } as const);
const text = (pattern: string) => ({ type: 'text', pattern } as const);
const button = (pattern: string) => ({ type: 'button', pattern } as const);

export const PAGE_CATALOG: ReadonlyArray<PageDefinition> = [
  {
    id: 'onboarding', label: 'Onboarding', appWeight: 10,
    role: 'Føre en ny forelder til første ekte antrekksverdi før betaling eller tillatelser.',
    states: [{ id: 'start', label: 'Første steg', required: true, actions: [{ type: 'clear-storage' }, { type: 'reload' }, wait] }],
  },
  {
    id: 'home', label: 'Hjem', appWeight: 15,
    role: 'Bevise løftet om en komplett anbefaling for i dag hjemme.',
    states: [{ id: 'default', label: 'Standard anbefaling', required: true, actions: [tab('Hjem'), wait] }],
  },
  {
    id: 'outfit', label: 'Påkledning', appWeight: 12,
    role: 'Gjøre Babyoras kjerneanbefaling presis, forståelig og tillitsvekkende.',
    states: [{ id: 'recommendation', label: 'Antrekksdetaljer', required: true, actions: [tab('Hjem'), button('Se dagens antrekk|Se påkledning|Påkledning'), wait] }],
  },
  {
    id: 'plan', label: 'Uke / Planlegg', appWeight: 10,
    role: 'Gjøre Plus-verdien fremover konkret uten å svekke dagens gratisverdi.',
    states: [{ id: 'default', label: 'Dags- og ukeplan', required: true, actions: [tab('Uke|Plan'), wait] }],
  },
  // P1 (nav 4→3 skeleton, 2026-07-30): Guide-tab-roten er fjernet (se
  // src/types/nav.ts). Guide-huben selv (id 'guide') hadde ingen egen
  // destinasjon utenom seg selv, så den er fjernet uten erstatning.
  // find-outfit/clothing-library/wardrobe var KUN nåbare via Guide-huben og
  // har ingen synlig opener ennå etter fjerningen — FinnAntrekkScreen og
  // PlaggbibliotekScreen er wired som drills i App.tsx, men uten en CTA som
  // åpner dem (se App.tsx sin Drill-union-kommentar). MinGarderobeScreen var
  // allerede utilgjengelig fra Guide-huben før denne endringen. Alle tre
  // gjeninnføres i katalogen når P5/P6 gir dem et entry-point fra Hjem. De
  // fjernede sidenes appWeight (7+6+3+3=19) er flyttet til 'settings' under,
  // siden Familie/Innstillinger nå er hjemmet for de gjenværende
  // Guide-"kunnskap"-verktøyene (tog/warm-cold/first-winter).
  {
    id: 'tog', label: 'TOG', appWeight: 5,
    role: 'Gi forsiktig og forståelig søvnveiledning uten å blande TOG inn i utendørspåkledning.',
    states: [{ id: 'default', label: 'TOG-veileder', required: true, actions: [tab('Familie'), button('Soveguiden'), wait], expectedText: 'Soving innendørs' }],
  },
  {
    id: 'warm-cold', label: 'Varm eller kald', appWeight: 5,
    role: 'Lære forelderen en enkel kontroll som øker trygghet og kan gi personlig tilpasning.',
    states: [{ id: 'default', label: 'Nakkesjekk', required: true, actions: [tab('Familie'), text('Varm eller kald'), wait] }],
  },
  {
    id: 'first-winter', label: 'Første vinter', appWeight: 5,
    role: 'Bygge tillit og sesongverdi uten å gjøre tekstinnhold til hele Plus-produktet.',
    states: [{ id: 'overview', label: 'Programoversikt', required: true, actions: [tab('Familie'), text('Første vinter'), wait] }],
  },
  {
    id: 'settings', label: 'Innstillinger', appWeight: 24,
    role: 'Gjøre barn, sted, varsler, verktøy, personvern og abonnement forståelig og kontrollerbart.',
    states: [{ id: 'default', label: 'Innstillingsoversikt', required: true, actions: [tab('Familie|Innst'), wait] }],
  },
  {
    id: 'paywall', label: 'Betalingsvegg', appWeight: 14,
    role: 'Selge fremover, overalt og familie gjennom konkrete utfall, tydelig pris og lav opplevd risiko.',
    states: [{ id: 'default', label: 'Standard Plus-tilbud', required: true, actions: [tab('Familie|Innst'), button('Plus|Premium|Oppgrader|Se abonnement'), wait] }],
  },
] as const;

export const PAGE_BY_ID = new Map(PAGE_CATALOG.map((page) => [page.id, page]));
