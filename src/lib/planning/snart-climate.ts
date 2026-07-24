import rawPack from '../../data/snart/climate-1991-2020-v1.json';
import rawManifest from '../../data/snart/climate-1991-2020-v1.manifest.json';

type Month = Readonly<{ month: number; meanTemperatureC: number; monthlyPrecipitationMm: number }>;
export type SnartClimateProfile = Readonly<{ homePlaceKey: string; profileId: string; months: readonly Month[] }>;
type ClimatePack = Readonly<{ schemaVersion: 'babyora-monthly-normal-pack@2'; derivationVersion: 'babyora-monthly-normal-pack@2'; rulesetVersion: 'babyora-snart-heuristics@2'; profiles: Readonly<Record<string, SnartClimateProfile>> }>;
type Manifest = Readonly<{ schemaVersion: 'babyora-monthly-normal-manifest@2'; derivationVersion: 'babyora-monthly-normal-pack@2'; rulesetVersion: 'babyora-snart-heuristics@2'; packSha256: string; contractSha256: string; targetWindowDerivationVersion: 'babyora-target-window-monthly-weighting@1'; placeGridBindings: readonly unknown[] }>;
export type ClimateResult = { status: 'available'; pack: ClimatePack; manifest: Manifest } | { status: 'unavailable'; reason: string };

const PACK_SHA = 'e222950d15e49a98e5aeb65516219f6a4adda5a618e6ad1ae98ad6193136457b';
const CONTRACT_SHA = 'f223636699eb0b654ad29ab08b407237db6e5ee224aeb8f0720e4c80a0f05033';
const PACK_KEYS = ['contractVersion', 'derivationVersion', 'normalPeriod', 'profiles', 'rulesetVersion', 'schemaVersion'] as const;
const MANIFEST_KEYS = [
  'builderSha256', 'canonicalPlaceCount', 'canonicalPlacesSha256', 'contractSha256',
  'createdFromGitSha', 'derivationVersion', 'fixtureMode', 'gridPolicyVersion',
  'homePlaceKeyVersion', 'httpPolicyVersion', 'monthCount', 'normalPeriod',
  'packSha256', 'placeGridBindings', 'productionEligible', 'roundingPolicy',
  'rulesetVersion', 'schemaVersion', 'sourceAggregations', 'sourceAttribution',
  'sourceCatalogUrls', 'sourceDatasetName', 'sourceDatasets', 'sourceDisclaimer',
  'sourceFileVersions', 'sourceInstitution', 'sourceLicenseUri', 'sourceMetadataSha256',
  'sourceUnits', 'sourceVariableVersions', 'supportedProfileCount',
  'targetWindowDerivationVersion', 'unavailableProfileCount',
] as const;
const PROFILE_KEYS = ['grid', 'homePlaceKey', 'months', 'profileId'] as const;
const GRID_KEYS = ['X', 'Y', 'distanceMillimetres', 'lat', 'lon'] as const;
const BINDING_KEYS = [
  'X', 'Y', 'distanceMillimetres', 'gridLat', 'gridLon', 'homePlaceKey',
  'latE4', 'lonE4', 'nameNfc', 'profileId', 'status',
] as const;
const NORMAL_PERIOD_KEYS = ['fromYear', 'throughYear'] as const;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every((key) => key in value);
const isNormalPeriod = (value: unknown) => isObject(value)
  && exactKeys(value, NORMAL_PERIOD_KEYS)
  && value.fromYear === 1991
  && value.throughYear === 2020;
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isInteger = (value: unknown): value is number => isFiniteNumber(value) && Number.isInteger(value);
const cloneAndFreeze = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((child) => cloneAndFreeze(child))) as T;
  }
  if (isObject(value)) {
    return Object.freeze(Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, cloneAndFreeze(child)]),
    )) as T;
  }
  return value;
};

const arrayHasExactJsonShape = (value: readonly unknown[]): boolean => {
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1 || !keys.includes('length')) return false;
  for (let index = 0; index < value.length; index += 1) {
    const key = String(index);
    if (!keys.includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return false;
  }
  return keys.every((key) => key === 'length' || (typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key)));
};

