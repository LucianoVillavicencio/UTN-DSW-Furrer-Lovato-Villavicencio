import { CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import type { ClassHour } from './class-hours';
import { formatTimeOfDay, formatWeekdayList } from '../../lib/weekday';

interface ClassHourGridProps {
  hours: ClassHour[];
  selectedHour: ClassHour | null;
  onSelectHour: (hour: ClassHour) => void;
  isEnrolledInHour: (hour: ClassHour | null) => boolean;
}

const ClassHourGrid = ({
  hours,
  selectedHour,
  onSelectHour,
  isEnrolledInHour,
}: ClassHourGridProps) => {
  return (
    <div className="mt-6">
      <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
        <span>Elegí tu horario semanal:</span>
        <span className="text-primary font-semibold text-[11px] bg-primary/10 px-2.5 py-0.5 rounded-full">
          {hours.length} {hours.length === 1 ? 'horario' : 'horarios'}
        </span>
      </label>

      {hours.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-background/50 p-8 text-center text-xs text-text-muted">
          Todavía no hay turnos publicados para esta clase. Volvé a consultar
          más adelante.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {hours.map((hour) => {
            const startStr = formatTimeOfDay(hour.startTime);
            const enrolledCount = Math.max(
              0,
              hour.maxCapacity - hour.freeSpots,
            );

            const isSelected = selectedHour?.startTime === hour.startTime;
            const isEnrolled = isEnrolledInHour(hour);

            // Dynamic badge color logic
            let badgeClass =
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            let statusText = `${hour.freeSpots} libres`;
            if (isEnrolled) {
              badgeClass = 'bg-primary/15 text-primary border-primary/30';
              statusText = 'Inscripto';
            } else if (hour.freeSpots === 0) {
              badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
              statusText = 'Lleno';
            } else if (hour.freeSpots <= 3) {
              badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              statusText = `¡Últimos ${hour.freeSpots}!`;
            }

            return (
              <button
                key={hour.startTime}
                type="button"
                onClick={() => onSelectHour(hour)}
                className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/40'
                    : 'border-border bg-background/60 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-extrabold text-text">
                    {startStr} hs
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                  >
                    {statusText}
                  </span>
                </div>

                <span className="text-xs font-semibold text-text-muted">
                  {formatWeekdayList(hour.weekdays)} · todas las semanas
                </span>

                <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  {isEnrolled ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  ) : hour.freeSpots === 0 ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <Users className="h-3.5 w-3.5" />
                  )}
                  {enrolledCount} / {hour.maxCapacity} inscriptos
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassHourGrid;
