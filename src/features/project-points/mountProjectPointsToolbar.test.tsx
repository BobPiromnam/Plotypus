import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  mountProjectPointsToolbar,
  type ProjectPointsToolbarMountHandle
} from "./mountProjectPointsToolbar";
import type { ProjectPointsToolbar } from "./ProjectPointsToolbar";

type ToolbarElement = ReactElement<Parameters<typeof ProjectPointsToolbar>[0]>;

describe("mountProjectPointsToolbar", () => {
  it("does not mount when disabled", () => {
    const createRootImpl = vi.fn();

    const handle = mountProjectPointsToolbar({
      createRootImpl,
      enabled: false,
      state: { activeLanguage: "en", selectedCellCount: 0, selectedRowCount: 0 },
      target: {} as Element
    });

    expect(handle).toBeNull();
    expect(createRootImpl).not.toHaveBeenCalled();
  });

  it("does not mount without a target", () => {
    const createRootImpl = vi.fn();

    const handle = mountProjectPointsToolbar({
      createRootImpl,
      enabled: true,
      state: { activeLanguage: "en", selectedCellCount: 0, selectedRowCount: 0 },
      target: null
    });

    expect(handle).toBeNull();
    expect(createRootImpl).not.toHaveBeenCalled();
  });

  it("mounts, updates from new vanilla state, and unmounts explicitly", () => {
    const render = vi.fn();
    const unmount = vi.fn();
    const createRootImpl = vi.fn(() => ({ render, unmount }));
    const target = {} as Element;

    const handle = mountProjectPointsToolbar({
      createRootImpl,
      enabled: true,
      state: { activeLanguage: "en", selectedCellCount: 0, selectedRowCount: 0 },
      target
    }) as ProjectPointsToolbarMountHandle;

    expect(createRootImpl).toHaveBeenCalledWith(target);
    expect(render).toHaveBeenCalledTimes(1);
    expect((render.mock.calls[0][0] as ToolbarElement).props.state.activeLanguage).toBe("en");

    handle.render({ activeLanguage: "fr", selectedCellCount: 2, selectedRowCount: 1 });

    expect(render).toHaveBeenCalledTimes(2);
    expect((render.mock.calls[1][0] as ToolbarElement).props.state.activeLanguage).toBe("fr");
    expect((render.mock.calls[1][0] as ToolbarElement).props.state.selectedCellCount).toBe(2);

    handle.unmount();
    expect(unmount).toHaveBeenCalledTimes(1);
  });
});
