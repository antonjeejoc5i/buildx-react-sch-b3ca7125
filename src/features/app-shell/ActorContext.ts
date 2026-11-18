import { createContext } from "react";
import type { DemoUser } from "../../domain/models.ts";

export interface CurrentActorState {
  actor: DemoUser | null;
  selectActor: (actorId: string) => void;
}

export const ActorContext = createContext<CurrentActorState | null>(null);
