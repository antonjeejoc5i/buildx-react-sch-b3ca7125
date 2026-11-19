import type { DemoUser, Identifier } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";

export type NavigationGroup = "general" | "facilities" | "studies" | "tools";

export interface NavigationItem {
  href: string;
  label: string;
  group: NavigationGroup;
}

export const navigationGroupLabels: Record<NavigationGroup, string> = {
  general: "General",
  facilities: "Facilities",
  studies: "Studies",
  tools: "Demo tools",
};

export type Route =
  | { kind: "overview" }
  | { kind: "localData" }
  | { kind: "reports" }
  | { kind: "outbox" }
  | { kind: "participantPreview" }
  | { kind: "facility"; facilityId: Identifier }
  | { kind: "study"; studyId: Identifier }
  | { kind: "unknown" };

const singleSegmentRoutes: Record<string, Route> = {
  "local-data": { kind: "localData" },
  reports: { kind: "reports" },
  outbox: { kind: "outbox" },
  "participant-preview": { kind: "participantPreview" },
};

export function getRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) return { kind: "overview" };
  if (segments.length === 1 && segments[0] in singleSegmentRoutes) {
    return singleSegmentRoutes[segments[0]];
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
  if (route.kind === "facility") {
    return actor.authorisedFacilityIds.includes(route.facilityId);
  }
  if (route.kind === "study") {
    return actor.authorisedStudyIds.includes(route.studyId);
  }
  return route.kind !== "unknown";
}

export function getNavigationItems(
  data: DemoFixtures,
  actor: DemoUser,
): NavigationItem[] {
  return [
    { href: "#/", label: "Overview", group: "general" },
    { href: "#/reports", label: "Reports and appointments", group: "general" },
    ...data.studies
      .filter((study) => actor.authorisedStudyIds.includes(study.id))
      .map((study) => ({
        href: `#/studies/${study.id}`,
        label: study.name,
        group: "studies" as const,
      })),
    ...data.facilities
      .filter((facility) => actor.authorisedFacilityIds.includes(facility.id))
      .map((facility) => ({
        href: `#/facilities/${facility.id}`,
        label: facility.name,
        group: "facilities" as const,
      })),
    { href: "#/outbox", label: "Notification outbox", group: "tools" },
    {
      href: "#/participant-preview",
      label: "Participant preview",
      group: "tools",
    },
    { href: "#/local-data", label: "Local data", group: "tools" },
  ];
}

export function getActorLabel(actor: DemoUser): string {
  return `${actor.role} (${actor.id.replace("user-", "").replaceAll("-", " ")})`;
}
