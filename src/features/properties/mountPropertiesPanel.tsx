import { createRoot, type Root } from "react-dom/client";
import type { IconName } from "../../components/primitives";
import type { PlotypusSnapshot, PropertiesPanelSnapshot, PropertiesPreviewRow } from "../../core/plotypusStateAdapter";
import type { PropertiesCommand } from "../../core/plotypusStateAdapter";
import { Icon } from "../../components/primitives";
import { PropertiesPanelShell } from "./PropertiesPanelShell";

export type PropertiesPanelMountHandle = {
  render: (snapshot: PlotypusSnapshot) => void;
  unmount: () => void;
};

type MountPropertiesPanelOptions = {
  createRootImpl?: typeof createRoot;
  enabled: boolean;
  onCollapseChange?: (command: PropertiesCommand) => void;
  snapshot: PlotypusSnapshot;
  target: Element | null;
};

export function mountPropertiesPanel({
  createRootImpl = createRoot,
  enabled,
  onCollapseChange,
  snapshot,
  target
}: MountPropertiesPanelOptions): PropertiesPanelMountHandle | null {
  if (!enabled || !target) return null;

  const root: Root = createRootImpl(target);

  const render = (nextSnapshot: PlotypusSnapshot) => {
    root.render(
      <PropertiesPanelSnapshotView
        locale={nextSnapshot.locale}
        onCollapseChange={onCollapseChange}
        properties={nextSnapshot.properties}
      />
    );
  };

  render(snapshot);

  return {
    render,
    unmount() {
      root.unmount();
    }
  };
}

function PropertiesPanelSnapshotView({
  locale,
  onCollapseChange,
  properties
}: {
  locale: "en" | "fr";
  onCollapseChange?: (command: PropertiesCommand) => void;
  properties: PropertiesPanelSnapshot;
}) {
  return (
    <PropertiesPanelShell
      collapsed={properties.collapsed}
      contextIcon={iconForContext(properties.contextKind)}
      contextKind={contextLabel(properties.contextKind, properties.title)}
      copy={shellCopy(locale)}
      guidance={properties.guidance}
      onCollapse={() => onCollapseChange?.({ type: "toggle-collapsed" })}
      sections={properties.sections.map((section) => ({
        children: <PropertiesRows locale={locale} rows={section.rows} />,
        title: section.title
      }))}
      subtitle={properties.subtitle}
      title={properties.title}
    />
  );
}

function PropertiesRows({ locale, rows }: { locale: "en" | "fr"; rows: PropertiesPreviewRow[] }) {
  if (!rows.length) {
    return (
      <p className="properties-facts-empty">
        {locale === "fr" ? "Aucun champ disponible." : "No fields available."}
      </p>
    );
  }

  return (
    <dl className="properties-facts-list">
      {rows.map((row) => (
        <div key={`${row.label}-${row.value}`}>
          <dt>
            <span>{row.label}</span>
            <span className={`properties-facts-origin is-${row.origin}`} aria-label={originLabel(row.origin, locale)}>
              <Icon name={row.origin === "automatic" ? "wand" : "pencil"} />
            </span>
          </dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function iconForContext(contextKind: string): IconName {
  if (contextKind === "document") return "file-text";
  return "sliders";
}

function shellCopy(locale: "en" | "fr") {
  if (locale === "fr") {
    return {
      ariaLabel: "Panneau Propriétés",
      collapse: "Réduire les propriétés",
      expand: "Développer les propriétés",
      eyebrow: "Propriétés"
    };
  }
  return {
    ariaLabel: "Properties panel",
    collapse: "Collapse properties",
    expand: "Expand properties",
    eyebrow: "Properties"
  };
}

function contextLabel(contextKind: string, title: string) {
  return contextKind === "document" ? title : contextKind;
}

function originLabel(origin: PropertiesPreviewRow["origin"], locale: "en" | "fr") {
  if (locale === "fr") return origin === "automatic" ? "Automatique" : "Modifiable";
  return origin === "automatic" ? "Automatic" : "Editable";
}
