import { useEffect, useState } from 'react';
import Card from '../common/Card';
import { getPlans } from '../../services/plan.service';
import { getClass } from '../../services/class.service';
import { getTrainers } from '../../services/trainer.service';
import { getUsers } from '../../services/user.service';
import OwnerAnalyticsPanel from './OwnerAnalyticsPanel';

interface Stats {
  plans: number | null;
  classes: number | null;
  trainers: number | null;
  members: number | null;
}

interface StatCardProps {
  label: string;
  value: number | null;
  isLoading: boolean;
}

// Shows `…` while loading, `—` for a failed count and the number otherwise —
// a failed fetch must never read the same as a genuine zero.
const StatCard = ({ label, value, isLoading }: StatCardProps) => (
  <Card className="hover:translate-y-0 hover:shadow-lg">
    <p className="font-body text-sm text-text-muted">{label}</p>
    <p className="mt-2 font-display text-3xl font-bold text-text">
      {isLoading ? '…' : (value ?? '—')}
    </p>
  </Card>
);

const ResumenTab = () => {
  const [stats, setStats] = useState<Stats>({
    plans: null,
    classes: null,
    trainers: null,
    members: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Every setState lives in an async callback, so the effect below only starts
  // the requests instead of updating state while React renders.
  useEffect(() => {
    void Promise.allSettled([getPlans(), getClass(), getTrainers(), getUsers()]).then(
      ([plansRes, classesRes, trainersRes, usersRes]) => {
        // A failed count renders an em dash, not 0: zero plans and "the
        // request failed" are different facts and used to look identical.
        const countOr = <T,>(
          result: PromiseSettledResult<T[]>,
          what: string,
          map: (rows: T[]) => number = (rows) => rows.length,
        ): number | null => {
          if (result.status === 'fulfilled') return map(result.value);
          console.warn(`Could not load ${what} for the admin summary`, result.reason);
          return null;
        };

        setStats({
          plans: countOr(plansRes, 'plans'),
          classes: countOr(classesRes, 'classes'),
          trainers: countOr(trainersRes, 'trainers'),
          // Only members: findAll() returns admins too, and a card labelled
          // "Socios" that silently counts the staff logins is wrong.
          members: countOr(usersRes, 'users', (users) =>
            users.filter((u) => u.role === 'user').length,
          ),
        });
        setIsLoading(false);
      },
    );
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Socios" value={stats.members} isLoading={isLoading} />
        <StatCard label="Planes activos" value={stats.plans} isLoading={isLoading} />
        <StatCard label="Clases" value={stats.classes} isLoading={isLoading} />
        <StatCard label="Entrenadores" value={stats.trainers} isLoading={isLoading} />
      </div>

      <OwnerAnalyticsPanel />
    </div>
  );
};

export default ResumenTab;
