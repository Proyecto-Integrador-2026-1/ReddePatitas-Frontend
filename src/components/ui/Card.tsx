import React from "react";
import { Card as ShadCard } from "./shadcn/card";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  accent?: "gold" | "neutral" | "ghost";
};

export function Card({ accent = "neutral", className = "", ...props }: CardProps) {
  // Map accent to shadow variants and pass through
  const shadow = accent === "gold" ? "lg" : "md";
  return <ShadCard shadow={shadow} className={className} {...props} />;
}
