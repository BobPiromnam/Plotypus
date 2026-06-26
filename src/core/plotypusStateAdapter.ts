import type { ProjectPointsToolbarState } from "../features/project-points/ProjectPointsToolbar";

export type PlotypusLocale = "en" | "fr";

export type PropertiesPanelSnapshot = {
  collapsed: boolean;
  contextKind: string;
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
  locale: PlotypusLocale;
  mapBaselayer: {
    boundary: string;
    includedCount: number;
    previewRows: MapBaselayerPreviewRow[];
    regionCount: number;
  };
  mapLanguage: PlotypusLocale;
  projectPoints: {
    previewRows: ProjectPointPreviewRow[];
    rowCount: number;
    toolbar: ProjectPointsToolbarState;
  };
  properties: PropertiesPanelSnapshot;
  workspaceSummary: WorkspaceSummarySnapshot;
};

export type PlotypusStateListener = () => void;

export type PlotypusStateAdapter = {
  getSnapshot: () => PlotypusSnapshot;
  setLocale: (locale: PlotypusLocale) => void;
  setProjectPointsSelection: (selection: Pick<ProjectPointsToolbarState, "selectedCellCount" | "selectedRowCount">) => void;
  setPropertiesCollapsed: (collapsed: boolean) => void;
  subscribe: (listener: PlotypusStateListener) => () => void;
};

export function createDefaultPlotypusSnapshot(): PlotypusSnapshot {
  return {
    activeWorkspace: "preview",
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
        activeLanguage: "en",
        selectedCellCount: 3,
        selectedRowCount: 2
      }
    },
    properties: {
      collapsed: false,
      contextKind: "Document",
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
    setLocale(locale) {
      update({
        ...snapshot,
        locale,
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
    locale: snapshot.locale,
    mapBaselayer: {
      boundary: snapshot.mapBaselayer.boundary,
      includedCount: snapshot.mapBaselayer.includedCount,
      previewRows: snapshot.mapBaselayer.previewRows.map((row) => ({ ...row })),
      regionCount: snapshot.mapBaselayer.regionCount
    },
    mapLanguage: snapshot.mapLanguage,
    projectPoints: {
      previewRows: snapshot.projectPoints.previewRows.map((row) => ({ ...row })),
      rowCount: snapshot.projectPoints.rowCount,
      toolbar: { ...snapshot.projectPoints.toolbar }
    },
    properties: {
      ...snapshot.properties,
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
