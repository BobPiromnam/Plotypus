import {
  createDefaultPlotypusSnapshot,
  type MapBaselayerPreviewRow,
  type ProjectPointPreviewRow,
  type PlotypusSnapshot,
  type PlotypusStateAdapter,
  type PlotypusStateListener,
  type PropertiesCommand
} from "./plotypusStateAdapter";
import { createReadOnlyCommandResult, type AdapterCommandResult } from "./commandAdapter";

type VanillaReadonlyBridge = {
  getSnapshot: () => VanillaSnapshotSource;
  runPropertiesCommand?: (command: PropertiesCommand) => AdapterCommandResult;
};

type VanillaPreviewRowSource = Partial<Omit<ProjectPointPreviewRow, "status">> & {
  status?: unknown;
};

type VanillaMapBaselayerSource = Partial<Omit<PlotypusSnapshot["mapBaselayer"], "previewRows">> & {
  previewRows?: Partial<MapBaselayerPreviewRow>[];
};

type VanillaPropertiesSectionSource = {
  rows?: Array<{ label?: unknown; origin?: unknown; value?: unknown }>;
  title?: unknown;
};

type VanillaPropertiesSource = Partial<Omit<PlotypusSnapshot["properties"], "sections">> & {
  sections?: VanillaPropertiesSectionSource[];
};

type VanillaWorkspaceMetricSource = {
  key?: unknown;
  label?: unknown;
  state?: unknown;
  value?: unknown;
};

type VanillaSnapshotSource = Partial<Omit<PlotypusSnapshot, "mapBaselayer" | "projectPoints" | "properties" | "workspaceSummary">> & {
  mapBaselayer?: VanillaMapBaselayerSource;
  projectPoints?: Partial<Omit<PlotypusSnapshot["projectPoints"], "previewRows">> & {
    previewRows?: VanillaPreviewRowSource[];
  };
  properties?: VanillaPropertiesSource;
  workspaceSummary?: Partial<Omit<PlotypusSnapshot["workspaceSummary"], "metrics">> & {
    metrics?: VanillaWorkspaceMetricSource[];
  };
};

type WindowLike = {
  PLOTYPUS_APP_STATE_READONLY?: VanillaReadonlyBridge;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

type VanillaPlotypusStateAdapterOptions = {
  allowCommands?: boolean;
};

export function createVanillaPlotypusStateAdapter(
  windowRef: WindowLike,
  options: VanillaPlotypusStateAdapterOptions = {}
): PlotypusStateAdapter {
  return {
    getSnapshot() {
      return normalizeVanillaSnapshot(windowRef.PLOTYPUS_APP_STATE_READONLY?.getSnapshot());
    },
    runPropertiesCommand(command) {
      if (options.allowCommands && typeof windowRef.PLOTYPUS_APP_STATE_READONLY?.runPropertiesCommand === "function") {
        return windowRef.PLOTYPUS_APP_STATE_READONLY.runPropertiesCommand(command);
      }
      return createReadOnlyCommandResult(command.type);
    },
    runProjectPointsCommand(command) {
      return createReadOnlyCommandResult(command.type);
    },
    setLocale() {
      return undefined;
    },
    setProjectPointsSelection() {
      return undefined;
    },
    setPropertiesCollapsed() {
      return undefined;
    },
    subscribe(listener: PlotypusStateListener) {
      const handleSnapshot = () => listener();
      windowRef.addEventListener("plotypus:state-snapshot", handleSnapshot);

      return () => {
        windowRef.removeEventListener("plotypus:state-snapshot", handleSnapshot);
      };
    }
  };
}

export function normalizeVanillaSnapshot(source: VanillaSnapshotSource | undefined): PlotypusSnapshot {
  const fallback = createDefaultPlotypusSnapshot();
  const locale = source?.locale === "fr" ? "fr" : "en";
  const mapLanguage = source?.mapLanguage === "fr" ? "fr" : "en";
  const activeLanguage = source?.projectPoints?.toolbar?.activeLanguage === "fr" ? "fr" : "en";

  return {
    activeWorkspace: typeof source?.activeWorkspace === "string" ? source.activeWorkspace : fallback.activeWorkspace,
    locale,
    mapBaselayer: {
      boundary: stringOrFallback(source?.mapBaselayer?.boundary, fallback.mapBaselayer.boundary),
      includedCount: normalizeCount(source?.mapBaselayer?.includedCount, fallback.mapBaselayer.includedCount),
      previewRows: normalizeBaselayerRows(source?.mapBaselayer?.previewRows, fallback.mapBaselayer.previewRows),
      regionCount: normalizeCount(source?.mapBaselayer?.regionCount, fallback.mapBaselayer.regionCount)
    },
    mapLanguage,
    projectPoints: {
      lastCommandLabel: stringOrFallback(
        source?.projectPoints?.lastCommandLabel,
        fallback.projectPoints.lastCommandLabel
      ),
      previewRows: normalizePreviewRows(source?.projectPoints?.previewRows, fallback.projectPoints.previewRows),
      rowCount: normalizeCount(source?.projectPoints?.rowCount, fallback.projectPoints.rowCount),
      toolbar: {
        activeLanguage,
        selectedCellCount: normalizeCount(
          source?.projectPoints?.toolbar?.selectedCellCount,
          fallback.projectPoints.toolbar.selectedCellCount
        ),
        selectedRowCount: normalizeCount(
          source?.projectPoints?.toolbar?.selectedRowCount,
          fallback.projectPoints.toolbar.selectedRowCount
        )
      }
    },
    properties: {
      collapsed: Boolean(source?.properties?.collapsed),
      contextKind: stringOrFallback(source?.properties?.contextKind, fallback.properties.contextKind),
      sections: normalizePropertySections(source?.properties?.sections, fallback.properties.sections),
      subtitle: stringOrFallback(source?.properties?.subtitle, fallback.properties.subtitle),
      title: stringOrFallback(source?.properties?.title, fallback.properties.title)
    },
    workspaceSummary: {
      activeLabel: stringOrFallback(source?.workspaceSummary?.activeLabel, fallback.workspaceSummary.activeLabel),
      metrics: normalizeWorkspaceMetrics(source?.workspaceSummary?.metrics, fallback.workspaceSummary.metrics),
      qualityLabel: stringOrFallback(source?.workspaceSummary?.qualityLabel, fallback.workspaceSummary.qualityLabel)
    }
  };
}

function normalizeCount(value: unknown, fallback: number) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.round(count) : fallback;
}

