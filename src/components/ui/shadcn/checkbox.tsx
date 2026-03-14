import React from "react";
import { cn } from "../../../lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={cn("flex items-center gap-3 text-sm text-[#716040]", className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-[#e5e7eb] text-[#020826] focus:ring-[#8c7851]"
        {...props}
      />
      {label}
    </label>
  );
}
