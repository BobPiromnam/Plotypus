import { createMapDetailsAdapter } from "./features/map-details/mapDetailsAdapter";
import { mountMapDetailsDialog } from "./features/map-details/mountMapDetailsDialog";
import type { MapDetailsLocale, MapDetailsValue } from "./features/map-details/MapDetailsDialog";
import {
  mountCommandBar,
  type CommandBarMountHandle
} from "./features/command-bar/mountCommandBar";
import type { CommandBarCopy } from "./features/command-bar/CommandBar";
import {
  mountWorkspaceShell,
  type WorkspaceShellMountHandle
} from "./features/workspace/mountWorkspaceShell";
import type { WorkspaceShellCopy } from "./features/workspace/WorkspaceShell";
import {
  mountProjectPointsToolbar,
  type ProjectPointsToolbarMountHandle
} from "./features/project-points/mountProjectPointsToolbar";
import {
  mountPropertiesPanel,
  type PropertiesPanelMountHandle
} from "./features/properties/mountPropertiesPanel";
import type {
  ProjectPointsToolbarCopy,
  ProjectPointsToolbarState
} from "./features/project-points/ProjectPointsToolbar";
import type {
  CommandBarCommand,
  PlotypusSnapshot,
  PropertiesCommand,
  WorkspaceSummaryMetric,
  WorkspaceValue
} from "./core/plotypusStateAdapter";
import "./components/primitives/primitives.css";
import "./react-shell.css";

type MapDetailsMountOptions = {
  locale?: MapDetailsLocale;
  onCancel?: () => void;
  onDraftChange?: (value: MapDetailsValue) => void;
  onSave?: (value: MapDetailsValue) => void;
  read: () => Partial<MapDetailsValue>;
  target: Element | null;
  write: (value: MapDetailsValue) => void;
};

type CommandBarMountOptions = {
  copy?: Partial<CommandBarCopy>;
  onCommand?: (command: CommandBarCommand) => void;
  onPropertiesCommand?: (command: PropertiesCommand) => void;
  snapshot: PlotypusSnapshot;
  target: Element | null;
};

type WorkspaceShellMountOptions = {
  copy?: Partial<WorkspaceShellCopy>;
  onSummaryAction?: (metric: WorkspaceSummaryMetric) => void;
  onWorkspaceChange?: (workspace: WorkspaceValue) => void;
  snapshot: PlotypusSnapshot;
  target: Element | null;
};

type ProjectPointsToolbarMountOptions = {
  copy?: Partial<ProjectPointsToolbarCopy>;
  onAddFromSource?: () => void;
  onAddRow?: () => void;
  onClearCoordinates?: () => void;
  onClearTable?: () => void;
  onDelete?: () => void;
  onFilterChange?: (filter: NonNullable<ProjectPointsToolbarState["activeFilter"]>) => void;
  onImportCsv?: () => void;
  onLanguageChange?: (language: ProjectPointsToolbarState["activeLanguage"]) => void;
  onPriorityChange?: (priority: string) => void;
  state: ProjectPointsToolbarState;
  target: Element | null;
};

type PropertiesPanelMountOptions = {
  onCollapseChange?: (command: PropertiesCommand) => void;
  snapshot: PlotypusSnapshot;
  target: Element | null;
};

type PlotypusReactAdapters = {
  mountCommandBar: (options: CommandBarMountOptions) => CommandBarMountHandle | null;
  mountMapDetailsDialog: (options: MapDetailsMountOptions) => { unmount: () => void } | null;
  mountPropertiesPanel: (options: PropertiesPanelMountOptions) => PropertiesPanelMountHandle | null;
  mountProjectPointsToolbar: (options: ProjectPointsToolbarMountOptions) => ProjectPointsToolbarMountHandle | null;
  mountWorkspaceShell: (options: WorkspaceShellMountOptions) => WorkspaceShellMountHandle | null;
};

declare global {
  interface Window {
    PLOTYPUS_REACT_ADAPTERS?: PlotypusReactAdapters;
  }
}

window.PLOTYPUS_REACT_ADAPTERS = {
  mountCommandBar(options) {
    return mountCommandBar({
      ...options,
      enabled: true
    });
  },
  mountWorkspaceShell(options) {
    return mountWorkspaceShell({
      ...options,
      enabled: true
    });
  },
  mountMapDetailsDialog({ locale = "en", onCancel, onDraftChange, onSave, read, target, write }) {
    return mountMapDetailsDialog({
      adapter: createMapDetailsAdapter({ read, write }),
      enabled: true,
      locale,
      onCancel,
      onDraftChange,
      onSave,
      target
    });
  },
  mountProjectPointsToolbar(options) {
    return mountProjectPointsToolbar({
      ...options,
      enabled: true
    });
  },
  mountPropertiesPanel(options) {
    return mountPropertiesPanel({
      ...options,
      enabled: true
    });
  }
};
