import type { ReactNode } from "react";
import { Icon, type IconName } from "../../components/primitives";

export type PropertiesPanelSection = {
  actions?: ReactNode;
  children: ReactNode;
  title: string;
};

export type PropertiesPanelShellProps = {
  collapsed?: boolean;
  contextIcon?: IconName;
  contextKind: string;
  copy?: Partial<PropertiesPanelShellCopy>;
  guidance: string;
  onCollapse?: () => void;
  sections: PropertiesPanelSection[];
  subtitle: string;
  title: string;
};

export type PropertiesPanelShellCopy = {
  ariaLabel: string;
  collapse: string;
  expand: string;
  eyebrow: string;
};

const defaultCopy: PropertiesPanelShellCopy = {
  ariaLabel: "Properties panel",
  collapse: "Collapse properties",
  expand: "Expand properties",
  eyebrow: "Properties"
};

export function PropertiesPanelShell({
  collapsed = false,
  contextIcon = "sliders",
  contextKind,
  copy: copyOverrides,
  guidance,
  onCollapse,
  sections,
  subtitle,
  title
}: PropertiesPanelShellProps) {
  const copy = { ...defaultCopy, ...copyOverrides };

  if (collapsed) {
    return (
      <aside className="properties-shell properties-shell-collapsed" aria-label={copy.ariaLabel}>
        <button type="button" className="properties-shell-rail-button" onClick={onCollapse} aria-label={copy.expand}>
          <span>{copy.eyebrow}</span>
          <span aria-hidden="true">&gt;</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="properties-shell" aria-label={copy.ariaLabel}>
      <header className="properties-shell-header">
        <span>{copy.eyebrow}</span>
        <button type="button" aria-label={copy.collapse} onClick={onCollapse}>
          &gt;
        </button>
      </header>

      <div className="properties-shell-context">
        <span className="properties-shell-icon" aria-hidden="true">
          <Icon name={contextIcon} />
        </span>
        <div>
          <p className="properties-shell-kind">{contextKind}</p>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <p className="properties-shell-guidance">{guidance}</p>

      {sections.map((section) => {
        const sectionId = `properties-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

        return (
        <section className="properties-shell-section" key={section.title} aria-labelledby={sectionId}>
          <div className="properties-shell-section-heading">
            <h3 id={sectionId}>{section.title}</h3>
            {section.actions ? <div className="properties-shell-section-actions">{section.actions}</div> : null}
          </div>
          <div className="properties-shell-section-body">{section.children}</div>
        </section>
        );
      })}
    </aside>
  );
}
