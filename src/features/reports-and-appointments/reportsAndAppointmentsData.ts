import type {
  Booking,
  BookingVisit,
  DemoUser,
  Facility,
  Room,
  Slot,
  Study,
} from "../../domain/models.ts";
import type { DemoFixtures } from "../../fixtures/demoFixtures.ts";
import { buildRecruitmentDashboardData } from "../recruitment-dashboard/recruitmentDashboardData.ts";

export const LOCAL_REPORT_DISCLOSURE =
  "Exports and calculations use local demonstration data only.";

export interface AppointmentFilters {
  facilityId: string;
  researcherId: string;
  startsOn: string;
  endsOn: string;
  studyId: string;
}

export interface UpcomingAppointment {
  facilityName: string;
  id: string;
  participantName: string;
  researcherName: string;
  roomName: string;
  startsAtUtc: string;
  studyName: string;
}

export interface ScopedReportRecord {
  booked: number;
  capacity: number;
  cancellations: number;
  noShows: number;
  scheduledParticipants: number;
  studyName: string;
}

function isActiveBooking(booking: Booking | undefined): boolean {
  return booking?.status === "confirmed" || booking?.status === "completed";
}

function localDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}

function researcherForStudy(
  study: Study,
  users: DemoUser[],
): DemoUser | undefined {
  return users.find(
    (user) =>
      user.role === "researcher" && user.authorisedStudyIds.includes(study.id),
  );
}

export function getScopedStudies(actor: DemoUser, studies: Study[]): Study[] {
  return studies.filter((study) => actor.authorisedStudyIds.includes(study.id));
}

export function getUpcomingAppointments(
  actor: DemoUser,
  data: Pick<
    DemoFixtures,
    | "bookingVisits"
    | "bookings"
    | "demoUsers"
    | "facilities"
    | "participants"
    | "rooms"
    | "slots"
    | "studies"
  >,
  filters: AppointmentFilters,
  now: Date,
): UpcomingAppointment[] {
  const facilitiesById = new Map(
    data.facilities.map((facility) => [facility.id, facility]),
  );
  const participantsById = new Map(
    data.participants.map((participant) => [participant.id, participant]),
  );
  const roomsById = new Map(data.rooms.map((room) => [room.id, room]));
  const slotsById = new Map(data.slots.map((slot) => [slot.id, slot]));
  const studiesById = new Map(data.studies.map((study) => [study.id, study]));
  const bookingsById = new Map(
    data.bookings.map((booking) => [booking.id, booking]),
  );

  return data.bookingVisits
    .flatMap((bookingVisit) => {
      const booking = bookingsById.get(bookingVisit.bookingId);
      const participant =
        booking === undefined
          ? undefined
          : participantsById.get(booking.participantId);
      const slot = slotsById.get(bookingVisit.slotId);
      const study =
        slot === undefined ? undefined : studiesById.get(slot.studyId);
      const room =
        study === undefined ? undefined : roomsById.get(study.roomId);
      const facility =
        room === undefined ? undefined : facilitiesById.get(room.facilityId);
      const researcher =
        study === undefined
          ? undefined
          : researcherForStudy(study, data.demoUsers);
      const startsAt = new Date(bookingVisit.startsAtUtc).getTime();
      const date = localDate(bookingVisit.startsAtUtc);

      if (
        !isActiveBooking(booking) ||
        bookingVisit.status === "cancelled" ||
        participant === undefined ||
        study === undefined ||
        room === undefined ||
        facility === undefined ||
        !Number.isFinite(startsAt) ||
        startsAt <= now.getTime() ||
        !actor.authorisedStudyIds.includes(study.id) ||
        !actor.authorisedFacilityIds.includes(facility.id) ||
        (filters.facilityId !== "" && filters.facilityId !== facility.id) ||
        (filters.studyId !== "" && filters.studyId !== study.id) ||
        (filters.researcherId !== "" &&
          filters.researcherId !== researcher?.id) ||
        (filters.startsOn !== "" && date < filters.startsOn) ||
        (filters.endsOn !== "" && date > filters.endsOn)
      ) {
        return [];
      }

      return [
        {
          facilityName: facility.name,
          id: bookingVisit.id,
          participantName: participant.name,
          researcherName:
            researcher === undefined ? "Unassigned" : researcher.role,
          roomName: room.name,
          startsAtUtc: bookingVisit.startsAtUtc,
          studyName: study.name,
        },
      ];
    })
    .sort((left, right) => left.startsAtUtc.localeCompare(right.startsAtUtc));
}

