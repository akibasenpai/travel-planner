import { createServerClient } from "@/lib/supabase/server";
import type { ScheduleItem, Trip, TripDraft } from "@/lib/types/trip";

type TripRow = {
  id: string;
  title: string;
  description: string;
  schedules: ScheduleItem[];
  created_at: string;
  updated_at: string;
};

function mapRow(row: TripRow): Trip {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    schedules: Array.isArray(row.schedules) ? row.schedules : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getAllTrips(): Promise<Trip[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`しおり一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

export async function getTripById(id: string): Promise<Trip | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`しおりの取得に失敗しました: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

export async function saveTrip(draft: TripDraft): Promise<Trip> {
  const supabase = createServerClient();
  const payload = {
    title: draft.title,
    description: draft.description,
    schedules: draft.schedules,
  };

  if (draft.id) {
    const { data, error } = await supabase
      .from("trips")
      .update(payload)
      .eq("id", draft.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`しおりの更新に失敗しました: ${error.message}`);
    }

    return mapRow(data);
  }

  const { data, error } = await supabase
    .from("trips")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`しおりの保存に失敗しました: ${error.message}`);
  }

  return mapRow(data);
}
