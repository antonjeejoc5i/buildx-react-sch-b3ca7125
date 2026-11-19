import { useEffect, useState } from "react";
import { useDemoState } from "../demo-state/useDemoState.ts";
import DecipherHandoff from "./DecipherHandoff.tsx";

function getHandoffPath(hash: string) {
  const parts = hash.replace(/^#/, "").split("/").filter(Boolean);
  if (parts.length !== 3 || parts[0] !== "handoff") return null;
  return { projectId: parts[1], participantId: parts[2] };
}

export default function DecipherHandoffRoute() {
  const { data, isLoading, saveBookingParticipation, saveWaitlistEntry } =
    useDemoState();
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const handoffPath = getHandoffPath(hash);
  if (handoffPath === null || isLoading || data === null) return null;

  return (
    <DecipherHandoff
      data={data}
      saveWaitlistEntry={saveWaitlistEntry}
      saveParticipation={saveBookingParticipation}
      {...handoffPath}
    />
  );
}
