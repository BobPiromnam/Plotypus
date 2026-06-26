import { describe, expect, it, vi } from "vitest";
import { createVanillaPlotypusStateAdapter, normalizeVanillaSnapshot } from "./vanillaPlotypusStateAdapter";

describe("vanillaPlotypusStateAdapter", () => {
  it("normalizes partial vanilla snapshots into the React snapshot shape", () => {
    const snapshot = normalizeVanillaSnapshot({
      activeWorkspace: "projects",
      locale: "fr",
      mapLanguage: "fr",
      projectPoints: {
        previewRows: [
          {
            hasLatitude: true,
            hasLongitude: true,
            name: "Route et port",
            priority: 2,
            rowId: "abc",
            status: "mapped",
            type: "Projets soumis"
          }
        ],
        rowCount: 4,
        toolbar: {
          activeLanguage: "fr",
          selectedCellCount: 2,
          selectedRowCount: 1
        }
      },
      properties: {
        collapsed: true,
        contextKind: "row",
        subtitle: "Points de projet",
        title: "Route et port"
      }
    });

    expect(snapshot.activeWorkspace).toBe("projects");
    expect(snapshot.locale).toBe("fr");
    expect(snapshot.projectPoints.toolbar.selectedCellCount).toBe(2);
    expect(snapshot.projectPoints.previewRows[0].name).toBe("Route et port");
    expect(snapshot.projectPoints.previewRows[0].status).toBe("mapped");
    expect(snapshot.properties.collapsed).toBe(true);
  });

  it("sanitizes invalid preview rows from the vanilla bridge", () => {
    const snapshot = normalizeVanillaSnapshot({
      projectPoints: {
        previewRows: [
          {
            hasLatitude: true,
            hasLongitude: false,
            name: "",
            priority: -1,
            rowId: "",
            status: "unknown",
            type: ""
          }
        ],
        rowCount: 1,
        toolbar: {
          activeLanguage: "en",
          selectedCellCount: 0,
          selectedRowCount: 0
        }
      }
    });

    expect(snapshot.projectPoints.previewRows[0]).toEqual({
      hasLatitude: true,
      hasLongitude: false,
      name: "Project 1",
      priority: 0,
      rowId: "1",
      status: "blank",
      type: ""
    });
  });

  it("falls back when the vanilla bridge is unavailable", () => {
    const snapshot = normalizeVanillaSnapshot(undefined);

    expect(snapshot.locale).toBe("en");
    expect(snapshot.activeWorkspace).toBe("preview");
    expect(snapshot.properties.title).toBe("Document");
  });

  it("reads snapshots from the vanilla bridge", () => {
    const adapter = createVanillaPlotypusStateAdapter({
      PLOTYPUS_APP_STATE_READONLY: {
        getSnapshot: () => ({
          activeWorkspace: "regions",
          projectPoints: {
            previewRows: [],
            rowCount: 12,
            toolbar: {
              activeLanguage: "en",
              selectedCellCount: 0,
              selectedRowCount: 0
            }
          }
        })
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    expect(adapter.getSnapshot().activeWorkspace).toBe("regions");
    expect(adapter.getSnapshot().projectPoints.rowCount).toBe(12);
  });

  it("subscribes to vanilla snapshot events", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const adapter = createVanillaPlotypusStateAdapter({
      addEventListener,
      removeEventListener
    });
    const listener = vi.fn();

    const unsubscribe = adapter.subscribe(listener);
    const eventListener = addEventListener.mock.calls[0][1] as EventListener;
    eventListener({} as Event);
    unsubscribe();

    expect(addEventListener).toHaveBeenCalledWith("plotypus:state-snapshot", expect.any(Function));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledWith("plotypus:state-snapshot", eventListener);
  });
});
