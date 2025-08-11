import React from "react";

type HeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export function Heading({ children, className = "" }: HeadingProps) {
  return <h2 className={`heading font-semibold ${className}`}>{children}</h2>;
}
