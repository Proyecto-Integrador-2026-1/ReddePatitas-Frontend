import React from "react";
import { Button as ShadButton } from "./shadcn/button";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = "solid", size = "md", ...props }: ButtonProps) {
  // map our variant/size to shadcn equivalents
  const mapVariant = variant === "solid" ? "default" : variant;
  const mapSize = size === "md" ? "default" : size;
  return <ShadButton variant={mapVariant as any} size={mapSize as any} {...props} />;
}
