import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: CardProps) => {
  return (
    <div
      className = {`rounded-2xl border border-border bg-surface p-5 transition-colors duration-200 hover:bg-surface-hover  hover:border-primary-hover/40 hover:shadow-[0_0_25px_rgba(34,197,94,0.12)] group ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
