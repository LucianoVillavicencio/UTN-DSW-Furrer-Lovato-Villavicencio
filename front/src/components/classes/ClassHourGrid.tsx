import { CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import type { ClassSession } from '../../types/classSession';

interface ClassHourGridProps {
  sessionsForActiveExpandedDay: ClassSession[];
  selectedSession: ClassSession | null;
  onSelectHour: (session: ClassSession) => void;
  isEnrolledInSession: (sessionId?: number) => boolean;
}

const ClassHourGrid = ({
  sessionsForActiveExpandedDay,
  selectedSession,
  onSelectHour,
  isEnrolledInSession,
}: ClassHourGridProps) => {
  return (
    <div className="mt-6">
      <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
        <span>2. Selecciona la Hora (Todas las horas disponibles):</span>
        <span className="text-primary font-semibold text-[11px] bg-primary/10 px-2.5 py-0.5 rounded-full">
          {sessionsForActiveExpandedDay.length}{' '}
          {sessionsForActiveExpandedDay.length === 1 ? 'turno' : 'turnos'}
        </span>
      </label>

      {sessionsForActiveExpandedDay.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-background/50 p-8 text-center text-xs text-text-muted">
          No hay sessions programados para el día seleccionado. Elige otro día
          arriba.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sessionsForActiveExpandedDay.map((t) => {
            const startDate = new Date(t.dateTime);
            const endDate = new Date(startDate.getTime() + 3600000); // 1 hr class

            const startStr = startDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endStr = endDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const maxSpots = t.maxCapacity || 20;
            const freeSpots = t.availableSpots ?? maxSpots;
            const enrolledCount = Math.max(0, maxSpots - freeSpots);

            const isSelected = selectedSession?.id === t.id;
            const isEnrolled = isEnrolledInSession(t.id);

            // Dynamic badge color logic
            let badgeClass =
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            let statusText = `${freeSpots} libres`;
            if (isEnrolled) {
              badgeClass = 'bg-primary/15 text-primary border-primary/30';
              statusText = 'Inscripto';
            } else if (freeSpots === 0) {
              badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
              statusText = 'Lleno';
            } else if (freeSpots <= 3) {
              badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              statusText = `¡Últimos ${freeSpots}!`;
            }

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectHour(t)}
                className={`group relative flex flex-col justify-between min-h-[96px] rounded-2xl p-3.5 text-left transition-all duration-200 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'border-2 border-primary bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/10'
                    : 'border border-border bg-background hover:border-primary/50 hover:bg-surface/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-text tracking-tight">
                    {startStr} - {endStr} hs
                  </span>
                  {isEnrolled ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : freeSpots <= 3 && freeSpots > 0 ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  ) : null}
                </div>

                {/* CAPACITY BADGE & ENROLLED METRICS */}
                <div className="mt-3 space-y-1 border-t border-border/40 pt-2 text-[10px]">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-text-muted/70" />
                      Inscriptos:
                    </span>
                    <strong className="text-text font-bold">
                      {enrolledCount}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${badgeClass}`}
                    >
                      {statusText}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassHourGrid;
