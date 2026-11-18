import { useEffect, useState } from "react";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import LocalDataControls from "../local-data/LocalDataControls.tsx";
import WelcomeScreen from "../welcome/WelcomeScreen.tsx";
import { useDemoState } from "../demo-state/useDemoState.ts";
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

function RouteContent({ data, route }: { data: DemoFixtures; route: Route }) {
  if (route.kind === "overview") return <WelcomeScreen />;
  if (route.kind === "localData") return <LocalDataControls />;

  if (route.kind === "facility") {
    const facility = data.facilities.find(
      (item) => item.id === route.facilityId,
    );
    return (
      <section aria-labelledby="facility-heading" className="app-shell__detail">
        <p>Facility</p>
        <h1 id="facility-heading">{facility?.name ?? "Unknown facility"}</h1>
        <span>{facility?.timeZone}</span>
      </section>
    );
  }

  if (route.kind === "study") {
    const study = data.studies.find((item) => item.id === route.studyId);
    return (
      <section aria-labelledby="study-heading" className="app-shell__detail">
        <p>Study</p>
        <h1 id="study-heading">{study?.name ?? "Unknown study"}</h1>
        <span>{study?.description}</span>
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

  if (isLoading || data === null || actor === null) {
    return <main className="app-shell__loading">Loading local demo data…</main>;
  }

  if (error !== null) {
    return (
      <main className="app-shell__denial" role="alert">
        <h1>Local data is unavailable</h1>
        <p>{error.message}</p>
      </main>
    );
  }

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
            <RouteContent data={data} route={route} />
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