export function getScopedReportRecords(
  actor: DemoUser,
  data: Pick<
    DemoFixtures,
    | "bookingVisits"
    | "bookings"
    | "participants"
    | "quotas"
    | "slots"
    | "studies"
  >,
  studyId: string,
): ScopedReportRecord[] {
  return getScopedStudies(actor, data.studies)
    .filter((study) => studyId === "" || study.id === studyId)
    .map((study) => {
      const dashboard = buildRecruitmentDashboardData(
        study,
        data.quotas,
        data.slots,
        data.bookings,
        data.bookingVisits,
        data.participants,
      );
      return {
        booked: dashboard.scheduledSlots,
        cancellations: dashboard.cancellations,
        capacity: dashboard.slots.reduce(
          (total, slot) => total + slot.capacity,
          0,
        ),
        noShows: dashboard.noShows,
        scheduledParticipants: dashboard.scheduledParticipants,
        studyName: study.name,
      };
    });
}

function escapeCsvValue(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number>>,
): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");
}

export function appointmentCsv(appointments: UpcomingAppointment[]): string {
  return buildCsv(
    ["When (UTC)", "Participant", "Study", "Facility", "Room", "Researcher"],
    appointments.map((appointment) => [
      appointment.startsAtUtc,
      appointment.participantName,
      appointment.studyName,
      appointment.facilityName,
      appointment.roomName,
      appointment.researcherName,
    ]),
  );
}

export function reportCsv(records: ScopedReportRecord[]): string {
  return buildCsv(
    [
      "Study",
      "Scheduled participants",
      "Scheduled slots",
      "Slot capacity",
      "Cancellations",
      "No-shows",
    ],
    records.map((record) => [
      record.studyName,
      record.scheduledParticipants,
      record.booked,
      record.capacity,
      record.cancellations,
      record.noShows,
    ]),
  );
}

export function getScopedFacilities(
  actor: DemoUser,
  facilities: Facility[],
): Facility[] {
  return facilities.filter((facility) =>
    actor.authorisedFacilityIds.includes(facility.id),
  );
}

export function getScopedResearchers(
  actor: DemoUser,
  users: DemoUser[],
): DemoUser[] {
  return users.filter(
    (user) =>
      user.role === "researcher" &&
      user.authorisedStudyIds.some((studyId) =>
        actor.authorisedStudyIds.includes(studyId),
      ),
  );
}

export function getScopedRooms(actor: DemoUser, rooms: Room[]): Room[] {
  return rooms.filter((room) =>
    actor.authorisedFacilityIds.includes(room.facilityId),
  );
}

export function getScopedSlots(actor: DemoUser, slots: Slot[]): Slot[] {
  return slots.filter((slot) =>
    actor.authorisedStudyIds.includes(slot.studyId),
  );
}

export function getScopedBookings(
  actor: DemoUser,
  bookings: Booking[],
): Booking[] {
  return bookings.filter((booking) =>
    actor.authorisedStudyIds.includes(booking.studyId),
  );
}

export function getScopedBookingVisits(
  actor: DemoUser,
  bookingVisits: BookingVisit[],
  bookings: Booking[],
): BookingVisit[] {
  const scopedBookingIds = new Set(
    getScopedBookings(actor, bookings).map((booking) => booking.id),
  );
  return bookingVisits.filter((visit) => scopedBookingIds.has(visit.bookingId));
}

export function getScopedRoomsForFacility(
  facilityId: string,
  rooms: Room[],
): Room[] {
  return rooms.filter((room) => room.facilityId === facilityId);
}

export function getScopedSlotsForStudy(studyId: string, slots: Slot[]): Slot[] {
  return slots.filter((slot) => slot.studyId === studyId);
}
