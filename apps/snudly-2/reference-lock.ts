export const APPROVED_VISUAL_REFERENCE = Object.freeze({
  status: 'OWNER_APPROVED',
  htmlPath: 'loop/referanse/snudly-mock.html',
  figmaFileKey: '5KN5PHFXBfmTgRTiTlITs0',
  figmaNodeId: '9:3',
  sourceFileKey: 'rEqVpmfJ1N1aCZzspY4Kxo',
  sourceNodeId: '11:2',
  viewport: '390x844',
} as const);

export const APPROVED_HOME_IMPLEMENTATION = Object.freeze({
  status: 'OWNER_APPROVED',
  approvedOn: '2026-08-17',
  implementationCommit: 'a71a8e8',
  viewport: '390x844',
  scope: 'Hjem, including the baby-to-garment-card contact edge',
} as const);

export const SPLASH_ONBOARDING_CANDIDATE = Object.freeze({
  status: 'AWAITING_OWNER_REVIEW',
  sourceRole: 'EXTENSION_OF_OWNER_APPROVED_HOME_VISUAL_WORLD',
  directReferenceAvailable: false,
  screens: ['launch', 'name', 'birth-date', 'home-place', 'summary', 'welcome'],
  viewport: '390x844',
  note: 'The approved Vercel source contains the app surfaces, but no launch or onboarding screens.',
} as const);

export const PRODUCT_TOUR_CANDIDATE = Object.freeze({
  status: 'AWAITING_OWNER_REVIEW',
  sourceRole: 'DIRECT_EXTENSION_OF_APPROVED_VERCEL_PRODUCT_SURFACES',
  directReferenceAvailable: true,
  screens: ['tour-home', 'tour-plan', 'tour-tools', 'tour-family'],
  viewport: '390x844',
  visualSource: 'https://snudly.vercel.app/',
  commercialModel: 'FREE_V1_OWNER_DECISION_2026_08_24',
} as const);
