export type ScheduleItem = {
  datetime: string;
  departure_datetime?: string; // ▼ 追加：出発時間を保存するための新しい枠
  location: string;
  map_url: string;
  activity: string;
  lat?: number;
  lng?: number;
  travel_mode?: "driving" | "walking" | "transit";
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
    departure_datetime: "", // ▼ 追加：新規作成時は空っぽで用意する
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