const getExactJsonObjectKeys = (value: Record<string, unknown>): readonly string[] | null => {
  if (Object.getPrototypeOf(value) !== Object.prototype) return null;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== 'string')) return null;
  const keys = ownKeys as string[];
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return null;
  }
  return [...keys].sort();
};

const structurallyEqualsCommittedJson = (candidate: unknown, expected: unknown): boolean => {
  if (Object.is(candidate, expected)) return true;
  if (Array.isArray(candidate) || Array.isArray(expected)) {
    if (
      !Array.isArray(candidate)
      || !Array.isArray(expected)
      || candidate.length !== expected.length
      || !arrayHasExactJsonShape(candidate)
    ) return false;
    return candidate.every((value, index) => structurallyEqualsCommittedJson(value, expected[index]));
  }
  if (isObject(candidate) || isObject(expected)) {
    if (!isObject(candidate) || !isObject(expected)) return false;
    const candidateKeys = getExactJsonObjectKeys(candidate);
    const expectedKeys = getExactJsonObjectKeys(expected);
    if (
      !candidateKeys
      || !expectedKeys
      || candidateKeys.length !== expectedKeys.length
      || candidateKeys.some((key, index) => key !== expectedKeys[index])
    ) return false;
    return candidateKeys.every((key) => structurallyEqualsCommittedJson(candidate[key], expected[key]));
  }
  return false;
};

const COMMITTED_PACK = cloneAndFreeze(rawPack);
const COMMITTED_MANIFEST = cloneAndFreeze(rawManifest);

export function decodeSnartClimatePack(pack: unknown, manifest: unknown): ClimateResult {
  if (
    !isObject(pack)
    || !exactKeys(pack, PACK_KEYS)
    || !isObject(manifest)
    || !exactKeys(manifest, MANIFEST_KEYS)
    || pack.schemaVersion !== 'babyora-monthly-normal-pack@2'
    || pack.contractVersion !== 'snart-monthly-normal-contract@2'
    || pack.derivationVersion !== 'babyora-monthly-normal-pack@2'
    || pack.rulesetVersion !== 'babyora-snart-heuristics@2'
    || !isNormalPeriod(pack.normalPeriod)
    || manifest.schemaVersion !== 'babyora-monthly-normal-manifest@2'
    || manifest.derivationVersion !== 'babyora-monthly-normal-pack@2'
    || manifest.rulesetVersion !== 'babyora-snart-heuristics@2'
    || !isNormalPeriod(manifest.normalPeriod)
    || manifest.packSha256 !== PACK_SHA
    || manifest.contractSha256 !== CONTRACT_SHA
    || manifest.targetWindowDerivationVersion !== 'babyora-target-window-monthly-weighting@1'
    || manifest.monthCount !== 12
    || manifest.fixtureMode !== false
    || manifest.productionEligible !== true
    || !isObject(pack.profiles)
    || !Array.isArray(manifest.placeGridBindings)
    || !structurallyEqualsCommittedJson(pack, COMMITTED_PACK)
    || !structurallyEqualsCommittedJson(manifest, COMMITTED_MANIFEST)
  ) return { status: 'unavailable', reason: 'invalid_climate_pack' };

  const bindings = new Map<string, Record<string, unknown>>();
  for (const binding of manifest.placeGridBindings) {
    if (
      !isObject(binding)
      || !exactKeys(binding, BINDING_KEYS)
      || binding.status !== 'supported'
      || typeof binding.homePlaceKey !== 'string'
      || typeof binding.profileId !== 'string'
      || typeof binding.nameNfc !== 'string'
      || !isInteger(binding.latE4)
      || !isInteger(binding.lonE4)
      || !isInteger(binding.X)
      || !isInteger(binding.Y)
      || !isInteger(binding.distanceMillimetres)
      || !isFiniteNumber(binding.gridLat)
      || !isFiniteNumber(binding.gridLon)
      || bindings.has(binding.homePlaceKey)
    ) return { status: 'unavailable', reason: 'invalid_climate_binding' };
    bindings.set(binding.homePlaceKey, binding);
  }

  for (const [key, profile] of Object.entries(pack.profiles)) {
    const binding = bindings.get(key);
    if (
      !isObject(profile)
      || !exactKeys(profile, PROFILE_KEYS)
      || profile.homePlaceKey !== key
      || typeof profile.profileId !== 'string'
      || !isObject(profile.grid)
      || !exactKeys(profile.grid, GRID_KEYS)
      || !isInteger(profile.grid.X)
      || !isInteger(profile.grid.Y)
      || !isInteger(profile.grid.distanceMillimetres)
      || !isFiniteNumber(profile.grid.lat)
      || !isFiniteNumber(profile.grid.lon)
      || !binding
      || binding.profileId !== profile.profileId
      || binding.X !== profile.grid.X
      || binding.Y !== profile.grid.Y
      || binding.distanceMillimetres !== profile.grid.distanceMillimetres
      || binding.gridLat !== profile.grid.lat
      || binding.gridLon !== profile.grid.lon
      || !Array.isArray(profile.months)
      || profile.months.length !== 12
    ) return { status: 'unavailable', reason: 'invalid_climate_profile' };
    const expected = new Set(Array.from({ length: 12 }, (_, i) => i + 1));
    for (const row of profile.months) if (!isObject(row) || !exactKeys(row, ['meanTemperatureC', 'month', 'monthlyPrecipitationMm']) || !Number.isInteger(row.month) || !expected.delete(row.month as number) || !Number.isFinite(row.meanTemperatureC) || !Number.isFinite(row.monthlyPrecipitationMm)) return { status: 'unavailable', reason: 'invalid_climate_month' };
    if (expected.size) return { status: 'unavailable', reason: 'invalid_climate_month' };
  }
  if (
    bindings.size !== Object.keys(pack.profiles).length
    || manifest.supportedProfileCount !== bindings.size
    || manifest.unavailableProfileCount !== 0
    || manifest.canonicalPlaceCount !== bindings.size
  ) return { status: 'unavailable', reason: 'invalid_climate_coverage' };

  return {
    status: 'available',
    pack: cloneAndFreeze(pack as ClimatePack),
    manifest: cloneAndFreeze(manifest as Manifest),
  };
}

