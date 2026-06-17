import Link from "next/link";
import type { Trip } from "@/lib/types/trip";
import { formatDatetimeDisplay } from "@/lib/utils/datetime";

type TripCardProps = {
  trip: Trip;
};

export function TripCard({ trip }: TripCardProps) {
  const scheduleCount = trip.schedules.length;
  const firstSchedule = trip.schedules[0];

  return (
    <Link
      href={`/trip/${trip.id}`}
      className="block overflow-hidden rounded-2xl border border-primary/30 bg-white shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-[0.99]"
    >
      <div className="h-1.5 bg-primary" />
      <div className="p-4">
        <h2 className="text-base font-bold text-stone-800">
          {trip.title || "無題のしおり"}
        </h2>
        {trip.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-stone-500">
            {trip.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span className="rounded-full bg-primary-light px-2 py-0.5 font-medium text-primary-dark">
            {scheduleCount} 件の行程
          </span>
          {firstSchedule?.datetime ? (
            <span>{formatDatetimeDisplay(firstSchedule.datetime)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
