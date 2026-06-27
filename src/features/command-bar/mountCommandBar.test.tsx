import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultPlotypusSnapshot } from "../../core/plotypusStateAdapter";
import type { CommandBar } from "./CommandBar";
import { mountCommandBar, type CommandBarMountHandle } from "./mountCommandBar";

type CommandBarElement = ReactElement<Parameters<typeof CommandBar>[0]>;

describe("mountCommandBar", () => {
  it("does not mount when disabled", () => {
    const createRootImpl = vi.fn();

    const handle = mountCommandBar({
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

    const handle = mountCommandBar({
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

    const handle = mountCommandBar({
      createRootImpl,
      enabled: true,
      snapshot,
      target
    }) as CommandBarMountHandle;

    expect(createRootImpl).toHaveBeenCalledWith(target);
    expect(render).toHaveBeenCalledTimes(1);
    expect((render.mock.calls[0][0] as CommandBarElement).props.state.uiLanguage).toBe("en");

    handle.render({
      ...snapshot,
      commandBar: {
        ...snapshot.commandBar,
        uiLanguage: "fr"
      }
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect((render.mock.calls[1][0] as CommandBarElement).props.state.uiLanguage).toBe("fr");

    handle.unmount();
    expect(unmount).toHaveBeenCalledTimes(1);
  });
});
