import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

type Origin = "editable" | "automatic";

function originIcon(origin: Origin): IconName {
  return origin === "editable" ? "pencil" : "wand";
}

export function TableHeaderCell({
  children,
  origin,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { children: ReactNode; origin: Origin }) {
  return (
    <th {...props}>
      <span className="pt-table-heading">
        {children}
        <span className={`pt-origin-icon pt-origin-${origin}`} aria-label={origin}>
          <Icon name={originIcon(origin)} />
        </span>
      </span>
    </th>
  );
}

export function TableCell({ children, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return <td {...props}>{children}</td>;
}
