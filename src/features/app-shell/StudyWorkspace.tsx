import type { ReactNode } from "react";
import type { DemoUser, Study } from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import ConfirmationTemplateEditor from "../booking-confirmation/ConfirmationTemplateEditor.tsx";
import BulkBookingOperations from "../bulk-booking-operations/BulkBookingOperations.tsx";
import { useDemoState } from "../demo-state/useDemoState.ts";
import NotificationOutbox from "../notification-outbox/NotificationOutbox.tsx";
import QuotaConfiguration from "../quota-configuration/QuotaConfiguration.tsx";
import ReportingMetrics from "../reporting-metrics/ReportingMetrics.tsx";
import ScheduleCopyTemplates from "../schedule-copy-templates/ScheduleCopyTemplates.tsx";
import ScheduleOverrides from "../schedule-overrides/ScheduleOverrides.tsx";
import SlotManagement from "../slot-management/SlotManagement.tsx";
import StudyEditor from "../study-editor/StudyEditor.tsx";

interface StudyWorkspaceProps {
  actor: DemoUser;
  data: DemoFixtures;
  study: Study;
}

const sections = [
  { id: "study-section-setup", label: "Setup" },
  { id: "study-section-schedule", label: "Schedule" },
  { id: "study-section-quotas", label: "Quotas" },
  { id: "study-section-slots", label: "Slots" },
  { id: "study-section-bookings", label: "Bookings" },
  { id: "study-section-notifications", label: "Notifications" },
  { id: "study-section-reporting", label: "Reporting" },
] as const;

type SectionId = (typeof sections)[number]["id"];

function Panel({ id, children }: { id: SectionId; children: ReactNode }) {
  return (
    <div className="app-shell__panel app-shell__panel--stacked" id={id}>
      {children}
    </div>
  );
}

/** Hash routing owns the URL fragment, so section links scroll instead of changing the hash. */
function scrollToSection(id: SectionId) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function StudyWorkspace({
  actor,
  data,
  study,
}: StudyWorkspaceProps) {
  const {
    saveBulkBookingOperation,
    saveQuota,
    saveScheduleOverride,
    saveSchedulePattern,
    saveScheduleTemplate,
    saveSlot,
    saveStudy,
  } = useDemoState();
  const facility = data.facilities.find((item) => item.id === study.facilityId);
  const room = data.rooms.find((item) => item.id === study.roomId);
  const pattern = data.schedulePatterns.find(
    (item) => item.studyId === study.id,
  );

  return (
    <section aria-labelledby="study-heading" className="app-shell__page">
      <header className="app-shell__page-header">
        <p className="app-shell__eyebrow">Study</p>
        <h1 id="study-heading">{study.name}</h1>
        <p className="app-shell__lede">{study.description}</p>
        <dl className="app-shell__facts">
          <div>
            <dt>Status</dt>
            <dd>
              <span
                className={`app-shell__badge app-shell__badge--${study.lifecycleStatus === "open" ? "success" : "neutral"}`}
              >
                {study.lifecycleStatus}
              </span>
            </dd>
          </div>
          <div>
            <dt>Decipher project (simulated)</dt>
            <dd>{study.decipherProjectId}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>
              {facility?.name ?? "No facility"}
              {room === undefined ? "" : ` · ${room.name}`}
            </dd>
          </div>
          <div>
            <dt>Visits</dt>
            <dd>{study.visits.length}</dd>
          </div>
        </dl>
      </header>
      <nav aria-label="Study sections" className="app-shell__section-nav">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>
      <Panel id="study-section-setup">
        <StudyEditor
          facilities={data.facilities}
          rooms={data.rooms}
          saveStudy={saveStudy}
          study={study}
        />
      </Panel>
      <Panel id="study-section-schedule">
        {facility === undefined || pattern === undefined ? (
          <p className="app-shell__empty">
            This study has no recurring schedule pattern yet. Copy one from an
            existing study or apply a template below.
          </p>
        ) : (
          <ScheduleOverrides
            bookingVisits={data.bookingVisits}
            bookings={data.bookings}
            facility={facility}
            overrides={data.scheduleOverrides}
            participants={data.participants}
            pattern={pattern}
            saveOverride={saveScheduleOverride}
            slots={data.slots}
          />
        )}
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
      </Panel>
      <Panel id="study-section-quotas">
        <QuotaConfiguration
          bookings={data.bookings}
          participants={data.participants}
          quotas={data.quotas}
          saveQuota={saveQuota}
          saveStudy={saveStudy}
          study={study}
        />
      </Panel>
      <Panel id="study-section-slots">
        <SlotManagement
          bookingVisits={data.bookingVisits}
          bookings={data.bookings}
          saveSlot={saveSlot}
          slots={data.slots}
          study={study}
          waitlistEntries={data.waitlistEntries}
        />
      </Panel>
      <Panel id="study-section-bookings">
        <BulkBookingOperations
          actor={actor}
          data={data}
          saveBulkBookingOperation={saveBulkBookingOperation}
          study={study}
        />
      </Panel>
      <Panel id="study-section-notifications">
        <ConfirmationTemplateEditor saveStudy={saveStudy} study={study} />
        <NotificationOutbox />
      </Panel>
      <Panel id="study-section-reporting">
        <ReportingMetrics
          bookingVisits={data.bookingVisits}
          bookings={data.bookings}
          participants={data.participants}
          quotas={data.quotas}
          slots={data.slots}
          study={study}
        />
      </Panel>
    </section>
  );
}
