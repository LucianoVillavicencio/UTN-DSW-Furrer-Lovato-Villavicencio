import { classOptionKey, type ClassOption } from './useClassOptions';
import { formatTimeOfDay, formatWeekdayList } from '../../lib/weekday';

interface ClassHourSelectProps {
  options: ClassOption[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
}

const ClassHourSelect = ({
  options,
  value,
  onChange,
  disabled,
}: ClassHourSelectProps) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    aria-label="Clase y horario"
    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text disabled:opacity-50"
  >
    <option value="">Elegir clase y horario...</option>
    {options.map((o) => (
      <option key={classOptionKey(o)} value={classOptionKey(o)}>
        {o.className} — {formatWeekdayList(o.weekdays)}{' '}
        {formatTimeOfDay(o.startTime)} hs
      </option>
    ))}
  </select>
);

export default ClassHourSelect;
