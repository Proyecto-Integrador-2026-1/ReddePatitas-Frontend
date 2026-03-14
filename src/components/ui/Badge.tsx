import { Badge as ShadBadge } from "./shadcn/badge";
export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "success" | "warning" | "neutral";
};

export function Badge(props: BadgeProps) {
  // shadcn uses the same tone names
  return <ShadBadge {...(props as any)} />;
}
