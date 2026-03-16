import React from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "solid" | "outline" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<NonNullable<"default" | "outline" | "ghost" | "link">, string> = {
  default:
    "bg-[#020826] text-white hover:bg-[#020826cc] border border-transparent shadow-[0px_10px_25px_rgba(0,0,0,0.25)]",
  outline: "bg-white text-[#020826] border border-[#e5e7eb] hover:bg-[#f6f1e7]",
  ghost: "bg-white/90 text-[#020826] border border-[#e5e7eb] hover:shadow-[0px_10px_25px_rgba(0,0,0,0.15)]",
  link: "bg-transparent text-[#020826] underline-offset-2 hover:underline",
};

const sizeStyles: Record<NonNullable<"default" | "sm" | "lg">, string> = {
  default: "h-14 rounded-[12px] px-6 text-base font-bold",
  sm: "h-12 rounded-[12px] px-5 text-sm font-semibold",
  lg: "h-16 rounded-[16px] px-8 text-lg font-bold",
};

export function Button({ variant = "solid", size = "md", className = "", ...props }: ButtonProps) {
  // map our legacy API to the new style keys
  const mapVariant = variant === "solid" ? "default" : (variant === "link" ? "link" : variant);
  const mapSize = size === "md" ? "default" : size;
  // map types
  const v = mapVariant as "default" | "outline" | "ghost" | "link";
  const s = mapSize as "default" | "sm" | "lg";
  return (
    <button className={cn("inline-flex items-center justify-center transition", variantStyles[v], sizeStyles[s], className)} {...props} />
  );
}
