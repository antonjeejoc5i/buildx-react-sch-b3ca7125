import type {
  Booking,
  BookingVisit,
  Facility,
  Participant,
  Room,
  Slot,
  Study,
} from "../../domain/models.ts";

export interface ReceptionAppointment {
  bookingVisit: BookingVisit;
  participantName: string;
  studyName: string;
  roomName: string;
  startsAtUtc: string;
}

export interface PlanningFilters {
  facilityId: string;
  startsOn: string;
  endsOn: string;
  studyId: string;
  roomId: string;
}

export interface PlannedAppointment {
  id: string;
  facilityName: string;
  studyName: string;
  roomName: string;
  startsAtUtc: string;
}

function isActiveBooking(booking: Booking | undefined): boolean {
  return booking?.status === "confirmed" || booking?.status === "completed";
}

function timestampDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}

export function getReceptionAppointments(
  authorisedFacilityIds: string[],
  rooms: Room[],
  studies: Study[],
  slots: Slot[],
  bookings: Booking[],
  bookingVisits: BookingVisit[],
  participants: Participant[],
): ReceptionAppointment[] {
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const studiesById = new Map(studies.map((study) => [study.id, study]));
  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const bookingsById = new Map(
    bookings.map((booking) => [booking.id, booking]),
  );
  const participantsById = new Map(
    participants.map((participant) => [participant.id, participant]),
  );

  return bookingVisits
    .flatMap((bookingVisit) => {
      const booking = bookingsById.get(bookingVisit.bookingId);
      const slot = slotsById.get(bookingVisit.slotId);
      const study =
        slot === undefined ? undefined : studiesById.get(slot.studyId);
      const room =
        study === undefined ? undefined : roomsById.get(study.roomId);
      const participant =
        booking === undefined
          ? undefined
          : participantsById.get(booking.participantId);

      if (
        !isActiveBooking(booking) ||
        study === undefined ||
        room === undefined ||
        participant === undefined ||
        !authorisedFacilityIds.includes(room.facilityId)
      ) {
        return [];
      }

      return [
        {
          bookingVisit,
          participantName: participant.name,
          studyName: study.name,
          roomName: room.name,
          startsAtUtc: bookingVisit.startsAtUtc,
        },
      ];
    })
    .sort((left, right) => left.startsAtUtc.localeCompare(right.startsAtUtc));
}

export function checkIn(
  bookingVisit: BookingVisit,
  checkedInAt: string,
): BookingVisit {
  return {
    ...bookingVisit,
    status: "checked-in",
    checkedInAt,
    noShow: false,
  };
}

export function markNoShow(bookingVisit: BookingVisit): BookingVisit {
  return { ...bookingVisit, noShow: true };
}

export function getPlannedAppointments(
  authorisedFacilityIds: string[],
  authorisedStudyIds: string[],
  facilities: Facility[],
  rooms: Room[],
  studies: Study[],
  slots: Slot[],
  filters: PlanningFilters,
): PlannedAppointment[] {
  const facilitiesById = new Map(
    facilities.map((facility) => [facility.id, facility]),
  );
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const studiesById = new Map(studies.map((study) => [study.id, study]));

  return slots
    .flatMap((slot) => {
      const study = studiesById.get(slot.studyId);
      const room =
        study === undefined ? undefined : roomsById.get(study.roomId);
      const facility =
        room === undefined ? undefined : facilitiesById.get(room.facilityId);
      const date = timestampDate(slot.startsAtUtc);

      if (
        study === undefined ||
        room === undefined ||
        facility === undefined ||
        !authorisedFacilityIds.includes(facility.id) ||
        !authorisedStudyIds.includes(study.id) ||
        (filters.facilityId !== "" && filters.facilityId !== facility.id) ||
        (filters.studyId !== "" && filters.studyId !== study.id) ||
        (filters.roomId !== "" && filters.roomId !== room.id) ||
        (filters.startsOn !== "" && date < filters.startsOn) ||
        (filters.endsOn !== "" && date > filters.endsOn)
      ) {
        return [];
      }

      return [
        {
          id: slot.id,
          facilityName: facility.name,
          studyName: study.name,
          roomName: room.name,
          startsAtUtc: slot.startsAtUtc,
        },
      ];
    })
    .sort((left, right) => left.startsAtUtc.localeCompare(right.startsAtUtc));
}
