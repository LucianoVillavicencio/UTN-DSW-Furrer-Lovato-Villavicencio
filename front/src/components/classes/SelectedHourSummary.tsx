import {
  Clock,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import Button from '../common/Button';
import type { AuthUser } from '../../types/user';
import type { ClassHour } from './class-hours';
import { formatTimeOfDay, formatWeekdayList } from '../../lib/weekday';

interface SelectedHourSummaryProps {
  selectedHour: ClassHour;
  isEnrolled: boolean;
  currentUser: AuthUser | null;
  hasActivePlan: boolean;
  actionLoading: boolean;
  onEnroll: (hour: ClassHour) => void;
  onCancel: (hour: ClassHour) => void;
}

const SelectedHourSummary = ({
  selectedHour,
  isEnrolled,
  currentUser,
  hasActivePlan,
  actionLoading,
  onEnroll,
  onCancel,
}: SelectedHourSummaryProps) => {
  const startStr = formatTimeOfDay(selectedHour.startTime);
  const daysStr = formatWeekdayList(selectedHour.weekdays);
  const maxSpots = selectedHour.maxCapacity || 20;
  // The fullest day of the week decides: the enrollment covers all of them.
  const freeSpots = selectedHour.freeSpots;
  const enrolledCount = Math.max(0, maxSpots - freeSpots);
  const occupancyPercent = Math.min(
    100,
    Math.round((enrolledCount / maxSpots) * 100),
  );

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          Resumen del horario elegido
        </span>
        <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full">
          {startStr} hs
        </span>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-text">
        <CalendarDays className="h-4 w-4 text-primary" />
        {daysStr} · todas las semanas
      </p>

      {/* STATS METRICS GRID */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="rounded-xl border border-border bg-background/80 p-3.5">
          <span className="block text-2xl font-extrabold text-primary">
            {enrolledCount}
          </span>
          <span className="text-[11px] font-semibold text-text-muted">
            Usuarios inscriptos
          </span>
        </div>

        <div className="rounded-xl border border-border bg-background/80 p-3.5">
          <span
            className={`block text-2xl font-extrabold ${
              freeSpots === 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {freeSpots}
          </span>
          <span className="text-[11px] font-semibold text-text-muted">
            Cupos disponibles
          </span>
        </div>
      </div>

      {/* OCCUPANCY BAR */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[11px] text-text-muted font-medium">
          <span>Ocupación de la clase</span>
          <span>{occupancyPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-background overflow-hidden border border-border/40">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              occupancyPercent >= 100
                ? 'bg-red-500'
                : occupancyPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="mt-6">
        {currentUser ? (
          isEnrolled ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
                Inscripto: {daysStr} a las {startStr} hs
              </div>
              <Button
                variant="secondary"
                className="w-full text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => onCancel(selectedHour)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelando...' : 'Cancelar mi inscripción'}
              </Button>
            </div>
          ) : !hasActivePlan ? (
            <div className="space-y-2 text-center">
              <Button
                variant="primary"
                href="/membership"
                className="w-full py-3.5 text-base"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ver Planes
              </Button>
              <p className="text-[11px] text-text-muted">
                Necesitás un plan activo para inscribirte a una clase.
              </p>
            </div>
          ) : freeSpots > 0 ? (
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full py-3.5 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30"
                onClick={() => onEnroll(selectedHour)}
                disabled={actionLoading}
              >
                {actionLoading
                  ? 'Inscribiendo...'
                  : `Inscribirme los ${daysStr} a las ${startStr} hs`}
              </Button>
              <p className="text-center text-[11px] text-text-muted">
                Te queda reservado todas las semanas hasta que lo cambies.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              Sin cupos disponibles para este horario
            </div>
          )
        ) : (
          <div className="space-y-2 text-center">
            <a href="/login" className="block w-full">
              <Button variant="primary" className="w-full py-3">
                <UserCheck className="mr-2 h-4 w-4" />
                Iniciar sesión para inscribirme
              </Button>
            </a>
            <p className="text-[11px] text-text-muted">
              Debes tener una cuenta registrada para reservar turnos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedHourSummary;
