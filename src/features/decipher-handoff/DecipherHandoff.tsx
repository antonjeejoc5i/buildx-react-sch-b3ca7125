import { useState } from "react";
import type { WaitlistEntry } from "../../domain/models.ts";
import type { Booking, BookingVisit } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import AppointmentManagement from "../appointment-management/AppointmentManagement.tsx";
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
  saveParticipation: (
    booking: Booking,
    bookingVisits: BookingVisit[],
  ) => Promise<void>;
}

export default function DecipherHandoff({
  data,
  participantId,
  projectId,
  saveWaitlistEntry,
  saveParticipation,
}: DecipherHandoffProps) {
  const [showSlots, setShowSlots] = useState(false);
  // The booking made on this page: once saved, it keeps showing its confirmation here rather
  // than switching to the existing-appointment view, which is what a later visit shows.
  const [bookedHereId, setBookedHereId] = useState<string | null>(null);
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
  if (
    result.kind === "existing-booking" &&
    result.booking.id !== bookedHereId
  ) {
    const booking = data.bookings.find((item) => item.id === result.booking.id);
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
        {booking === undefined ? null : (
          <AppointmentManagement
            booking={booking}
            data={data}
            participant={result.participant}
            saveParticipation={saveParticipation}
            study={result.study}
          />
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
            onConfirmed={setBookedHereId}
            participant={result.participant}
            saveParticipation={saveParticipation}
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
