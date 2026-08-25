import type { ClassSession } from '../../types/classSession';

// What a member actually picks: a class at an hour, which covers every weekday
// that class runs at that hour ("Funcional 08:00" → Mon, Wed and Fri). The
// turnos behind it stay separate rows because capacity is physical and counted
// per day.
export interface ClassHour {
  classId: number;
  // 'HH:MM:SS', as stored.
  startTime: string;
  sessions: ClassSession[];
  weekdays: number[];
  // The tightest day decides: a member enrolls in all of them at once, so the
  // fullest day is what can block the enrollment.
  freeSpots: number;
  maxCapacity: number;
}

const sessionClassId = (session: ClassSession) =>
  session.classId ?? session.class?.id;

/**
 * Groups a class's weekly turnos by hour, in chronological order.
 */
export function groupSessionsByHour(
  sessions: ClassSession[],
  classId: number,
): ClassHour[] {
  const byTime = new Map<string, ClassSession[]>();

  for (const session of sessions) {
    if (sessionClassId(session) !== classId) continue;
    const key = session.startTime;
    byTime.set(key, [...(byTime.get(key) ?? []), session]);
  }

  return [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([startTime, group]) => {
      const ordered = [...group].sort((a, b) => a.weekday - b.weekday);
      return {
        classId,
        startTime,
        sessions: ordered,
        weekdays: ordered.map((s) => s.weekday),
        freeSpots: Math.min(
          ...ordered.map((s) => s.availableSpots ?? s.maxCapacity),
        ),
        maxCapacity: Math.min(...ordered.map((s) => s.maxCapacity)),
      };
    });
}
