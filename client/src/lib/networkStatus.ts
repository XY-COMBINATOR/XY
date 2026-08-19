type NetworkEventTarget = Pick<Window, "addEventListener" | "removeEventListener">;

export function isNetworkOffline(network: Pick<Navigator, "onLine"> | undefined) {
  return network ? !network.onLine : false;
}

/** Subscribe once to browser network transitions and return a cleanup callback. */
export function watchNetworkStatus(
  target: NetworkEventTarget,
  onOffline: () => void,
  onOnline: () => void
) {
  target.addEventListener("offline", onOffline);
  target.addEventListener("online", onOnline);

  return () => {
    target.removeEventListener("offline", onOffline);
    target.removeEventListener("online", onOnline);
  };
}
