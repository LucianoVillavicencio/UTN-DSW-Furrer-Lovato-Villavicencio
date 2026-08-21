interface ClassDaySelectorProps {
  selectedDayOffset: number;
  onSelectDay: (offset: number) => void;
}

const ClassDaySelector = ({
  selectedDayOffset,
  onSelectDay,
}: ClassDaySelectorProps) => {
  return (
    <div className="mt-6">
      <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
        1. Selecciona el Día:
      </label>

      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x">
        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const dateObj = new Date();
          dateObj.setDate(dateObj.getDate() + offset);

          // Skip Sunday (gym closed)
          if (dateObj.getDay() === 0) return null;

          const dayName = dateObj.toLocaleDateString('es-ES', {
            weekday: 'short',
          });
          const dayNumStr = dateObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
          });
          const isSelectedDay = selectedDayOffset === offset;

          return (
            <button
              key={offset}
              type="button"
              onClick={() => onSelectDay(offset)}
              className={`snap-start flex flex-col items-center justify-center min-w-[76px] rounded-xl px-4 py-2.5 text-xs transition-all duration-200 active:scale-95 cursor-pointer ${
                isSelectedDay
                  ? 'bg-primary text-background font-bold shadow-md shadow-primary/20 ring-2 ring-primary'
                  : 'bg-background border border-border text-text-muted hover:text-text hover:border-primary/50'
              }`}
            >
              <span className="capitalize text-[11px] font-semibold">
                {dayName}
              </span>
              <span className="font-extrabold text-sm mt-0.5">{dayNumStr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ClassDaySelector;
