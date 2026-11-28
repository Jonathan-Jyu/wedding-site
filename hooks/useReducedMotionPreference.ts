import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const preference = window.matchMedia(query);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
