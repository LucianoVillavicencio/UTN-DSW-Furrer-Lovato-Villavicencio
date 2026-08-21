import { Calendar } from 'lucide-react';
import Container from '../common/Container';
import Button from '../common/Button';

import FormAlert from '../common/FormAlert';
import ClassFilterBar from './ClassFilterBar';
import ClassCardItem from './ClassCardItem';
import ClassExpandedModal from './ClassExpandedModal';
import { useClassEnrollment } from './useClassEnrollment';

const ClassEnrollmentSection = () => {
  const {
    isLoading,
    loadError,
    classTypes,
    selectedTypeId,
    setSelectedTypeId,
    searchQuery,
    setSearchQuery,
    filteredMasterClasses,
    activeExpandedClass,
    setActiveExpandedClass,
    selectedDayOffset,
    setSelectedDayOffset,
    sessionsForActiveExpandedDay,
    activeClassHasSessions,
    selectedSession,
    setSelectedSession,
    isEnrolledInSession,
    hasActivePlan,
    handleEnrollSession,
    handleCancelSession,
    currentUser,
    actionLoading,
    actionFeedback,
    setActionFeedback,
  } = useClassEnrollment();

  return (
    <section id="clases-programacion" className="bg-background py-12">
      <Container>
        {/* Filter Bar Component */}
        <ClassFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTypeId={selectedTypeId}
          setSelectedTypeId={setSelectedTypeId}
          classTypes={classTypes}
        />

        {/* Catalogue request failed */}
        {loadError && (
          <div className="mb-8">
            <FormAlert type="error" message={loadError} />
          </div>
        )}

        {/* STAGE 1: INITIAL CLASS CARDS GRID */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm font-medium text-text-muted">
                Cargando catálogo de clases...
              </p>
            </div>
          </div>
        ) : filteredMasterClasses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/40 py-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-text-muted/50" />
            <h3 className="mt-4 text-lg font-semibold text-text">
              No se encontraron clases
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Prueba modificando la búsqueda o el filtro de disciplina.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSelectedTypeId('ALL');
                setSearchQuery('');
              }}
            >
              Restablecer filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredMasterClasses.map((masterCls) => (
              <ClassCardItem
                key={masterCls.id}
                masterCls={masterCls}
                onPress={(cls) => {
                  setActiveExpandedClass(cls);
                  setSelectedDayOffset(0);
                  setSelectedSession(null);
                  setActionFeedback(null);
                }}
              />
            ))}
          </div>
        )}

        {/* STAGE 2: EXPANDED MODAL VIEW ON PRESSING A CLASS */}
        <ClassExpandedModal
          activeExpandedClass={activeExpandedClass}
          onClose={() => {
            setActiveExpandedClass(null);
            setSelectedSession(null);
            setActionFeedback(null);
          }}
          selectedDayOffset={selectedDayOffset}
          setSelectedDayOffset={setSelectedDayOffset}
          sessionsForActiveExpandedDay={sessionsForActiveExpandedDay}
          activeClassHasSessions={activeClassHasSessions}
          selectedSession={selectedSession}
          setSelectedSession={setSelectedSession}
          isEnrolledInSession={isEnrolledInSession}
          hasActivePlan={hasActivePlan}
          handleEnrollSession={handleEnrollSession}
          handleCancelSession={handleCancelSession}
          currentUser={currentUser}
          actionLoading={actionLoading}
          actionFeedback={actionFeedback}
        />
      </Container>
    </section>
  );
};

export default ClassEnrollmentSection;
