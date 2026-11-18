import { useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { useDemoState } from "../demo-state/useDemoState.ts";
import { ActorContext } from "./ActorContext.ts";

export default function ActorProvider({ children }: PropsWithChildren) {
  const { data } = useDemoState();
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const actor =
    data?.demoUsers.find((user) => user.id === selectedActorId) ??
    data?.demoUsers[0] ??
    null;

  const value = useMemo(
    () => ({ actor, selectActor: setSelectedActorId }),
    [actor],
  );

  return (
    <ActorContext.Provider value={value}>{children}</ActorContext.Provider>
  );
}