function normalizeBaselayerRows(value: unknown, fallback: MapBaselayerPreviewRow[]) {
  if (!Array.isArray(value)) return fallback.map((row) => ({ ...row }));
  return value.slice(0, 12).map((row, index) => {
    const source = row && typeof row === "object" ? row as Partial<MapBaselayerPreviewRow> : {};
    return {
      colour: normalizeHexColour(source.colour),
      colourOrder: normalizeColourOrder(source.colourOrder),
      included: Boolean(source.included),
      name: stringOrFallback(source.name, `Region ${index + 1}`),
      pointCount: normalizeCount(source.pointCount, 0),
      regionId: stringOrFallback(source.regionId, String(index + 1))
    };
  });
}

function normalizePreviewRows(value: unknown, fallback: ProjectPointPreviewRow[]) {
  if (!Array.isArray(value)) return fallback.map((row) => ({ ...row }));
  return value.slice(0, 12).map((row, index) => {
    const source = row && typeof row === "object" ? row as Partial<ProjectPointPreviewRow> : {};
    return {
      hasLatitude: Boolean(source.hasLatitude),
      hasLongitude: Boolean(source.hasLongitude),
      name: stringOrFallback(source.name, `Project ${index + 1}`),
      priority: normalizeCount(source.priority, 0),
      rowId: stringOrFallback(source.rowId, String(index + 1)),
      status: normalizeStatus(source.status),
      type: stringOrFallback(source.type, "")
    };
  });
}

function normalizeStatus(value: unknown): ProjectPointPreviewRow["status"] {
  return value === "callout" || value === "mapped" || value === "missing" ? value : "blank";
}

function normalizePropertySections(value: unknown, fallback: PlotypusSnapshot["properties"]["sections"]) {
  if (!Array.isArray(value)) return fallback.map(clonePropertySection);
  const sections = value.slice(0, 6).map((section, sectionIndex) => {
    const source = section && typeof section === "object" ? section as VanillaPropertiesSectionSource : {};
    const rows = Array.isArray(source.rows) ? source.rows : [];
    return {
      title: stringOrFallback(source.title, `Section ${sectionIndex + 1}`),
      rows: rows.slice(0, 12).map((row, rowIndex) => {
        const rowSource = row && typeof row === "object"
          ? row as Partial<PlotypusSnapshot["properties"]["sections"][number]["rows"][number]>
          : {};
        return {
          label: stringOrFallback(rowSource.label, `Field ${rowIndex + 1}`),
          origin: rowSource.origin === "automatic" ? "automatic" as const : "editable" as const,
          value: stringOrFallback(rowSource.value, "—")
        };
      })
    };
  });

  return sections.length ? sections : fallback.map(clonePropertySection);
}

function clonePropertySection(section: PlotypusSnapshot["properties"]["sections"][number]) {
  return {
    title: section.title,
    rows: section.rows.map((row) => ({ ...row }))
  };
}

function normalizeWorkspaceMetrics(value: unknown, fallback: PlotypusSnapshot["workspaceSummary"]["metrics"]) {
  if (!Array.isArray(value)) return fallback.map((metric) => ({ ...metric }));
  const metrics = value.slice(0, 8).map((metric, index) => {
    const source = metric && typeof metric === "object"
      ? metric as VanillaWorkspaceMetricSource
      : {};
    return {
      key: stringOrFallback(source.key, `metric-${index + 1}`),
      label: stringOrFallback(source.label, `Metric ${index + 1}`),
      state: normalizeMetricState(source.state),
      value: stringOrFallback(source.value, "0")
    };
  });

  return metrics.length ? metrics : fallback.map((metric) => ({ ...metric }));
}

function normalizeMetricState(value: unknown): PlotypusSnapshot["workspaceSummary"]["metrics"][number]["state"] {
  return value === "ok" || value === "warning" ? value : "neutral";
}

function normalizeHexColour(value: unknown) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : "#c7ded5";
}

function normalizeColourOrder(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.round(count) : 0;
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
