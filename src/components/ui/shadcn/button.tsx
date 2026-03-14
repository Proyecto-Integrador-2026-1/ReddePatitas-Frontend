import React from "react";
import { cn } from "../../../lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-[#020826] text-white hover:bg-[#020826cc] border border-transparent shadow-[0px_10px_25px_rgba(0,0,0,0.25)]",
  outline: "bg-white text-[#020826] border border-[#e5e7eb] hover:bg-[#f6f1e7]",
  ghost: "bg-white/90 text-[#020826] border border-[#e5e7eb] hover:shadow-[0px_10px_25px_rgba(0,0,0,0.15)]",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-14 rounded-[12px] px-6 text-base font-bold",
  sm: "h-12 rounded-[12px] px-5 text-sm font-semibold",
  lg: "h-16 rounded-[16px] px-8 text-lg font-bold",
};

export function Button({
  variant = "default",
  size = "default",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn("inline-flex items-center justify-center transition", variantStyles[variant], sizeStyles[size], className)}
      {...props}
    />
  );
}
