import { useEffect, useState } from "react";
import type { DemoUser } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { useDemoState } from "../demo-state/useDemoState.ts";
import FacilityManagement from "../facility-management/FacilityManagement.tsx";
import FacilityPlanning from "../facility-operations/FacilityPlanning.tsx";
import ReceptionOperations from "../facility-operations/ReceptionOperations.tsx";
import LocalDataControls from "../local-data/LocalDataControls.tsx";
import NotificationOutbox from "../notification-outbox/NotificationOutbox.tsx";
import ParticipantPresentationPanel from "../participant-presentation/ParticipantPresentationPanel.tsx";
import ReportsAndAppointments from "../reports-and-appointments/ReportsAndAppointments.tsx";
import ActorProvider from "./ActorProvider.tsx";
import DemoModeBadge from "./DemoModeBadge.tsx";
import OverviewPage from "./OverviewPage.tsx";
import {
  getActorLabel,
  getNavigationItems,
  getRoute,
  isRouteAuthorised,
  navigationGroupLabels,
} from "./routes.ts";
import type { NavigationGroup, Route } from "./routes.ts";
import StudyWorkspace from "./StudyWorkspace.tsx";
import { useCurrentActor } from "./useCurrentActor.ts";
import "./AppShell.css";

function DeniedRoute() {
  return (
    <section
      aria-labelledby="access-denied-heading"
      className="app-shell__denial"
      role="alert"
    >
      <h1 id="access-denied-heading">Access denied</h1>
      <p>
        This route is outside the selected demo actor&apos;s simulated facility
        or study scope.
      </p>
      <a href="#/">Return to overview</a>
    </section>
  );
}

function RouteContent({
  actor,
  data,
  route,
}: {
  actor: DemoUser;
  data: DemoFixtures;
  route: Route;
}) {
  const { saveBookingParticipation, saveFacility, saveRoom } = useDemoState();
  if (route.kind === "overview")
    return <OverviewPage actor={actor} data={data} />;
  if (route.kind === "localData") return <LocalDataControls />;
  if (route.kind === "outbox")
    return (
      <div className="app-shell__panel">
        <NotificationOutbox />
      </div>
    );
  if (route.kind === "participantPreview")
    return (
      <div className="app-shell__panel">
        <ParticipantPresentationPanel />
      </div>
    );
  if (route.kind === "reports")
    return <ReportsAndAppointments actor={actor} data={data} />;
  if (route.kind === "facility") {
    const facility = data.facilities.find(
      (item) => item.id === route.facilityId,
    );
    if (facility === undefined) return <DeniedRoute />;
    return (
      <div className="app-shell__page">
        <FacilityManagement
          demoUsers={data.demoUsers}
          facility={facility}
          rooms={data.rooms.filter((room) => room.facilityId === facility.id)}
          saveFacility={saveFacility}
          saveRoom={saveRoom}
        />
        <div className="app-shell__panel">
          <ReceptionOperations
            authorisedFacilityIds={actor.authorisedFacilityIds}
            bookingVisits={data.bookingVisits}
            bookings={data.bookings}
            participants={data.participants}
            rooms={data.rooms}
            saveBookingVisit={async (bookingVisit) => {
              const booking = data.bookings.find(
                (item) => item.id === bookingVisit.bookingId,
              );
              if (booking === undefined)
                throw new Error("The appointment booking is unavailable.");
              await saveBookingParticipation(booking, [bookingVisit]);
            }}
            slots={data.slots}
            studies={data.studies}
          />
        </div>
        <div className="app-shell__panel">
          <FacilityPlanning
            authorisedFacilityIds={actor.authorisedFacilityIds}
            authorisedStudyIds={actor.authorisedStudyIds}
            facilities={data.facilities}
            rooms={data.rooms}
            slots={data.slots}
            studies={data.studies}
          />
        </div>
      </div>
    );
  }
  if (route.kind === "study") {
    const study = data.studies.find((item) => item.id === route.studyId);
    if (study === undefined) return <DeniedRoute />;
    return <StudyWorkspace actor={actor} data={data} study={study} />;
  }
  return <DeniedRoute />;
}

function ScopedContent() {
  const { data, error, isLoading } = useDemoState();
  const { actor, selectActor } = useCurrentActor();
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  if ((isLoading && data === null) || actor === null)
    return <main className="app-shell__loading">Loading local demo data…</main>;
  if (error !== null)
    return (
      <main className="app-shell__denial" role="alert">
        <h1>Local data is unavailable</h1>
        <p>{error.message}</p>
      </main>
    );
  if (data === null)
    return (
      <main className="app-shell__denial" role="alert">
        <h1>Local data is unavailable</h1>
        <p>Local demo data could not be loaded.</p>
      </main>
    );

  const route = getRoute(hash);
  const navigationItems = getNavigationItems(data, actor);
  const activeHref = `#${hash.replace(/^#/, "") || "/"}`;
  const groups = Object.keys(navigationGroupLabels) as NavigationGroup[];

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand-group">
          <a className="app-shell__brand" href="#/">
            Study scheduling
          </a>
          <DemoModeBadge />
        </div>
        <label className="app-shell__actor-label" htmlFor="demo-actor">
          Simulated local actor
          <select
            id="demo-actor"
            onChange={(event) => selectActor(event.target.value)}
            value={actor.id}
          >
            {data.demoUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {getActorLabel(user)}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="app-shell__body">
        <nav
          aria-label="Application navigation"
          className="app-shell__navigation"
        >
          <p className="app-shell__actor-summary">
            Acting as <strong>{getActorLabel(actor)}</strong>
          </p>
          {groups.map((group) => {
            const items = navigationItems.filter(
              (item) => item.group === group,
            );
            if (items.length === 0) return null;
            return (
              <div className="app-shell__nav-group" key={group}>
                {group === "general" ? null : (
                  <p className="app-shell__nav-group-label">
                    {navigationGroupLabels[group]}
                  </p>
                )}
                <ul>
                  {items.map((item) => (
                    <li key={item.href}>
                      <a
                        aria-current={
                          activeHref === item.href ? "page" : undefined
                        }
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <main className="app-shell__content">
          {isRouteAuthorised(route, actor) ? (
            <RouteContent actor={actor} data={data} route={route} />
          ) : (
            <DeniedRoute />
          )}
        </main>
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <ActorProvider>
      <ScopedContent />
    </ActorProvider>
  );
}
