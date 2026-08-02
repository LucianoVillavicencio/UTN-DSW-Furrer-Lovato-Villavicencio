
// Container where the maximum screen width is defined

import type { ReactNode } from "react";


//Props accepted by the `children` component
interface ContainerProps {
  children: ReactNode;
  className?: string;
}

const Container = ({ children, className = "" }: ContainerProps) => {
  return (
    <div
      className={`mx-auto w-full max-w-360 px-4 sm:px-6 lg:px-8 ${className}`}  
    >
      {children}
    </div>
  );
};

export default Container;
