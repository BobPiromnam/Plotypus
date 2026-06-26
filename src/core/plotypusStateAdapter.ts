import type { ProjectPointsToolbarState } from "../features/project-points/ProjectPointsToolbar";

export type PlotypusLocale = "en" | "fr";

export type PropertiesPanelSnapshot = {
  collapsed: boolean;
  contextKind: string;
  subtitle: string;
  title: string;
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

export type PlotypusSnapshot = {
  activeWorkspace: string;
  locale: PlotypusLocale;
  mapLanguage: PlotypusLocale;
  projectPoints: {
    previewRows: ProjectPointPreviewRow[];
    rowCount: number;
    toolbar: ProjectPointsToolbarState;
  };
  properties: PropertiesPanelSnapshot;
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
      subtitle: "Map display and interaction",
      title: "Document"
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
    mapLanguage: snapshot.mapLanguage,
    projectPoints: {
      previewRows: snapshot.projectPoints.previewRows.map((row) => ({ ...row })),
      rowCount: snapshot.projectPoints.rowCount,
      toolbar: { ...snapshot.projectPoints.toolbar }
    },
    properties: { ...snapshot.properties }
  };
}
