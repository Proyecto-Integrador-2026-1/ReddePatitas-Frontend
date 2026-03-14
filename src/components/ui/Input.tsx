import { Input as ShadInput } from "./shadcn/input";
export type InputProps = React.ComponentProps<typeof ShadInput>;
export function Input(props: InputProps) {
  return <ShadInput {...props} />;
}
