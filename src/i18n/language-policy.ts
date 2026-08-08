export const SUPPORTED_LANGUAGES = ['no', 'en', 'sv', 'da', 'de'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Stores only a language the user selected explicitly. */
export const LANGUAGE_OVERRIDE_STORAGE_KEY = 'babyora:languageOverride';

export interface LanguageStorageReader {
  getItem(key: string): string | null;
}

export interface LanguageStorageWriter extends LanguageStorageReader {
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface DeviceLanguageNavigator {
  readonly language?: unknown;
  readonly languages?: readonly unknown[];
}

export interface LanguageEnvironment {
  readonly storage?: LanguageStorageReader | null;
  readonly navigator?: DeviceLanguageNavigator | null;
}

export interface LanguageDocument {
  readonly documentElement: {
    lang: string;
    dir: string;
  };
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function browserNavigator(): Navigator | null {
  try {
    return typeof navigator === 'undefined' ? null : navigator;
  } catch {
    return null;
  }
}

function browserDocument(): Document | null {
  try {
    return typeof document === 'undefined' ? null : document;
  } catch {
    return null;
  }
}

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string'
    && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function readLanguageOverride(
  storage: LanguageStorageReader | null = browserStorage(),
): SupportedLanguage | null {
  if (storage === null) return null;

  try {
    const stored = storage.getItem(LANGUAGE_OVERRIDE_STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Persist a user action only. Automatic locale resolution never calls this. */
export function writeLanguageOverride(
  language: SupportedLanguage,
  storage: LanguageStorageWriter | null = browserStorage(),
): void {
  if (storage === null) return;

  try {
    storage.setItem(LANGUAGE_OVERRIDE_STORAGE_KEY, language);
  } catch {
    // A blocked/full storage backend must not prevent an in-memory language change.
  }
}

export function removeLanguageOverride(
  storage: LanguageStorageWriter | null = browserStorage(),
): void {
  if (storage === null) return;

  try {
    storage.removeItem(LANGUAGE_OVERRIDE_STORAGE_KEY);
  } catch {
    // A blocked storage backend already behaves like there is no readable override.
  }
}

function deviceLocaleCandidates(source: DeviceLanguageNavigator | null): unknown[] {
  if (source === null) return [];

  const candidates: unknown[] = [];

  try {
    if (Array.isArray(source.languages)) candidates.push(...source.languages);
  } catch {
    // Ignore an inaccessible browser field and try the singular locale below.
  }

  try {
    if (!candidates.includes(source.language)) candidates.push(source.language);
  } catch {
    // An inaccessible singular locale leaves the collected candidates intact.
  }

  return candidates;
}

/** Return the region from the first well-formed BCP 47 locale that has one. */
export function firstValidDeviceRegion(
  locales: readonly unknown[] | null | undefined,
): string | null {
  if (!Array.isArray(locales)) return null;

  for (const locale of locales) {
    if (typeof locale !== 'string' || locale.length === 0) continue;

    try {
      const region = new Intl.Locale(locale).region;
      if (region !== undefined) return region.toUpperCase();
    } catch {
      // Keep looking: navigator.languages can contain a malformed vendor value.
    }
  }

  return null;
}

export function resolveDeviceLanguage(
  locales: readonly unknown[] | null | undefined,
): SupportedLanguage {
  const region = firstValidDeviceRegion(locales);
  if (region === 'SE') return 'sv';
  if (region === 'DK') return 'da';
  return 'en';
}

/** Explicit user choice wins; otherwise resolve synchronously from device region. */
export function resolveInitialLanguage(
  environment: LanguageEnvironment = {},
): SupportedLanguage {
  const storage = environment.storage === undefined ? browserStorage() : environment.storage;
  const override = readLanguageOverride(storage);
  if (override !== null) return override;

  const navigatorSource = environment.navigator === undefined
    ? browserNavigator()
    : environment.navigator;
  return resolveDeviceLanguage(deviceLocaleCandidates(navigatorSource));
}

export function htmlLanguageFor(language: unknown): string {
  if (!isSupportedLanguage(language)) return 'en';
  return language === 'no' ? 'nb' : language;
}

/** Keep screen-reader language selection synchronized with i18next changes. */
export function syncDocumentLanguage(
  language: unknown,
  target: LanguageDocument | null = browserDocument(),
): void {
  if (target === null) return;
  target.documentElement.lang = htmlLanguageFor(language);
  target.documentElement.dir = 'ltr';
}
