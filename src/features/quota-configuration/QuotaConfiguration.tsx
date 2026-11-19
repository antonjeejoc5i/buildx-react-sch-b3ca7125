import { useState } from "react";
import type { FormEvent } from "react";
import type {
  Booking,
  Participant,
  Quota,
  Study,
} from "../../domain/models.ts";
import {
  buildQuota,
  calculateQuotaStatus,
  getDefaultOverbookingPercentage,
  setDefaultOverbookingPercentage,
} from "./quotaConfigurationData.ts";
import "./QuotaConfiguration.css";

interface QuotaConfigurationProps {
  study: Study;
  quotas: Quota[];
  participants: Participant[];
  bookings: Booking[];
  saveStudy: (study: Study) => Promise<void>;
  saveQuota: (quota: Quota) => Promise<void>;
}

function bucketLabel(quota: Quota): string {
  if (quota.dimensions.length === 0) return "Whole-participant limit";

  return quota.dimensions
    .map(
      (dimension) =>
        `${dimension}: ${String(quota.attributeConditions[dimension])}`,
    )
    .join(" · ");
}

function QuotaBucket({
  quota,
  participants,
  bookings,
  saveQuota,
}: {
  quota: Quota;
  participants: Participant[];
  bookings: Booking[];
  saveQuota: (quota: Quota) => Promise<void>;
}) {
  const [target, setTarget] = useState(() => String(quota.target));
  const [overbookingPercentage, setOverbookingPercentage] = useState(() =>
    String(quota.overbookingPercentage),
  );
  const [message, setMessage] = useState<string | null>(null);
  const status = calculateQuotaStatus(quota, participants, bookings);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveQuota(buildQuota(quota, { target, overbookingPercentage }));
      setMessage("Quota bucket saved locally.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save quota bucket.",
      );
    }
  }

  return (
    <form className="quota-configuration__bucket" onSubmit={submit}>
      <h3>{bucketLabel(quota)}</h3>
      <dl className="quota-configuration__status">
        <div>
          <dt>Filled</dt>
          <dd>{status.filled}</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>{status.remaining}</dd>
        </div>
        <div>
          <dt>Maximum</dt>
          <dd>{status.maximum}</dd>
        </div>
      </dl>
      <label htmlFor={`quota-target-${quota.id}`}>
        Target
        <input
          id={`quota-target-${quota.id}`}
          min="1"
          onChange={(event) => setTarget(event.target.value)}
          type="number"
          value={target}
        />
      </label>
      <label htmlFor={`quota-overbooking-${quota.id}`}>
        Segment overbooking percentage
        <input
          id={`quota-overbooking-${quota.id}`}
          max="100"
          min="0"
          onChange={(event) => setOverbookingPercentage(event.target.value)}
          type="number"
          value={overbookingPercentage}
        />
      </label>
      <button type="submit">Save bucket</button>
      {message !== null ? <p aria-live="polite">{message}</p> : null}
    </form>
  );
}

export default function QuotaConfiguration({
  study,
  quotas,
  participants,
  bookings,
  saveStudy,
  saveQuota,
}: QuotaConfigurationProps) {
  const [defaultOverbooking, setDefaultOverbooking] = useState(() =>
    String(getDefaultOverbookingPercentage(study)),
  );
  const [message, setMessage] = useState<string | null>(null);
  const studyQuotas = quotas.filter((quota) => quota.studyId === study.id);

  async function submitDefault(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveStudy(
        setDefaultOverbookingPercentage(study, defaultOverbooking),
      );
      setMessage("Default overbooking saved locally.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save default overbooking.",
      );
    }
  }

  return (
    <section
      aria-labelledby="quota-configuration-heading"
      className="quota-configuration"
    >
      <header>
        <p>Booking controls</p>
        <h2 id="quota-configuration-heading">Quota configuration</h2>
        <p>
          Bucket conditions use seeded participant profile and screener
          attributes.
        </p>
      </header>
      <form className="quota-configuration__default" onSubmit={submitDefault}>
        <label htmlFor="default-overbooking">
          Default overbooking percentage
          <input
            id="default-overbooking"
            max="100"
            min="0"
            onChange={(event) => setDefaultOverbooking(event.target.value)}
            type="number"
            value={defaultOverbooking}
          />
        </label>
        <button type="submit">Save default</button>
      </form>
      {message !== null ? (
        <p aria-live="polite" className="quota-configuration__message">
          {message}
        </p>
      ) : null}
      <div className="quota-configuration__buckets">
        {studyQuotas.map((quota) => (
          <QuotaBucket
            bookings={bookings}
            key={quota.id}
            participants={participants}
            quota={quota}
            saveQuota={saveQuota}
          />
        ))}
      </div>
    </section>
  );
}
