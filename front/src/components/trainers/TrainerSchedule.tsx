import { Clock } from 'lucide-react';
import { formatWorkSchedule } from '../../lib/workSchedule';

import type { TrainerWorkShift } from '../../types/trainer';

interface TrainerScheduleProps {
  shifts?: TrainerWorkShift[] | null;
}

const TrainerSchedule = ({ shifts }: TrainerScheduleProps) => {
  const lines = formatWorkSchedule(shifts);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-text">Horario de atención</p>
      {lines.map((line) => (
        <span
          key={line}
          className="flex items-center gap-2 text-xs text-text-muted"
        >
          <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
          {line}
        </span>
      ))}
    </div>
  );
};

export default TrainerSchedule;
