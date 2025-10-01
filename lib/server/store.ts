import { BabyEvent } from "@/lib/types/events";

type Store = {
  events: Map<string, BabyEvent>;
};

declare global {
  // eslint-disable-next-line no-var
  var __BABYSTEPS_STORE: Store | undefined;
}

const store: Store = globalThis.__BABYSTEPS_STORE ?? {
  events: new Map()
};

if (!globalThis.__BABYSTEPS_STORE) {
  globalThis.__BABYSTEPS_STORE = store;
}

export function getStore() {
  return store;
}
