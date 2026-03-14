import React from "react";
import { cn } from "../../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
};

export function Input({ icon, className = "", ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#716040]">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "w-full rounded-[12px] border border-[#eaddcf] bg-[#f9f5f0]/60 px-4 py-3 text-sm text-[#020826] placeholder:text-[#b7a888] focus:border-[#8c7851] focus:outline-none focus:ring-2 focus:ring-[#f6f1e7]",
          icon ? "pl-12" : "",
          className
        )}
        {...props}
      />
    </div>
  );
}
