import { useState } from "react";
import type { Participant, Study, WaitlistEntry } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import {
  buildWaitlistEntry,
  evaluateWaitlistEnrollment,
} from "./waitlistData.ts";
import "./WaitlistEnrollment.css";

interface WaitlistEnrollmentProps {
  data: DemoFixtures;
  participant: Participant;
  study: Study;
  saveWaitlistEntry: (entry: WaitlistEntry) => Promise<void>;
}

export default function WaitlistEnrollment({
  data,
  participant,
  study,
  saveWaitlistEntry,
}: WaitlistEnrollmentProps) {
  const [message, setMessage] = useState<string | null>(null);
  const eligibleSlots = data.slots.filter((slot) => {
    if (slot.studyId !== study.id) return false;
    return evaluateWaitlistEnrollment(data, study, participant, slot).allowed;
  });

  if (eligibleSlots.length === 0) return null;

  async function joinWaitlist(slotId: string) {
    try {
      await saveWaitlistEntry(
        buildWaitlistEntry(
          `waitlist-${participant.id}-${slotId}`,
          slotId,
          participant.id,
          new Date().toISOString(),
        ),
      );
      setMessage("You have joined the waitlist for this full slot.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to join the waitlist.",
      );
    }
  }

  return (
    <section aria-labelledby="waitlist-heading" className="waitlist-enrollment">
      <h2 id="waitlist-heading">Join the waitlist</h2>
      <p>
        This eligible primary slot is full. Joining the waitlist does not create
        a backup slot booking.
      </p>
      <ul>
        {eligibleSlots.map((slot) => (
          <li key={slot.id}>
            <button onClick={() => void joinWaitlist(slot.id)} type="button">
              Join waitlist for full slot
            </button>
          </li>
        ))}
      </ul>
      {message !== null ? <p aria-live="polite">{message}</p> : null}
    </section>
  );
}
