import { User as UserIcon, X, Info } from 'lucide-react';
import FormAlert from '../common/FormAlert';
import {
  renderCategoryIcon,
  type MasterClassData,
} from './master-classes.data';
import ClassDaySelector from './ClassDaySelector';
import ClassHourGrid from './ClassHourGrid';
import SelectedHourSummary from './SelectedHourSummary';

import type { ClassSession } from '../../types/classSession';
import type { AuthUser } from '../../types/user';

interface ClassExpandedModalProps {
  activeExpandedClass: MasterClassData | null;
  onClose: () => void;
  selectedDayOffset: number;
  setSelectedDayOffset: (offset: number) => void;
  sessionsForActiveExpandedDay: ClassSession[];
  selectedSession: ClassSession | null;
  setSelectedSession: (session: ClassSession | null) => void;
  isEnrolledInSession: (sessionId?: number) => boolean;
  handleEnrollSession: (session: ClassSession) => void;
  handleCancelSession: (session: ClassSession) => void;
  currentUser: AuthUser | null;
  actionLoading: boolean;
  actionFeedback: { type: 'success' | 'error'; message: string } | null;
}

const ClassExpandedModal = ({
  activeExpandedClass,
  onClose,
  selectedDayOffset,
  setSelectedDayOffset,
  sessionsForActiveExpandedDay,
  selectedSession,
  setSelectedSession,
  isEnrolledInSession,
  handleEnrollSession,
  handleCancelSession,
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

        {/* EXPANDED EXPLANATION OF DAYS & SCHEDULES */}
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-primary">
                Detalle y Días de Dictado
              </h4>
              <p className="mt-1 text-xs text-text leading-relaxed">
                {activeExpandedClass.scheduleExplanation}
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

        {/* DAY SELECTION TABS */}
        <ClassDaySelector
          selectedDayOffset={selectedDayOffset}
          onSelectDay={(offset) => {
            setSelectedDayOffset(offset);
            setSelectedSession(null);
          }}
        />

        {/* ALL HOURS SELECTION GRID FOR SELECTED DAY */}
        <ClassHourGrid
          sessionsForActiveExpandedDay={sessionsForActiveExpandedDay}
          selectedSession={selectedSession}
          onSelectHour={(t) => setSelectedSession(t)}
          isEnrolledInSession={isEnrolledInSession}
        />

        {/* SELECTED HOUR SUMMARY & ENROLL ACTION */}
        {selectedSession && (
          <SelectedHourSummary
            selectedSession={selectedSession}
            isEnrolled={isEnrolledInSession(selectedSession.id)}
            currentUser={currentUser}
            actionLoading={actionLoading}
            onEnroll={handleEnrollSession}
            onCancel={handleCancelSession}
          />
        )}
      </div>
    </div>
  );
};

export default ClassExpandedModal;
