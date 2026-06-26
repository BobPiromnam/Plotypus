import type { ReactNode } from "react";

export function ToolbarGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="pt-toolbar-group" aria-label={label}>
      <span className="pt-toolbar-label">{label}</span>
      <div className="pt-toolbar-actions">{children}</div>
    </div>
  );
}
