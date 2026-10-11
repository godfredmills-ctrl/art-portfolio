import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and hydration, true afterwards. Used to bind scroll-linked
 * motion values only on the client: Motion accelerates them with native
 * ScrollTimeline in supporting browsers, which can't be reproduced on the
 * server and would otherwise cause hydration mismatches.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
