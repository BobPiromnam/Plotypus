import type { ProjectPointsToolbarState } from "../features/project-points/ProjectPointsToolbar";
import { createCommandResult, type AdapterCommandResult } from "./commandAdapter";

export type PlotypusLocale = "en" | "fr";

export type PropertiesPanelSnapshot = {
  collapsed: boolean;
  contextKind: string;
  guidance: string;
  sections: PropertiesPreviewSection[];
  subtitle: string;
  title: string;
};

export type PropertiesPreviewRow = {
  label: string;
  origin: "automatic" | "editable";
  value: string;
};

export type PropertiesPreviewSection = {
  rows: PropertiesPreviewRow[];
  title: string;
};

export type WorkspaceSummaryMetric = {
  key: string;
  label: string;
  state: "neutral" | "ok" | "warning";
  value: string;
};

export type WorkspaceSummarySnapshot = {
  activeLabel: string;
  metrics: WorkspaceSummaryMetric[];
  qualityLabel: string;
};

export type CommandBarSnapshot = {
  canUndo: boolean;
  exportMenuOpen: boolean;
  mapDetailsMissingCount: number;
  mapDetailsNeedsFrench: boolean;
  mapLanguage: PlotypusLocale;
  mapStyle: string;
  uiLanguage: PlotypusLocale;
};

export type ProjectPointPreviewRow = {
  hasLatitude: boolean;
  hasLongitude: boolean;
  name: string;
  priority: number;
  rowId: string;
  status: "blank" | "callout" | "mapped" | "missing";
  type: string;
};

export type MapBaselayerPreviewRow = {
  colour: string;
  colourOrder: number | string;
  included: boolean;
  name: string;
  pointCount: number;
  regionId: string;
};

export type PlotypusSnapshot = {
  activeWorkspace: string;
  commandBar: CommandBarSnapshot;
  locale: PlotypusLocale;
  mapBaselayer: {
    boundary: string;
    includedCount: number;
    previewRows: MapBaselayerPreviewRow[];
    regionCount: number;
  };
  mapLanguage: PlotypusLocale;
  projectPoints: {
    lastCommandLabel: string;
    previewRows: ProjectPointPreviewRow[];
    rowCount: number;
    toolbar: ProjectPointsToolbarState;
  };
  properties: PropertiesPanelSnapshot;
  workspaceSummary: WorkspaceSummarySnapshot;
};

export type PlotypusStateListener = () => void;

export type ProjectPointsCommand =
  | { type: "add-from-source" }
  | { type: "add-row" }
  | { type: "clear-coordinates" }
  | { type: "clear-table" }
  | { type: "delete-selection" }
  | { type: "import-csv" }
  | { filter: NonNullable<ProjectPointsToolbarState["activeFilter"]>; type: "set-filter" }
  | { priority: string; type: "set-priority" };

export type PropertiesCommand =
  | { collapsed: boolean; type: "set-collapsed" }
  | { type: "toggle-collapsed" };

export type CommandBarCommand =
  | { type: "export-csv" }
  | { type: "export-png" }
  | { type: "export-svg" }
  | { type: "import-csv" }
  | { type: "load-sample" }
  | { type: "open-map-details" }
  | { type: "open-project" }
  | { type: "save-project" }
  | { language: PlotypusLocale; type: "set-map-language" }
  | { language: PlotypusLocale; type: "set-ui-language" }
  | { open: boolean; type: "set-export-menu-open" }
  | { type: "toggle-export-menu" }
  | { type: "undo" };

export type PlotypusStateAdapter = {
  getSnapshot: () => PlotypusSnapshot;
  runCommandBarCommand: (command: CommandBarCommand) => AdapterCommandResult;
  runPropertiesCommand: (command: PropertiesCommand) => AdapterCommandResult;
  runProjectPointsCommand: (command: ProjectPointsCommand) => AdapterCommandResult;
  setLocale: (locale: PlotypusLocale) => void;
  setProjectPointsSelection: (selection: Pick<ProjectPointsToolbarState, "selectedCellCount" | "selectedRowCount">) => void;
  setPropertiesCollapsed: (collapsed: boolean) => void;
  subscribe: (listener: PlotypusStateListener) => () => void;
};

