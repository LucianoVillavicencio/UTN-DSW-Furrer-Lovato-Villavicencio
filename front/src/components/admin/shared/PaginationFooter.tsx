// "Mostrando X-Y de Z" line with Anterior/Siguiente buttons, shown under the
// paginated admin tables. Purely presentational: the payments history drives
// it from a server offset, classes/turnos/trainers from usePagination.

import Button from '../../common/Button';

interface PaginationFooterProps {
  from: number;
  to: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const PaginationFooter = ({
  from,
  to,
  total,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: PaginationFooterProps) => (
  <div className="mt-3 flex items-center justify-between">
    <p className="text-xs text-text-muted">
      Mostrando {from}-{to} de {total}
    </p>
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        Anterior
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasNext}
        onClick={onNext}
      >
        Siguiente
      </Button>
    </div>
  </div>
);

export default PaginationFooter;
