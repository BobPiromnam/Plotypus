import { describe, expect, it, vi } from "vitest";
import { createDefaultPlotypusSnapshot, createMemoryPlotypusStateAdapter } from "./plotypusStateAdapter";

describe("plotypusStateAdapter", () => {
  it("creates a default snapshot for the React sandbox", () => {
    const snapshot = createDefaultPlotypusSnapshot();

    expect(snapshot.locale).toBe("en");
    expect(snapshot.mapBaselayer.previewRows[0].name).toBe("Alberta");
    expect(snapshot.projectPoints.toolbar.selectedCellCount).toBe(3);
    expect(snapshot.properties.title).toBe("Document");
  });

  it("keeps language state in sync with the project toolbar authoring language", () => {
    const adapter = createMemoryPlotypusStateAdapter();

    adapter.setLocale("fr");

    expect(adapter.getSnapshot().locale).toBe("fr");
    expect(adapter.getSnapshot().projectPoints.toolbar.activeLanguage).toBe("fr");
  });

  it("updates project point selection without replacing unrelated state", () => {
    const adapter = createMemoryPlotypusStateAdapter();

    adapter.setProjectPointsSelection({ selectedCellCount: 0, selectedRowCount: 0 });

    expect(adapter.getSnapshot().projectPoints.toolbar.selectedCellCount).toBe(0);
    expect(adapter.getSnapshot().projectPoints.toolbar.selectedRowCount).toBe(0);
    expect(adapter.getSnapshot().properties.title).toBe("Document");
  });

  it("publishes updates to subscribers until unsubscribed", () => {
    const adapter = createMemoryPlotypusStateAdapter();
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);

    adapter.setPropertiesCollapsed(true);
    unsubscribe();
    adapter.setPropertiesCollapsed(false);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