export function createDefaultPlotypusSnapshot(): PlotypusSnapshot {
  return {
    activeWorkspace: "preview",
    commandBar: {
      canUndo: false,
      exportMenuOpen: false,
      mapDetailsMissingCount: 4,
      mapDetailsNeedsFrench: true,
      mapLanguage: "en",
      mapStyle: "GoC green",
      uiLanguage: "en"
    },
    locale: "en",
    mapBaselayer: {
      boundary: "Canada provinces and territories",
      includedCount: 13,
      previewRows: [
        {
          colour: "#c7ded5",
          colourOrder: 0,
          included: true,
          name: "Alberta",
          pointCount: 0,
          regionId: "alberta"
        },
        {
          colour: "#c7ded5",
          colourOrder: 0,
          included: true,
          name: "British Columbia",
          pointCount: 3,
          regionId: "british-columbia"
        }
      ],
      regionCount: 13
    },
    mapLanguage: "en",
    projectPoints: {
      lastCommandLabel: "No action yet",
      previewRows: [
        {
          hasLatitude: true,
          hasLongitude: true,
          name: "Grays Bay Road and Port",
          priority: 0,
          rowId: "1",
          status: "mapped",
          type: "Referred Project"
        },
        {
          hasLatitude: false,
          hasLongitude: false,
          name: "Critical Minerals Strategy",
          priority: 0,
          rowId: "2",
          status: "callout",
          type: "Transformative Strategy"
        }
      ],
      rowCount: 21,
      toolbar: {
        activeFilter: "all",
        activeLanguage: "en",
        filterOptions: [
          { label: "All 21", value: "all" },
          { label: "Missing coordinates 0", value: "missing" },
          { label: "Callouts 1", value: "callouts" }
        ],
        selectedCellCount: 3,
        selectedRowCount: 2
      }
    },
    properties: {
      collapsed: false,
      contextKind: "Document",
      guidance: "Click the map, a label, legend, or callout for object-specific controls.",
      sections: [
        {
          title: "Map style",
          rows: [
            { label: "Map style", origin: "editable", value: "GoC green" },
            { label: "Title", origin: "automatic", value: "Missing" }
          ]
        }
      ],
      subtitle: "Map display and interaction",
      title: "Document"
    },
    workspaceSummary: {
      activeLabel: "Map",
      metrics: [
        { key: "rows", label: "Rows", state: "ok", value: "21" },
        { key: "mapped", label: "Mapped", state: "ok", value: "20" },
        { key: "regions", label: "Regions", state: "ok", value: "13/13" },
        { key: "quality", label: "To review", state: "warning", value: "7" }
      ],
      qualityLabel: "7 issues"
    }
  };
}

export function createMemoryPlotypusStateAdapter(
  initialSnapshot: PlotypusSnapshot = createDefaultPlotypusSnapshot()
): PlotypusStateAdapter {
  let snapshot = cloneSnapshot(initialSnapshot);
  const listeners = new Set<PlotypusStateListener>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const update = (nextSnapshot: PlotypusSnapshot) => {
    snapshot = cloneSnapshot(nextSnapshot);
    emit();
  };

  return {
    getSnapshot: () => snapshot,
    runCommandBarCommand(command) {
      const commandLabel = getCommandBarCommandLabel(command);
      const nextCommandBar = {
        ...snapshot.commandBar
      };

      if (command.type === "set-ui-language") {
        nextCommandBar.uiLanguage = command.language;
        nextCommandBar.mapLanguage = command.language;
      }
      if (command.type === "set-map-language") nextCommandBar.mapLanguage = command.language;
      if (command.type === "set-export-menu-open") nextCommandBar.exportMenuOpen = command.open;
      if (command.type === "toggle-export-menu") nextCommandBar.exportMenuOpen = !snapshot.commandBar.exportMenuOpen;

      update({
        ...snapshot,
        commandBar: nextCommandBar,
        locale: nextCommandBar.uiLanguage,
        mapLanguage: nextCommandBar.mapLanguage,
        projectPoints: {
          ...snapshot.projectPoints,
          lastCommandLabel: commandLabel
        }
      });

      return createCommandResult(commandLabel);
    },
    runPropertiesCommand(command) {
      const collapsed = command.type === "toggle-collapsed" ? !snapshot.properties.collapsed : command.collapsed;
      const commandLabel = collapsed ? "Collapse properties requested" : "Expand properties requested";

      update({
        ...snapshot,
        properties: {
          ...snapshot.properties,
          collapsed
        }
      });

      return createCommandResult(commandLabel);
    },
    runProjectPointsCommand(command) {
      const commandLabel = getProjectPointsCommandLabel(command);
      const shouldClearSelection = command.type === "clear-table" || command.type === "delete-selection";
      const nextRowCount = command.type === "add-row" ? snapshot.projectPoints.rowCount + 1 : snapshot.projectPoints.rowCount;
      const nextActiveFilter = command.type === "set-filter" ? command.filter : snapshot.projectPoints.toolbar.activeFilter;

      update({
        ...snapshot,
        projectPoints: {
          ...snapshot.projectPoints,
          lastCommandLabel: commandLabel,
          rowCount: nextRowCount,
          toolbar: {
            ...snapshot.projectPoints.toolbar,
            activeFilter: nextActiveFilter,
            ...(shouldClearSelection ? { selectedCellCount: 0, selectedRowCount: 0 } : {})
          }
        }
      });

      return createCommandResult(commandLabel);
    },
    setLocale(locale) {
      update({
        ...snapshot,
        commandBar: {
          ...snapshot.commandBar,
          mapLanguage: locale,
          uiLanguage: locale
        },
        locale,
        mapLanguage: locale,
        projectPoints: {
          ...snapshot.projectPoints,
          toolbar: {
            ...snapshot.projectPoints.toolbar,
            activeLanguage: locale
          }
        }
      });
    },
    setProjectPointsSelection(selection) {
      update({
        ...snapshot,
        projectPoints: {
          ...snapshot.projectPoints,
          toolbar: {
            ...snapshot.projectPoints.toolbar,
            ...selection
          }
        }
      });
    },
    setPropertiesCollapsed(collapsed) {
      update({
        ...snapshot,
        properties: {
          ...snapshot.properties,
          collapsed
        }
      });
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    }
  };
}

