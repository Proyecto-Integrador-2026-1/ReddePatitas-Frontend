import React from "react";
import { cn } from "../../../lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning";
};

const toneStyles: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-[#f9f4ef] text-[#716040]",
  success: "bg-[#dcfce7] text-[#0f5132]",
  warning: "bg-[#fef3c7] text-[#92400e]",
};

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", toneStyles[tone], className)} {...props} />
  );
}
