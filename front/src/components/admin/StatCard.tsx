import type { ReactNode } from 'react';
import Card from '../common/Card';

interface StatCardProps {
  label: string;
  value: ReactNode;
  isLoading?: boolean;
  caption?: ReactNode;
}

// The panel's one recurring motif — a 2px bg-primary bar across the card's
// top edge, matching AdminPaymentsSection's "Cobrar un plan" card and
// SectionHeader's icon chip — arriving here on every stat tile, summary or
// financial. Shared by ResumenTab's four counts and OwnerAnalyticsPanel's
// two financial tiles so both read as one visual system instead of two.
//
// `isLoading` renders `…`; a `value` of `null`/`undefined` (a failed count,
// per ResumenTab) renders `—` — a failed fetch must never read the same as
// a genuine zero. Callers that always have a value (OwnerAnalyticsPanel's
// tiles) simply omit `isLoading`.
const StatCard = ({ label, value, isLoading = false, caption }: StatCardProps) => (
  <Card className="relative overflow-hidden hover:translate-y-0 hover:shadow-lg">
    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
    <p className="font-body text-sm text-text-muted">{label}</p>
    <p className="mt-2 font-display text-3xl font-bold text-text">
      {isLoading ? '…' : (value ?? '—')}
    </p>
    {caption && <p className="mt-1 text-xs text-text-muted">{caption}</p>}
  </Card>
);

export default StatCard;
