export type ScheduleItem = {
  datetime: string;
  location: string;
  map_url: string;
  activity: string;
};

export type Trip = {
  id: string;
  title: string;
  description: string;
  schedules: ScheduleItem[];
  created_at: string;
  updated_at?: string;
};

export type TripDraft = {
  id?: string;
  title: string;
  description: string;
  schedules: ScheduleItem[];
};

export function createEmptySchedule(): ScheduleItem {
  return {
    datetime: "",
    location: "",
    map_url: "",
    activity: "",
  };
}

export function createEmptyDraft(): TripDraft {
  return {
    title: "",
    description: "",
    schedules: [createEmptySchedule()],
  };
}

export function tripToDraft(trip: Trip): TripDraft {
  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    schedules:
      trip.schedules.length > 0
        ? trip.schedules
        : [createEmptySchedule()],
  };
}
