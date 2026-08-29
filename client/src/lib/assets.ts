const publicAssetOrigin =
  "https://raw.githubusercontent.com/XY-COMBINATOR/XY/gh-pages";
const configuredOrigin =
  import.meta.env.VITE_ASSET_ORIGIN?.trim() || publicAssetOrigin;

const localAssetFallbacks: Record<string, string> = {
  "xy-combinator-brand-mark": "/assets/brand-mark.svg",
  "xy-team-field": "/assets/team-field.svg",
  "xy-signal-ribbon": "/assets/signal-ribbon.svg",
  "xy-logo-mark": "/favicon.svg",
};

/** Build an asset URL while safely normalizing an optional CDN origin. */
export function assetUrlFromOrigin(path: string, origin: string | undefined) {
  for (const [key, localPath] of Object.entries(localAssetFallbacks)) {
    if (path.includes(key)) {
      return localPath;
    }
  }
  const normalizedOrigin = origin?.trim().replace(/\/+$/, "") ?? "";
  return normalizedOrigin ? `${normalizedOrigin}${path}` : path;
}

export function assetUrl(path: string) {
  return assetUrlFromOrigin(path, configuredOrigin);
}
