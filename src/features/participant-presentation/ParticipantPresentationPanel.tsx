import { useDemoState } from "../demo-state/useDemoState.ts";
import ParticipantPresentation from "./ParticipantPresentation.tsx";

export default function ParticipantPresentationPanel() {
  const { data, isLoading } = useDemoState();

  if (isLoading || data === null) return null;

  const participant = data.participants[0];
  const appointment = data.slots[0];

  if (participant === undefined || appointment === undefined) return null;

  return (
    <ParticipantPresentation
      appointment={appointment}
      participant={participant}
    />
  );
}
