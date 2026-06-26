import { describe, expect, it, vi } from "vitest";
import { createDefaultPlotypusSnapshot, createMemoryPlotypusStateAdapter } from "./plotypusStateAdapter";

describe("plotypusStateAdapter", () => {
  it("creates a default snapshot for the React sandbox", () => {
    const snapshot = createDefaultPlotypusSnapshot();

    expect(snapshot.locale).toBe("en");
    expect(snapshot.mapBaselayer.previewRows[0].name).toBe("Alberta");
    expect(snapshot.projectPoints.toolbar.selectedCellCount).toBe(3);
    expect(snapshot.properties.sections[0].rows[0].origin).toBe("editable");
    expect(snapshot.properties.title).toBe("Document");
    expect(snapshot.workspaceSummary.metrics[0].label).toBe("Rows");
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

  it("runs project point toolbar commands through the adapter", () => {
    const adapter = createMemoryPlotypusStateAdapter();

    const result = adapter.runProjectPointsCommand({ priority: "2", type: "set-priority" });

    expect(result.label).toBe("Priority 2 requested");
    expect(adapter.getSnapshot().projectPoints.lastCommandLabel).toBe("Priority 2 requested");
    expect(adapter.getSnapshot().projectPoints.toolbar.selectedCellCount).toBe(3);
  });

  it("clears sandbox selection for destructive project point commands", () => {
    const adapter = createMemoryPlotypusStateAdapter();

    adapter.runProjectPointsCommand({ type: "delete-selection" });

    expect(adapter.getSnapshot().projectPoints.lastCommandLabel).toBe("Delete selection requested");
    expect(adapter.getSnapshot().projectPoints.toolbar.selectedCellCount).toBe(0);
    expect(adapter.getSnapshot().projectPoints.toolbar.selectedRowCount).toBe(0);
  });

  it("runs properties collapse commands through the adapter", () => {
    const adapter = createMemoryPlotypusStateAdapter();

    const collapseResult = adapter.runPropertiesCommand({ type: "toggle-collapsed" });
    const expandResult = adapter.runPropertiesCommand({ collapsed: false, type: "set-collapsed" });

    expect(collapseResult.label).toBe("Collapse properties requested");
    expect(expandResult.label).toBe("Expand properties requested");
    expect(adapter.getSnapshot().properties.collapsed).toBe(false);
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
