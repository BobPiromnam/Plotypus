import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type ButtonVariant = "default" | "primary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName;
  iconOnly?: boolean;
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({ children, className = "", icon, iconOnly = false, variant = "default", ...props }: ButtonProps) {
  const classes = [
    "pt-button",
    `pt-button-${variant}`,
    iconOnly ? "pt-button-icon-only" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} type="button" {...props}>
      {icon ? <Icon name={icon} /> : null}
      <span className={iconOnly ? "visually-hidden" : undefined}>{children}</span>
    </button>
  );
}
