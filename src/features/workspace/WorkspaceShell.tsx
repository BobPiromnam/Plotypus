import { Icon } from "../../components/primitives";
import type {
  WorkspaceSummaryMetric,
  WorkspaceSummarySnapshot,
  WorkspaceValue
} from "../../core/plotypusStateAdapter";

export type WorkspaceShellCopy = {
  ariaLabel: string;
  categories: string;
  map: string;
  projects: string;
  quality: string;
  regions: string;
  summaryActionLabel: string;
  translate: string;
};

type WorkspaceShellProps = {
  activeWorkspace: string;
  copy?: Partial<WorkspaceShellCopy>;
  onSummaryAction?: (metric: WorkspaceSummaryMetric) => void;
  onWorkspaceChange?: (workspace: WorkspaceValue) => void;
  summary: WorkspaceSummarySnapshot;
};

const defaultCopy: WorkspaceShellCopy = {
  ariaLabel: "Plotypus workspaces",
  categories: "Categories & markers",
  map: "Map",
  projects: "Project points",
  quality: "Map quality",
  regions: "Map baselayer",
  summaryActionLabel: "Open related workspace",
  translate: "Translate"
};

const workspaces: Array<{ icon: Parameters<typeof Icon>[0]["name"]; key: WorkspaceValue; labelKey: keyof WorkspaceShellCopy }> = [
  { icon: "map", key: "preview", labelKey: "map" },
  { icon: "table", key: "projects", labelKey: "projects" },
  { icon: "layers", key: "categories", labelKey: "categories" },
  { icon: "regions", key: "regions", labelKey: "regions" },
  { icon: "languages", key: "translate", labelKey: "translate" },
  { icon: "shield-check", key: "quality", labelKey: "quality" }
];

function isActionableMetric(metric: WorkspaceSummaryMetric) {
  return metric.key === "quality" || metric.key === "regions";
}

export function WorkspaceShell({
  activeWorkspace,
  copy: copyOverrides,
  onSummaryAction,
  onWorkspaceChange,
  summary
}: WorkspaceShellProps) {
  const copy = { ...defaultCopy, ...copyOverrides };

  return (
    <div className="react-workspace-shell">
      <nav className="react-workspace-tabs" role="tablist" aria-label={copy.ariaLabel}>
        {workspaces.map((workspace) => {
          const isActive = activeWorkspace === workspace.key;
          return (
            <button
              key={workspace.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "is-active" : ""}
              onClick={() => onWorkspaceChange?.(workspace.key)}
            >
              <Icon name={workspace.icon} />
              <span>{copy[workspace.labelKey]}</span>
            </button>
          );
        })}
      </nav>
      <div className="react-workspace-summary" aria-live="polite">
        {summary.metrics.map((metric) => {
          const content = (
            <>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </>
          );
          if (isActionableMetric(metric)) {
            return (
              <button
                key={metric.key}
                type="button"
                className={`react-workspace-summary-chip is-${metric.state}`}
                aria-label={`${copy.summaryActionLabel}: ${metric.label}`}
                onClick={() => onSummaryAction?.(metric)}
              >
                {content}
              </button>
            );
          }
          return (
            <span key={metric.key} className={`react-workspace-summary-chip is-${metric.state}`}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
