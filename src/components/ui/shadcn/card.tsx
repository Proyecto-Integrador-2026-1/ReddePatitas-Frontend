import React from "react";
import { cn } from "../../../lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  shadow?: "md" | "lg" | "none";
};

const shadowStyles: Record<CardProps["shadow"], string> = {
  md: "shadow-[0px_10px_25px_rgba(0,0,0,0.15)]",
  lg: "shadow-[0px_25px_50px_rgba(0,0,0,0.25)]",
  none: "shadow-none",
};

export function Card({ shadow = "md", className = "", ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-[24px] bg-white", shadowStyles[shadow], "border border-[#e5e7eb]", className)}
      {...props}
    />
  );
}
