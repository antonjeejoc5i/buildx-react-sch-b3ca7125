import { useContext } from "react";
import { DemoStateContext } from "./DemoStateContext.ts";

export function useDemoState() {
  const state = useContext(DemoStateContext);

  if (state === null) {
    throw new Error("useDemoState must be used within DemoStateProvider.");
  }

  return state;
}
