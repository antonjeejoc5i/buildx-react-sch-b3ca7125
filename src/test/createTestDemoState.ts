import { vi } from "vitest";
import type { DemoState } from "../features/demo-state/DemoStateContext.ts";

/**
 * A complete DemoState for tests: no data, not loading, no error, and every action a vi.fn that
 * resolves. A test passes only what it checks, for example
 * createTestDemoState({ data: demoFixtures, clearData }). Actions added to DemoState later are
 * filled in automatically, so a new field never breaks tests that do not use it.
 */
export function createTestDemoState(
  overrides: Partial<DemoState> = {},
): DemoState {
  const state: Record<PropertyKey, unknown> = {
    data: null,
    error: null,
    isLoading: false,
    exportData: vi.fn(() => "{}"),
    ...overrides,
  };
  return new Proxy(state, {
    get(target, key) {
      // "then" stays undefined so the state is never mistaken for a promise.
      if (typeof key === "string" && key !== "then" && !(key in target)) {
        target[key] = vi.fn(async () => undefined);
      }
      return target[key];
    },
  }) as unknown as DemoState;
}
