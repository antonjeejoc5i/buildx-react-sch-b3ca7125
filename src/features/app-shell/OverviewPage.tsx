import type { DemoUser } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import WelcomeScreen from "../welcome/WelcomeScreen.tsx";

interface OverviewPageProps {
  actor: DemoUser;
  data: DemoFixtures;
}

export default function OverviewPage({ actor, data }: OverviewPageProps) {
  const studies = data.studies.filter((study) =>
    actor.authorisedStudyIds.includes(study.id),
  );
  const facilities = data.facilities.filter((facility) =>
    actor.authorisedFacilityIds.includes(facility.id),
  );
  const openStudies = studies.filter(
    (study) => study.lifecycleStatus === "open",
  );

  return (
    <div className="app-shell__page">
      <WelcomeScreen />
      <div className="app-shell__card-grid">
        <section
          aria-labelledby="overview-studies-heading"
          className="app-shell__panel"
        >
          <h2 id="overview-studies-heading">Studies</h2>
          {studies.length === 0 ? (
            <p className="app-shell__empty">
              No studies are in this actor&apos;s simulated scope.
            </p>
          ) : (
            <ul className="app-shell__link-list">
              {studies.map((study) => (
                <li key={study.id}>
                  <a
                    aria-label={`Open study: ${study.name}`}
                    href={`#/studies/${study.id}`}
                  >
                    {study.name}
                  </a>
                  <span
                    className={`app-shell__badge app-shell__badge--${study.lifecycleStatus === "open" ? "success" : "neutral"}`}
                  >
                    {study.lifecycleStatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section
          aria-labelledby="overview-facilities-heading"
          className="app-shell__panel"
        >
          <h2 id="overview-facilities-heading">Facilities</h2>
          {facilities.length === 0 ? (
            <p className="app-shell__empty">
              No facilities are in this actor&apos;s simulated scope.
            </p>
          ) : (
            <ul className="app-shell__link-list">
              {facilities.map((facility) => (
                <li key={facility.id}>
                  <a
                    aria-label={`Open facility: ${facility.name}`}
                    href={`#/facilities/${facility.id}`}
                  >
                    {facility.name}
                  </a>
                  <span className="app-shell__muted">{facility.timeZone}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section
        aria-labelledby="overview-handoff-heading"
        className="app-shell__panel"
      >
        <h2 id="overview-handoff-heading">Simulate a Decipher handoff</h2>
        <p className="app-shell__muted">
          Opens the participant booking page as if the participant had just
          finished the screener. No Decipher or Kinesis calls are made.
        </p>
        {openStudies.length === 0 ? (
          <p className="app-shell__empty">
            Open a study for booking to simulate a participant handoff.
          </p>
        ) : (
          openStudies.map((study) => (
            <div className="app-shell__handoff-group" key={study.id}>
              <h3>{study.name}</h3>
              <ul className="app-shell__link-list">
                {data.participants.map((participant) => (
                  <li key={participant.id}>
                    <a
                      href={`#/handoff/${study.decipherProjectId}/${participant.id}`}
                    >
                      Continue as {participant.name}
                    </a>
                    <span className="app-shell__muted">
                      Screener: {participant.qualificationState} ·{" "}
                      {participant.language} · {participant.timeZone}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
