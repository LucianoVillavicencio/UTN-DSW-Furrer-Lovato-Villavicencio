import { Calendar, User as UserIcon, ChevronRight } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import {
  renderCategoryIcon,
  type MasterClassData,
} from './master-classes.data';
import { formatWeekdayList } from '../../lib/weekday';

interface ClassCardItemProps {
  masterCls: MasterClassData;
  // Weekdays taken from the class's published turnos, so the card cannot
  // advertise days the gym does not actually run.
  weekdays: number[];
  hours: string[];
  onPress: (masterCls: MasterClassData) => void;
}

const ClassCardItem = ({
  masterCls,
  weekdays,
  hours,
  onPress,
}: ClassCardItemProps) => {
  return (
    <Card
      onClick={() => onPress(masterCls)}
      className="group relative flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
            {renderCategoryIcon(masterCls.typeClass?.name, 'h-4 w-4')}
            {masterCls.typeClass?.name}
          </span>
          <span className="text-xs font-semibold text-text-muted">
            Duración: 1 hora
          </span>
        </div>

        {/* Class Name */}
        <h3 className="mt-5 text-2xl font-bold text-text group-hover:text-primary transition-colors">
          {masterCls.name}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm text-text-muted leading-relaxed line-clamp-3">
          {masterCls.description}
        </p>

        {/* Instructor & Days info */}
        <div className="mt-6 space-y-2.5 border-t border-border/40 pt-4 text-xs font-medium text-text-muted">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            <span>
              Instructor:{' '}
              <strong className="text-text font-semibold">
                Prof. {masterCls.trainer?.name} {masterCls.trainer?.surname}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              Días de dictado:{' '}
              <strong className="text-text font-semibold">
                {weekdays.length > 0
                  ? formatWeekdayList(weekdays)
                  : 'Sin turnos publicados'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Press Card CTA */}
      <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
        <span className="text-xs font-semibold text-text-muted group-hover:text-text transition-colors">
          {hours.length > 0
            ? `Horarios: ${hours.join(' · ')} hs`
            : 'Todavía sin horarios'}
        </span>
        <Button variant="primary" size="sm" className="gap-1.5 text-xs">
          Ver horarios e inscribirme <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ClassCardItem;
