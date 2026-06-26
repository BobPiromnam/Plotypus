import type { ButtonHTMLAttributes } from "react";
import { Button } from "./Button";
import type { IconName } from "./Icon";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  label: string;
};

export function IconButton({ icon, label, ...props }: IconButtonProps) {
  return (
    <Button icon={icon} iconOnly aria-label={label} title={label} {...props}>
      {label}
    </Button>
  );
}
