import type { DemoUser, Identifier } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";

export interface NavigationItem {
  href: string;
  label: string;
}

export type Route =
  | { kind: "overview" }
  | { kind: "localData" }
  | { kind: "reports" }
  | { kind: "facility"; facilityId: Identifier }
  | { kind: "study"; studyId: Identifier }
  | { kind: "unknown" };

export function getRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) return { kind: "overview" };
  if (segments.length === 1 && segments[0] === "local-data") {
    return { kind: "localData" };
  }
  if (segments.length === 1 && segments[0] === "reports") {
    return { kind: "reports" };
  }
  if (segments.length === 2 && segments[0] === "facilities") {
    return { kind: "facility", facilityId: segments[1] };
  }
  if (segments.length === 2 && segments[0] === "studies") {
    return { kind: "study", studyId: segments[1] };
  }

  return { kind: "unknown" };
}

export function isRouteAuthorised(route: Route, actor: DemoUser): boolean {
  if (
    route.kind === "overview" ||
    route.kind === "localData" ||
    route.kind === "reports"
  ) {
    return true;
  }
  if (route.kind === "facility") {
    return actor.authorisedFacilityIds.includes(route.facilityId);
  }
  if (route.kind === "study") {
    return actor.authorisedStudyIds.includes(route.studyId);
  }
  return false;
}

export function getNavigationItems(
  data: DemoFixtures,
  actor: DemoUser,
): NavigationItem[] {
  return [
    { href: "#/", label: "Overview" },
    ...data.facilities
      .filter((facility) => actor.authorisedFacilityIds.includes(facility.id))
      .map((facility) => ({
        href: `#/facilities/${facility.id}`,
        label: facility.name,
      })),
    ...data.studies
      .filter((study) => actor.authorisedStudyIds.includes(study.id))
      .map((study) => ({
        href: `#/studies/${study.id}`,
        label: study.name,
      })),
    { href: "#/reports", label: "Reports and appointments" },
    { href: "#/local-data", label: "Local data" },
  ];
}

export function getActorLabel(actor: DemoUser): string {
  return `${actor.role} (${actor.id.replace("user-", "").replaceAll("-", " ")})`;
}
