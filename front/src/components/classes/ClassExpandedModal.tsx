import { User as UserIcon, X, Info, CalendarDays } from 'lucide-react';
import FormAlert from '../common/FormAlert';
import {
  renderCategoryIcon,
  type MasterClassData,
} from './master-classes.data';
import ClassHourGrid from './ClassHourGrid';
import SelectedHourSummary from './SelectedHourSummary';

import type { ClassHour } from './class-hours';
import { formatWeekdayList } from '../../lib/weekday';
import type { AuthUser } from '../../types/user';
import type { MyEnrollments } from '../../types/classRegistration';

interface ClassExpandedModalProps {
  activeExpandedClass: MasterClassData | null;
  onClose: () => void;
  hoursForActiveClass: ClassHour[];
  selectedHour: ClassHour | null;
  setSelectedHour: (hour: ClassHour | null) => void;
  isEnrolledInHour: (hour: ClassHour | null) => boolean;
  hasActivePlan: boolean;
  myEnrollments: MyEnrollments | null;
  isAtAllowance: boolean;
  handleEnrollHour: (hour: ClassHour) => void;
  handleChangeToHour: (hour: ClassHour) => void;
  handleCancelHour: (hour: ClassHour) => void;
  currentUser: AuthUser | null;
  actionLoading: boolean;
  actionFeedback: { type: 'success' | 'error'; message: string } | null;
}

const ClassExpandedModal = ({
  activeExpandedClass,
  onClose,
  hoursForActiveClass,
  selectedHour,
  setSelectedHour,
  isEnrolledInHour,
  hasActivePlan,
  myEnrollments,
  isAtAllowance,
  handleEnrollHour,
  handleChangeToHour,
  handleCancelHour,
  currentUser,
  actionLoading,
  actionFeedback,
}: ClassExpandedModalProps) => {
  if (!activeExpandedClass) return null;

  // The days this class runs, taken from its published turnos rather than from
  // presentation text.
  const weekdays = [...new Set(hoursForActiveClass.flatMap((h) => h.weekdays))];

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
            {renderCategoryIcon(activeExpandedClass.typeClass?.name, 'h-7 w-7')}
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {activeExpandedClass.typeClass?.name}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
              {activeExpandedClass.name}
            </h2>
          </div>
        </div>

        {/* Instructor info */}
        <p className="mt-3 text-xs font-semibold text-text-muted flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-primary" /> Prof.{' '}
          {activeExpandedClass.trainer?.name}{' '}
          {activeExpandedClass.trainer?.surname}
        </p>

        {/* WEEKLY SCHEDULE OF THIS CLASS */}
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-primary">
                Cómo funciona la inscripción
              </h4>
              <p className="mt-1 text-xs text-text leading-relaxed">
                {activeExpandedClass.description}
              </p>
              {weekdays.length > 0 && (
                <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-text">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Se dicta los {formatWeekdayList(weekdays)}, todas las semanas.
                </p>
              )}
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                Elegís un horario una sola vez y ese lugar queda reservado
                semana a semana, en todos los días en que se dicta la clase.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback alert */}
        {actionFeedback && (
          <div className="mt-4">
            <FormAlert
              type={actionFeedback.type}
              message={actionFeedback.message}
            />
          </div>
        )}

        {/* WEEKLY HOURS */}
        <ClassHourGrid
          hours={hoursForActiveClass}
          selectedHour={selectedHour}
          onSelectHour={setSelectedHour}
          isEnrolledInHour={isEnrolledInHour}
        />

        {/* SELECTED HOUR SUMMARY & ENROLL ACTION */}
        {selectedHour && (
          <SelectedHourSummary
            selectedHour={selectedHour}
            isEnrolled={isEnrolledInHour(selectedHour)}
            hasActivePlan={hasActivePlan}
            myEnrollments={myEnrollments}
            isAtAllowance={isAtAllowance}
            currentUser={currentUser}
            actionLoading={actionLoading}
            onEnroll={handleEnrollHour}
            onChange={handleChangeToHour}
            onCancel={handleCancelHour}
          />
        )}
      </div>
    </div>
  );
};

export default ClassExpandedModal;
