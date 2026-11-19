import { useState } from "react";
import { useDemoState } from "../demo-state/useDemoState.ts";
import {
  buildOutboxPreviews,
  storeSimulatedFailure,
} from "./notificationOutboxData.ts";
import "./NotificationOutbox.css";

export default function NotificationOutbox() {
  const { data, saveStudy } = useDemoState();
  const [error, setError] = useState<string | null>(null);

  if (data === null) return null;

  const previews = buildOutboxPreviews(
    data.studies,
    data.bookings,
    data.bookingVisits,
    data.participants,
    data.reminders,
    data.notificationEvents,
  );

  async function simulateFailure(studyId: string, previewId: string) {
    const study = data?.studies.find((item) => item.id === studyId);
    if (study === undefined) return;

    try {
      await saveStudy(storeSimulatedFailure(study, previewId));
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to store the simulated failure.",
      );
    }
  }

  return (
    <section
      aria-labelledby="notification-outbox-heading"
      className="notification-outbox"
    >
      <div className="notification-outbox__heading">
        <div>
          <p>Local demonstration</p>
          <h2 id="notification-outbox-heading">Notification outbox</h2>
        </div>
        <p>No emails or text messages are sent from this outbox.</p>
      </div>
      {error !== null ? <p role="alert">{error}</p> : null}
      <ul>
        {previews.map((preview) => (
          <li key={preview.id}>
            <div>
              <strong>
                {preview.kind === "event" ? "Event" : "Reminder"} for{" "}
                {preview.participantName}
              </strong>
              <p>{preview.message}</p>
              <p>Booked channels: {preview.channels.join(" and ")}</p>
            </div>
            <div>
              <span
                className={`notification-outbox__status notification-outbox__status--${preview.deliveryStatus}`}
              >
                {preview.deliveryStatus === "failed"
                  ? "Delivery failed"
                  : preview.deliveryStatus === "sent"
                    ? "Simulated delivered"
                    : "Pending local preview"}
              </span>
              {preview.deliveryStatus !== "failed" ? (
                <button
                  type="button"
                  onClick={() =>
                    void simulateFailure(preview.studyId, preview.id)
                  }
                >
                  Simulate delivery failure
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
