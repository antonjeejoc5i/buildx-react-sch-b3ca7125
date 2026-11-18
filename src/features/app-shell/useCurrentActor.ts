import { useContext } from "react";
import { ActorContext } from "./ActorContext.ts";

export function useCurrentActor() {
  const actorState = useContext(ActorContext);

  if (actorState === null) {
    throw new Error("useCurrentActor must be used within ActorProvider.");
  }

  return actorState;
}
