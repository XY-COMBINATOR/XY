/**
 * Use a configurable external asset host in deployments that do not run the
 * Manus storage proxy. The public raw GitHub asset branch is a durable default
 * for Vercel, while VITE_ASSET_ORIGIN can override it with a preferred CDN.
 */
const publicAssetOrigin =
  "https://raw.githubusercontent.com/XY-COMBINATOR/XY/gh-pages";
const configuredOrigin =
  import.meta.env.VITE_ASSET_ORIGIN?.trim() || publicAssetOrigin;

/** Build an asset URL while safely normalizing an optional CDN origin. */
export function assetUrlFromOrigin(path: string, origin: string | undefined) {
  const normalizedOrigin = origin?.trim().replace(/\/+$/, "") ?? "";
  return normalizedOrigin ? `${normalizedOrigin}${path}` : path;
}

export function assetUrl(path: string) {
  return assetUrlFromOrigin(path, configuredOrigin);
}
