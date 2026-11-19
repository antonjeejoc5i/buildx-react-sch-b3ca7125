import { useEffect, useState } from "react";
import type { DemoUser } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import BulkBookingOperations from "../bulk-booking-operations/BulkBookingOperations.tsx";
import { useDemoState } from "../demo-state/useDemoState.ts";
import FacilityManagement from "../facility-management/FacilityManagement.tsx";
import ReceptionOperations from "../facility-operations/ReceptionOperations.tsx";
import LocalDataControls from "../local-data/LocalDataControls.tsx";
import QuotaConfiguration from "../quota-configuration/QuotaConfiguration.tsx";
import ReportingMetrics from "../reporting-metrics/ReportingMetrics.tsx";
import ReportsAndAppointments from "../reports-and-appointments/ReportsAndAppointments.tsx";
import ScheduleCopyTemplates from "../schedule-copy-templates/ScheduleCopyTemplates.tsx";
import SlotManagement from "../slot-management/SlotManagement.tsx";
import WelcomeScreen from "../welcome/WelcomeScreen.tsx";
import ActorProvider from "./ActorProvider.tsx";
import {
  getActorLabel,
  getNavigationItems,
  getRoute,
  isRouteAuthorised,
} from "./routes.ts";
import type { Route } from "./routes.ts";
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
  const {
    saveBookingParticipation,
    saveBulkBookingOperation,
    saveFacility,
    saveQuota,
    saveRoom,
    saveStudy,
    saveScheduleOverride,
    saveSchedulePattern,
    saveScheduleTemplate,
    saveSlot,
  } = useDemoState();
  if (route.kind === "overview") return <WelcomeScreen />;
  if (route.kind === "localData") return <LocalDataControls />;
  if (route.kind === "reports")
    return <ReportsAndAppointments actor={actor} data={data} />;
  if (route.kind === "facility") {
    const facility = data.facilities.find(
      (item) => item.id === route.facilityId,
    );
    if (facility === undefined) return <DeniedRoute />;
    return (
      <>
        <FacilityManagement
          demoUsers={data.demoUsers}
          facility={facility}
          rooms={data.rooms.filter((room) => room.facilityId === facility.id)}
          saveFacility={saveFacility}
          saveRoom={saveRoom}
        />
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
      </>
    );
  }
  if (route.kind === "study") {
    const study = data.studies.find((item) => item.id === route.studyId);
    if (study === undefined) return <DeniedRoute />;
    return (
      <section aria-labelledby="study-heading" className="app-shell__detail">
        <p>Study</p>
        <h1 id="study-heading">{study.name}</h1>
        <span>{study.description}</span>
        <QuotaConfiguration
          bookings={data.bookings}
          participants={data.participants}
          quotas={data.quotas}
          saveQuota={saveQuota}
          saveStudy={saveStudy}
          study={study}
        />
        <SlotManagement
          bookingVisits={data.bookingVisits}
          bookings={data.bookings}
          saveSlot={saveSlot}
          slots={data.slots}
          study={study}
          waitlistEntries={data.waitlistEntries}
        />
        <BulkBookingOperations
          actor={actor}
          data={data}
          saveBulkBookingOperation={saveBulkBookingOperation}
          study={study}
        />
        <ReportingMetrics
          bookingVisits={data.bookingVisits}
          bookings={data.bookings}
          participants={data.participants}
          quotas={data.quotas}
          slots={data.slots}
          study={study}
        />
        <ScheduleCopyTemplates
          facilities={data.facilities}
          overrides={data.scheduleOverrides}
          patterns={data.schedulePatterns}
          saveOverride={saveScheduleOverride}
          savePattern={saveSchedulePattern}
          saveTemplate={saveScheduleTemplate}
          studies={data.studies}
          study={study}
          templates={data.scheduleTemplates}
        />
      </section>
    );
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

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <a className="app-shell__brand" href="#/">
          Study scheduling
        </a>
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
          <ul>
            {navigationItems.map((item) => (
              <li key={item.href}>
                <a
                  aria-current={activeHref === item.href ? "page" : undefined}
                  href={item.href}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
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
