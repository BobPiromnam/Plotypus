import {
  createDefaultPlotypusSnapshot,
  type PlotypusSnapshot,
  type PlotypusStateAdapter,
  type PlotypusStateListener
} from "./plotypusStateAdapter";

type VanillaReadonlyBridge = {
  getSnapshot: () => Partial<PlotypusSnapshot>;
};

type WindowLike = {
  PLOTYPUS_APP_STATE_READONLY?: VanillaReadonlyBridge;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

export function createVanillaPlotypusStateAdapter(windowRef: WindowLike): PlotypusStateAdapter {
  return {
    getSnapshot() {
      return normalizeVanillaSnapshot(windowRef.PLOTYPUS_APP_STATE_READONLY?.getSnapshot());
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

export function normalizeVanillaSnapshot(source: Partial<PlotypusSnapshot> | undefined): PlotypusSnapshot {
  const fallback = createDefaultPlotypusSnapshot();
  const locale = source?.locale === "fr" ? "fr" : "en";
  const mapLanguage = source?.mapLanguage === "fr" ? "fr" : "en";
  const activeLanguage = source?.projectPoints?.toolbar?.activeLanguage === "fr" ? "fr" : "en";

  return {
    activeWorkspace: typeof source?.activeWorkspace === "string" ? source.activeWorkspace : fallback.activeWorkspace,
    locale,
    mapLanguage,
    projectPoints: {
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
      subtitle: stringOrFallback(source?.properties?.subtitle, fallback.properties.subtitle),
      title: stringOrFallback(source?.properties?.title, fallback.properties.title)
    }
  };
}

function normalizeCount(value: unknown, fallback: number) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.round(count) : fallback;
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
