import { Checkbox as ShadCheckbox } from "./shadcn/checkbox";
export type CheckboxProps = React.ComponentProps<typeof ShadCheckbox>;
export function Checkbox(props: CheckboxProps) {
  return <ShadCheckbox {...props} />;
}
