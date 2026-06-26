import { describe, expect, it, vi } from "vitest";
import { createVanillaPlotypusStateAdapter, normalizeVanillaSnapshot } from "./vanillaPlotypusStateAdapter";

describe("vanillaPlotypusStateAdapter", () => {
  it("normalizes partial vanilla snapshots into the React snapshot shape", () => {
    const snapshot = normalizeVanillaSnapshot({
      activeWorkspace: "projects",
      locale: "fr",
      mapBaselayer: {
        boundary: "Provinces et territoires du Canada",
        includedCount: 1,
        previewRows: [
          {
            colour: "#24745f",
            colourOrder: 3,
            included: true,
            name: "Colombie-Britannique",
            pointCount: 4,
            regionId: "british-columbia"
          }
        ],
        regionCount: 13
      },
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
        sections: [
          {
            title: "Affichage",
            rows: [
              { label: "Légende", origin: "editable", value: "Activé" },
              { label: "Titre", origin: "automatic", value: "Manquant" }
            ]
          }
        ],
        subtitle: "Points de projet",
        title: "Route et port"
      },
      workspaceSummary: {
        activeLabel: "Points de projet",
        metrics: [
          { key: "rows", label: "Lignes", state: "ok", value: "4" },
          { key: "quality", label: "À réviser", state: "warning", value: "1" }
        ],
        qualityLabel: "1 à réviser"
      }
    });

    expect(snapshot.activeWorkspace).toBe("projects");
    expect(snapshot.locale).toBe("fr");
    expect(snapshot.mapBaselayer.boundary).toBe("Provinces et territoires du Canada");
    expect(snapshot.mapBaselayer.previewRows[0].name).toBe("Colombie-Britannique");
    expect(snapshot.projectPoints.toolbar.selectedCellCount).toBe(2);
    expect(snapshot.projectPoints.previewRows[0].name).toBe("Route et port");
    expect(snapshot.projectPoints.previewRows[0].status).toBe("mapped");
    expect(snapshot.properties.collapsed).toBe(true);
    expect(snapshot.properties.sections[0].rows[1].origin).toBe("automatic");
    expect(snapshot.workspaceSummary.activeLabel).toBe("Points de projet");
    expect(snapshot.workspaceSummary.metrics[1].state).toBe("warning");
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

  it("sanitizes invalid baselayer rows from the vanilla bridge", () => {
    const snapshot = normalizeVanillaSnapshot({
      mapBaselayer: {
        boundary: "",
        includedCount: -1,
        previewRows: [
          {
            colour: "tomato",
            colourOrder: -3,
            included: true,
            name: "",
            pointCount: -2,
            regionId: ""
          }
        ],
        regionCount: -5
      }
    });

    expect(snapshot.mapBaselayer.boundary).toBe("Canada provinces and territories");
    expect(snapshot.mapBaselayer.includedCount).toBe(13);
    expect(snapshot.mapBaselayer.regionCount).toBe(13);
    expect(snapshot.mapBaselayer.previewRows[0]).toEqual({
      colour: "#c7ded5",
      colourOrder: 0,
      included: true,
      name: "Region 1",
      pointCount: 0,
      regionId: "1"
    });
  });

  it("sanitizes invalid properties sections from the vanilla bridge", () => {
    const snapshot = normalizeVanillaSnapshot({
      properties: {
        sections: [
          {
            title: "",
            rows: [
              { label: "", origin: "automatic", value: "" },
              { label: "Manual value", origin: "other", value: "Custom" }
            ]
          }
        ]
      }
    });

    expect(snapshot.properties.sections[0]).toEqual({
      title: "Section 1",
      rows: [
        { label: "Field 1", origin: "automatic", value: "—" },
        { label: "Manual value", origin: "editable", value: "Custom" }
      ]
    });
  });

  it("sanitizes invalid workspace summary metrics from the vanilla bridge", () => {
    const snapshot = normalizeVanillaSnapshot({
      workspaceSummary: {
        activeLabel: "",
        metrics: [
          { key: "", label: "", state: "danger", value: "" },
          { key: "mapped", label: "Mapped", state: "ok", value: "20" }
        ],
        qualityLabel: ""
      }
    });

    expect(snapshot.workspaceSummary.activeLabel).toBe("Map");
    expect(snapshot.workspaceSummary.qualityLabel).toBe("7 issues");
    expect(snapshot.workspaceSummary.metrics[0]).toEqual({
      key: "metric-1",
      label: "Metric 1",
      state: "neutral",
      value: "0"
    });
    expect(snapshot.workspaceSummary.metrics[1].state).toBe("ok");
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
          mapBaselayer: {
            boundary: "Canada provinces and territories",
            includedCount: 2,
            previewRows: [],
            regionCount: 4
          },
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
    expect(adapter.getSnapshot().mapBaselayer.regionCount).toBe(4);
    expect(adapter.getSnapshot().projectPoints.rowCount).toBe(12);
  });

  it("keeps a stable snapshot object until the vanilla bridge emits a state event", () => {
    let rowCount = 12;
    let eventListener: EventListener | undefined;
    const adapter = createVanillaPlotypusStateAdapter({
      PLOTYPUS_APP_STATE_READONLY: {
        getSnapshot: () => ({
          projectPoints: {
            rowCount
          }
        })
      },
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        if (type === "plotypus:state-snapshot") eventListener = listener;
      }),
      removeEventListener: vi.fn()
    });
    const listener = vi.fn();
    adapter.subscribe(listener);

    const firstSnapshot = adapter.getSnapshot();
    rowCount = 13;

    expect(adapter.getSnapshot()).toBe(firstSnapshot);
    expect(adapter.getSnapshot().projectPoints.rowCount).toBe(12);

    eventListener?.({} as Event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.getSnapshot()).not.toBe(firstSnapshot);
    expect(adapter.getSnapshot().projectPoints.rowCount).toBe(13);
  });

  it("keeps command methods read-only for the vanilla bridge", () => {
    const adapter = createVanillaPlotypusStateAdapter({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    expect(adapter.runPropertiesCommand({ type: "toggle-collapsed" }).label).toBe(
      "Read-only bridge ignored toggle-collapsed"
    );
    expect(adapter.runProjectPointsCommand({ type: "add-row" }).label).toBe("Read-only bridge ignored add-row");
  });

  it("runs feature-flagged vanilla Properties commands when explicitly enabled", () => {
    const runPropertiesCommand = vi.fn(() => ({ label: "Toggled vanilla Properties panel" }));
    const adapter = createVanillaPlotypusStateAdapter(
      {
        PLOTYPUS_APP_STATE_READONLY: {
          getSnapshot: () => ({}),
          runPropertiesCommand
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      { allowCommands: true }
    );

    expect(adapter.runPropertiesCommand({ type: "toggle-collapsed" }).label).toBe(
      "Toggled vanilla Properties panel"
    );
    expect(runPropertiesCommand).toHaveBeenCalledWith({ type: "toggle-collapsed" });
  });

  it("does not run vanilla command methods without the command flag", () => {
    const runPropertiesCommand = vi.fn(() => ({ label: "Should not run" }));
    const adapter = createVanillaPlotypusStateAdapter({
      PLOTYPUS_APP_STATE_READONLY: {
        getSnapshot: () => ({}),
        runPropertiesCommand
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    expect(adapter.runPropertiesCommand({ type: "toggle-collapsed" }).label).toBe(
      "Read-only bridge ignored toggle-collapsed"
    );
    expect(runPropertiesCommand).not.toHaveBeenCalled();
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
