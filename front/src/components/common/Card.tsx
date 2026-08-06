import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: CardProps) => {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 transition-colors duration-200 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
