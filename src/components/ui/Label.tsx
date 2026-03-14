import { Label as ShadLabel } from "./shadcn/label";
export type LabelProps = React.ComponentProps<typeof ShadLabel>;
export function Label(props: LabelProps) {
  return <ShadLabel {...props} />;
}