const committed = decodeSnartClimatePack(rawPack, rawManifest);
export function resolveSnartClimateProfile(input: { homePlaceKey: string; climateProfileId: string }): { status: 'available'; profile: SnartClimateProfile; packSha256: string } | { status: 'unavailable'; reason: string } {
  if (committed.status !== 'available' || typeof input.homePlaceKey !== 'string' || typeof input.climateProfileId !== 'string') return { status: 'unavailable', reason: 'invalid_climate_profile' };
  const profile = committed.pack.profiles[input.homePlaceKey];
  if (!profile || profile.homePlaceKey !== input.homePlaceKey || profile.profileId !== input.climateProfileId) return { status: 'unavailable', reason: 'unknown_climate_profile' };
  return { status: 'available', profile, packSha256: committed.manifest.packSha256 };
}

const isLeapYear = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
const daysInMonth = (year: number, month: number) => (
  month === 2 ? (isLeapYear(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31
);
const parseIsoCalendarDate = (value: string): readonly [number, number, number] | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    year < 1
    || month < 1
    || month > 12
    || day < 1
    || day > daysInMonth(year, month)
  ) return null;
  return [year, month, day];
};

export function deriveSnartTargetWindowSignals(profile: SnartClimateProfile, dates: readonly string[]) {
  if (dates.length !== 15 || new Set(dates).size !== 15) {
    return { status: 'unavailable' as const, reason: 'invalid_target_window' };
  }
  const parsedDates = dates.map(parseIsoCalendarDate);
  if (parsedDates.some((date) => date === null)) {
    return { status: 'unavailable' as const, reason: 'invalid_target_window' };
  }
  const counts = new Map<string, number>();
  for (const date of dates) {
    counts.set(date.slice(0, 7), (counts.get(date.slice(0, 7)) ?? 0) + 1);
  }
  let temperature = 0; let precipitation = 0;
  for (const [yearMonth, count] of counts) { const [year, month] = yearMonth.split('-').map(Number); const row = profile.months.find((item) => item.month === month); if (!row) return { status: 'unavailable' as const, reason: 'invalid_climate_month' }; temperature += row.meanTemperatureC * count; precipitation += (row.monthlyPrecipitationMm / daysInMonth(year, month)) * count; }
  return { status: 'available' as const, targetMeanTemperatureC: temperature / 15, targetPrecipitationMm: precipitation };
}
