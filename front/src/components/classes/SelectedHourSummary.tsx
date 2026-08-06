import { Clock, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";
import Button from "../common/Button";
import type { TurnoClase } from "../../types/turno-clase";
import type { User } from "../../types/user";

interface SelectedHourSummaryProps {
  selectedHourTurno: TurnoClase;
  isEnrolled: boolean;
  currentUser: User | null;
  actionLoading: boolean;
  onEnroll: (turno: TurnoClase) => void;
  onCancel: (turno: TurnoClase) => void;
}

const SelectedHourSummary = ({
  selectedHourTurno,
  isEnrolled,
  currentUser,
  actionLoading,
  onEnroll,
  onCancel,
}: SelectedHourSummaryProps) => {
  const startStr = new Date(selectedHourTurno.fechaHora).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const cupoMax = selectedHourTurno.cupoMaximo || 20;
  const cupoDispon = selectedHourTurno.cupoDisponible ?? cupoMax;
  const inscritosCount = Math.max(0, cupoMax - cupoDispon);
  const occupancyPercent = Math.min(100, Math.round((inscritosCount / cupoMax) * 100));

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          Resumen del Horario Seleccionado
        </span>
        <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full">
          {startStr} hs
        </span>
      </div>

      {/* STATS METRICS GRID */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="rounded-xl border border-border bg-background/80 p-3.5">
          <span className="block text-2xl font-extrabold text-primary">
            {inscritosCount}
          </span>
          <span className="text-[11px] font-semibold text-text-muted">
            Usuarios inscriptos
          </span>
        </div>

        <div className="rounded-xl border border-border bg-background/80 p-3.5">
          <span
            className={`block text-2xl font-extrabold ${
              cupoDispon === 0 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {cupoDispon}
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
                ? "bg-red-500"
                : occupancyPercent >= 80
                ? "bg-amber-500"
                : "bg-emerald-500"
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
                Inscripto en esta clase ({startStr} hs)
              </div>
              <Button
                variant="secondary"
                className="w-full text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => onCancel(selectedHourTurno)}
                disabled={actionLoading}
              >
                {actionLoading ? "Cancelando..." : "Cancelar mi inscripción"}
              </Button>
            </div>
          ) : cupoDispon > 0 ? (
            <Button
              variant="primary"
              className="w-full py-3.5 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30"
              onClick={() => onEnroll(selectedHourTurno)}
              disabled={actionLoading}
            >
              {actionLoading
                ? "Inscribiendo..."
                : `Inscribirme a las ${startStr} hs`}
            </Button>
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