function cloneSnapshot(snapshot: PlotypusSnapshot): PlotypusSnapshot {
  return {
    activeWorkspace: snapshot.activeWorkspace,
    commandBar: { ...snapshot.commandBar },
    locale: snapshot.locale,
    mapBaselayer: {
      boundary: snapshot.mapBaselayer.boundary,
      includedCount: snapshot.mapBaselayer.includedCount,
      previewRows: snapshot.mapBaselayer.previewRows.map((row) => ({ ...row })),
      regionCount: snapshot.mapBaselayer.regionCount
    },
    mapLanguage: snapshot.mapLanguage,
    projectPoints: {
      lastCommandLabel: snapshot.projectPoints.lastCommandLabel,
      previewRows: snapshot.projectPoints.previewRows.map((row) => ({ ...row })),
      rowCount: snapshot.projectPoints.rowCount,
      toolbar: { ...snapshot.projectPoints.toolbar }
    },
    properties: {
      ...snapshot.properties,
      guidance: snapshot.properties.guidance,
      sections: snapshot.properties.sections.map((section) => ({
        title: section.title,
        rows: section.rows.map((row) => ({ ...row }))
      }))
    },
    workspaceSummary: {
      activeLabel: snapshot.workspaceSummary.activeLabel,
      metrics: snapshot.workspaceSummary.metrics.map((metric) => ({ ...metric })),
      qualityLabel: snapshot.workspaceSummary.qualityLabel
    }
  };
}

function getCommandBarCommandLabel(command: CommandBarCommand) {
  switch (command.type) {
    case "export-csv":
      return "Export CSV requested";
    case "export-png":
      return "Export PNG requested";
    case "export-svg":
      return "Export SVG requested";
    case "import-csv":
      return "Import CSV requested";
    case "load-sample":
      return "Load sample requested";
    case "open-map-details":
      return "Open map details requested";
    case "open-project":
      return "Open project requested";
    case "save-project":
      return "Save project requested";
    case "set-export-menu-open":
      return command.open ? "Open export menu requested" : "Close export menu requested";
    case "set-map-language":
      return `Map language ${command.language} requested`;
    case "set-ui-language":
      return `UI language ${command.language} requested`;
    case "toggle-export-menu":
      return "Toggle export menu requested";
    case "undo":
      return "Undo requested";
  }
}

function getProjectPointsCommandLabel(command: ProjectPointsCommand) {
  switch (command.type) {
    case "add-from-source":
      return "Add from source requested";
    case "add-row":
      return "Add row requested";
    case "clear-coordinates":
      return "Clear coordinates requested";
    case "clear-table":
      return "Clear table requested";
    case "delete-selection":
      return "Delete selection requested";
    case "import-csv":
      return "Import CSV requested";
    case "set-filter":
      return `Filter ${command.filter} requested`;
    case "set-priority":
      return command.priority ? `Priority ${command.priority} requested` : "Priority menu opened";
  }
}
