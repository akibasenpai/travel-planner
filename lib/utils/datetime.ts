const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type ParsedDatetime = {
  date: string;
  time: string;
};

export function parseDatetime(datetime: string): ParsedDatetime {
  if (!datetime) {
    return { date: "", time: "" };
  }

  const isoMatch = datetime.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
  if (isoMatch) {
    return { date: isoMatch[1], time: isoMatch[2] };
  }

  const dateOnlyMatch = datetime.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnlyMatch) {
    return { date: dateOnlyMatch[1], time: "" };
  }

  const timeOnlyMatch = datetime.match(/^(\d{2}:\d{2})$/);
  if (timeOnlyMatch) {
    return { date: "", time: timeOnlyMatch[1] };
  }

  return { date: "", time: "" };
}

export function combineDatetime(date: string, time: string): string {
  if (date && time) {
    return `${date} ${time}`;
  }
  if (date) {
    return date;
  }
  return time;
}

export function formatDatetimeDisplay(datetime: string): string {
  if (!datetime) {
    return "";
  }

  const { date, time } = parseDatetime(datetime);
  if (!date) {
    return datetime;
  }

  const parsed = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(parsed.getTime())) {
    return datetime;
  }

  const weekday = WEEKDAYS[parsed.getDay()];
  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  const dateLabel = `${parsed.getFullYear()}年${month}月${day}日(${weekday})`;

  return time ? `${dateLabel} ${time}` : dateLabel;
}

export function isStructuredDatetime(datetime: string): boolean {
  return parseDatetime(datetime).date !== "";
}
