import React from "react";

export type ChipProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  icon?: React.ReactNode;
};

export function Chip({ active = false, icon, className = "", children, ...props }: ChipProps) {
  const base = "rounded-full px-4 py-1.5 text-sm font-semibold inline-flex items-center gap-2 border shadow-sm";
  const activeClasses = active
    ? "bg-[#020826] text-white border-transparent"
    : "bg-white border-[#e5e7eb] text-[#716040]";

  return (
    <div className={`${base} ${activeClasses} ${className}`} {...props}>
      {icon}
      <span>{children}</span>
    </div>
  );
}
