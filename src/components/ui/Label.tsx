import React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  children: React.ReactNode;
};

export function Label({ className = "", ...props }: LabelProps) {
  return <label className={`block text-sm font-semibold text-[#020826] ${className}`} {...props} />;
}
