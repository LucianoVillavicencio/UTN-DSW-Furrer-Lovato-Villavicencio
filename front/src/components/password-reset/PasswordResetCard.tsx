import type { ReactNode } from 'react';
import { KeyRound } from 'lucide-react';
import Container from '../common/Container';
import Card from '../common/Card';

interface PasswordResetCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const PasswordResetCard = ({
  title,
  subtitle,
  children,
}: PasswordResetCardProps) => {
  return (
    <Container className="py-6 sm:py-12">
      <div className="mx-auto max-w-md">
        <Card className="border-border/90 bg-surface p-6 shadow-xl sm:p-10">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 font-body text-sm text-text-muted">{subtitle}</p>
          </div>
          {children}
        </Card>
      </div>
    </Container>
  );
};

export default PasswordResetCard;
