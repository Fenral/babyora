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
  {
    id: 'guide', label: 'Guide', appWeight: 7,
    role: 'Organisere verktøy og kunnskap uten å skjule den daglige hovedoppgaven.',
    states: [{ id: 'hub', label: 'Guideoversikt', required: true, actions: [tab('Guide'), wait] }],
  },
  {
    id: 'find-outfit', label: 'Finn antrekk', appWeight: 6,
    role: 'La forelderen utforske vær og situasjon med tydelig årsak–virkning.',
    states: [{ id: 'default', label: 'Standard kalkulator', required: true, actions: [tab('Guide'), button('Kleskalkulatoren'), wait] }],
  },
  {
    id: 'clothing-library', label: 'Plaggbibliotek', appWeight: 3,
    role: 'Gi et lavfriksjons oppslagsverk som bygger forståelse og tillit.',
    states: [{ id: 'overview', label: 'Bibliotekoversikt', required: true, actions: [tab('Guide'), text('Plaggbibliotek'), wait] }],
  },
  {
    id: 'wardrobe', label: 'Min garderobe', appWeight: 3,
    role: 'Vise om registreringsarbeidet gir nok personlig verdi til å forsvares.',
    states: [{ id: 'default', label: 'Garderobeoversikt', required: true, actions: [tab('Guide'), text('Min garderobe'), wait] }],
  },
  {
    id: 'tog', label: 'TOG', appWeight: 5,
    role: 'Gi forsiktig og forståelig søvnveiledning uten å blande TOG inn i utendørspåkledning.',
    states: [{ id: 'default', label: 'TOG-veileder', required: true, actions: [tab('Guide'), button('Soving innendørs'), wait], expectedText: 'Soving innendørs' }],
  },
  {
    id: 'warm-cold', label: 'Varm eller kald', appWeight: 5,
    role: 'Lære forelderen en enkel kontroll som øker trygghet og kan gi personlig tilpasning.',
    states: [{ id: 'default', label: 'Nakkesjekk', required: true, actions: [tab('Guide'), text('Varm eller kald'), wait] }],
  },
  {
    id: 'first-winter', label: 'Første vinter', appWeight: 5,
    role: 'Bygge tillit og sesongverdi uten å gjøre tekstinnhold til hele Plus-produktet.',
    states: [{ id: 'overview', label: 'Programoversikt', required: true, actions: [tab('Guide'), text('Første vinter'), wait] }],
  },
  {
    id: 'settings', label: 'Innstillinger', appWeight: 5,
    role: 'Gjøre barn, sted, varsler, personvern og abonnement forståelig og kontrollerbart.',
    states: [{ id: 'default', label: 'Innstillingsoversikt', required: true, actions: [tab('Familie|Innst'), wait] }],
  },
  {
    id: 'paywall', label: 'Betalingsvegg', appWeight: 14,
    role: 'Selge fremover, overalt og familie gjennom konkrete utfall, tydelig pris og lav opplevd risiko.',
    states: [{ id: 'default', label: 'Standard Plus-tilbud', required: true, actions: [tab('Familie|Innst'), button('Plus|Premium|Oppgrader|Se abonnement'), wait] }],
  },
] as const;

export const PAGE_BY_ID = new Map(PAGE_CATALOG.map((page) => [page.id, page]));
