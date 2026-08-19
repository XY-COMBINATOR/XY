/**
 * Use a configurable external asset host in deployments that do not run the
 * Manus storage proxy. Vercel production must set VITE_ASSET_ORIGIN to a
 * durable CDN origin with matching /manus-storage object paths.
 */
const configuredOrigin = import.meta.env.VITE_ASSET_ORIGIN ?? "";

/** Build an asset URL while safely normalizing an optional CDN origin. */
export function assetUrlFromOrigin(path: string, origin: string | undefined) {
  const normalizedOrigin = origin?.trim().replace(/\/+$/, "") ?? "";
  return normalizedOrigin ? `${normalizedOrigin}${path}` : path;
}

export function assetUrl(path: string) {
  return assetUrlFromOrigin(path, configuredOrigin);
}
