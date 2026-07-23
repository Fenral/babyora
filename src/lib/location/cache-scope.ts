export type LocationCacheScope = 'persistent' | 'memory-only';

export type LocationRequestOptions = Readonly<{
  cacheScope: LocationCacheScope;
}>;

export const PERSISTENT_LOCATION_REQUEST: LocationRequestOptions = Object.freeze({
  cacheScope: 'persistent',
});

export const MEMORY_ONLY_LOCATION_REQUEST: LocationRequestOptions = Object.freeze({
  cacheScope: 'memory-only',
});

export function locationCacheScope(
  options: LocationRequestOptions | undefined,
): LocationCacheScope {
  return options?.cacheScope ?? PERSISTENT_LOCATION_REQUEST.cacheScope;
}
