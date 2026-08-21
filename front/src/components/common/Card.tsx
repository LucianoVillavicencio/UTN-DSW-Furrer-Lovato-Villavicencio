import type { MouseEventHandler, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const Card = ({ children, className = '', onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-border bg-surface p-6 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
