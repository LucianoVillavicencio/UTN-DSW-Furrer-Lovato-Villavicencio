import { User as UserIcon, X, Info } from "lucide-react";
import FormAlert from "../common/FormAlert";
import { renderCategoryIcon, type MasterClassData } from "./master-classes.data";
import ClassDaySelector from "./ClassDaySelector";
import ClassHourGrid from "./ClassHourGrid";
import SelectedHourSummary from "./SelectedHourSummary";

import type { TurnoClase } from "../../types/turno-clase";
import type { User } from "../../types/user";

interface ClassExpandedModalProps {
  activeExpandedClass: MasterClassData | null;
  onClose: () => void;
  selectedDayOffset: number;
  setSelectedDayOffset: (offset: number) => void;
  turnosForActiveExpandedDay: TurnoClase[];
  selectedHourTurno: TurnoClase | null;
  setSelectedHourTurno: (turno: TurnoClase | null) => void;
  isEnrolledInTurno: (turnoId?: number) => boolean;
  handleEnrollTurno: (turno: TurnoClase) => void;
  handleCancelTurno: (turno: TurnoClase) => void;
  currentUser: User | null;
  actionLoading: boolean;
  actionFeedback: { type: "success" | "error"; message: string } | null;
}

const ClassExpandedModal = ({
  activeExpandedClass,
  onClose,
  selectedDayOffset,
  setSelectedDayOffset,
  turnosForActiveExpandedDay,
  selectedHourTurno,
  setSelectedHourTurno,
  isEnrolledInTurno,
  handleEnrollTurno,
  handleCancelTurno,
  currentUser,
  actionLoading,
  actionFeedback,
}: ClassExpandedModalProps) => {
  if (!activeExpandedClass) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-text-muted hover:bg-background hover:text-text transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Class Header */}
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            {renderCategoryIcon(activeExpandedClass.tipoClase?.nombre, "h-7 w-7")}
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {activeExpandedClass.tipoClase?.nombre}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
              {activeExpandedClass.nombre}
            </h2>
          </div>
        </div>

        {/* Instructor info */}
        <p className="mt-3 text-xs font-semibold text-text-muted flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-primary" /> Prof.{" "}
          {activeExpandedClass.profesor?.nombre} {activeExpandedClass.profesor?.apellido}
        </p>

        {/* EXPANDED EXPLANATION OF DAYS & SCHEDULES */}
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-primary">Detalle y Días de Dictado</h4>
              <p className="mt-1 text-xs text-text leading-relaxed">
                {activeExpandedClass.explicacionDias}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback alert */}
        {actionFeedback && (
          <div className="mt-4">
            <FormAlert type={actionFeedback.type} message={actionFeedback.message} />
          </div>
        )}

        {/* DAY SELECTION TABS */}
        <ClassDaySelector
          selectedDayOffset={selectedDayOffset}
          onSelectDay={(offset) => {
            setSelectedDayOffset(offset);
            setSelectedHourTurno(null);
          }}
        />

        {/* ALL HOURS SELECTION GRID FOR SELECTED DAY */}
        <ClassHourGrid
          turnosForActiveExpandedDay={turnosForActiveExpandedDay}
          selectedHourTurno={selectedHourTurno}
          onSelectHour={(t) => setSelectedHourTurno(t)}
          isEnrolledInTurno={isEnrolledInTurno}
        />

        {/* SELECTED HOUR SUMMARY & ENROLL ACTION */}
        {selectedHourTurno && (
          <SelectedHourSummary
            selectedHourTurno={selectedHourTurno}
            isEnrolled={isEnrolledInTurno(selectedHourTurno.id)}
            currentUser={currentUser}
            actionLoading={actionLoading}
            onEnroll={handleEnrollTurno}
            onCancel={handleCancelTurno}
          />
        )}
      </div>
    </div>
  );
};

export default ClassExpandedModal;
