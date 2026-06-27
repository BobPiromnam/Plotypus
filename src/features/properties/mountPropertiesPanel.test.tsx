import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultPlotypusSnapshot, type PropertiesPanelSnapshot } from "../../core/plotypusStateAdapter";
import { mountPropertiesPanel, type PropertiesPanelMountHandle } from "./mountPropertiesPanel";

type MountedPropertiesElement = ReactElement<{
  locale: "en" | "fr";
  properties: PropertiesPanelSnapshot;
}>;

describe("mountPropertiesPanel", () => {
  it("does not mount when disabled", () => {
    const createRootImpl = vi.fn();

    const handle = mountPropertiesPanel({
      createRootImpl,
      enabled: false,
      snapshot: createDefaultPlotypusSnapshot(),
      target: {} as Element
    });

    expect(handle).toBeNull();
    expect(createRootImpl).not.toHaveBeenCalled();
  });

  it("does not mount without a target", () => {
    const createRootImpl = vi.fn();

    const handle = mountPropertiesPanel({
      createRootImpl,
      enabled: true,
      snapshot: createDefaultPlotypusSnapshot(),
      target: null
    });

    expect(handle).toBeNull();
    expect(createRootImpl).not.toHaveBeenCalled();
  });

  it("mounts, updates from new vanilla snapshot, and unmounts explicitly", () => {
    const render = vi.fn();
    const unmount = vi.fn();
    const createRootImpl = vi.fn(() => ({ render, unmount }));
    const target = {} as Element;
    const snapshot = createDefaultPlotypusSnapshot();

    const handle = mountPropertiesPanel({
      createRootImpl,
      enabled: true,
      snapshot,
      target
    }) as PropertiesPanelMountHandle;

    expect(createRootImpl).toHaveBeenCalledWith(target);
    expect(render).toHaveBeenCalledTimes(1);
    expect((render.mock.calls[0][0] as MountedPropertiesElement).props.properties.title).toBe("Document");

    handle.render({
      ...snapshot,
      locale: "fr",
      properties: {
        ...snapshot.properties,
        title: "Aucune sélection"
      }
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect((render.mock.calls[1][0] as MountedPropertiesElement).props.locale).toBe("fr");
    expect((render.mock.calls[1][0] as MountedPropertiesElement).props.properties.title).toBe("Aucune sélection");

    handle.unmount();
    expect(unmount).toHaveBeenCalledTimes(1);
  });
});
