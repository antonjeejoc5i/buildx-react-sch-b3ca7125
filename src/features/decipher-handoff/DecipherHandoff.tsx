import { useState } from "react";
import type { WaitlistEntry } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import BookingFlow from "../booking-flow/BookingFlow.tsx";
import WaitlistEnrollment from "../waitlist/WaitlistEnrollment.tsx";
import {
  formatHandoffTime,
  getHandoffCopy,
  resolveHandoff,
} from "./decipherHandoffData.ts";
import "./DecipherHandoff.css";

interface DecipherHandoffProps {
  data: DemoFixtures;
  participantId: string;
  projectId: string;
  saveWaitlistEntry?: (entry: WaitlistEntry) => Promise<void>;
}

export default function DecipherHandoff({
  data,
  participantId,
  projectId,
  saveWaitlistEntry,
}: DecipherHandoffProps) {
  const [showSlots, setShowSlots] = useState(false);
  const result = resolveHandoff(
    data.studies,
    data.participants,
    data.bookings,
    data.slots,
    projectId,
    participantId,
  );

  if (result.kind === "denied") {
    return (
      <main className="decipher-handoff__denial" role="alert">
        <h1>{result.title}</h1>
        <p>{result.message}</p>
      </main>
    );
  }

  const copy = getHandoffCopy(result.participant.language);
  if (result.kind === "existing-booking") {
    return (
      <main className="decipher-handoff" aria-labelledby="handoff-heading">
        <p className="decipher-handoff__eyebrow">{result.study.name}</p>
        <h1 id="handoff-heading">{copy.existingAppointment}</h1>
        <p>{copy.existingMessage}</p>
        {result.slot === undefined ? null : (
          <dl>
            <div>
              <dt>{copy.visit}</dt>
              <dd>
                {formatHandoffTime(
                  result.slot.startsAtUtc,
                  result.participant.language,
                  result.participant.timeZone,
                )}
              </dd>
            </div>
          </dl>
        )}
      </main>
    );
  }

  return (
    <main className="decipher-handoff" aria-labelledby="handoff-heading">
      <p className="decipher-handoff__eyebrow">{copy.summary}</p>
      <h1 id="handoff-heading">{result.study.name}</h1>
      <p>{result.study.description}</p>
      <dl>
        <div>
          <dt>{copy.visit}</dt>
          <dd>{result.study.visits.map((visit) => visit.name).join(", ")}</dd>
        </div>
      </dl>
      {showSlots ? (
        <>
          <BookingFlow
            data={data}
            participant={result.participant}
            study={result.study}
          />
          {saveWaitlistEntry === undefined ? null : (
            <WaitlistEnrollment
              data={data}
              participant={result.participant}
              saveWaitlistEntry={saveWaitlistEntry}
              study={result.study}
            />
          )}
        </>
      ) : (
        <button type="button" onClick={() => setShowSlots(true)}>
          {copy.continue}
        </button>
      )}
    </main>
  );
}
