import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { createDefaultPlotypusSnapshot } from "../../core/plotypusStateAdapter";
import type { WorkspaceShell } from "./WorkspaceShell";
import { mountWorkspaceShell, type WorkspaceShellMountHandle } from "./mountWorkspaceShell";

type WorkspaceShellElement = ReactElement<Parameters<typeof WorkspaceShell>[0]>;

describe("mountWorkspaceShell", () => {
  it("does not mount when disabled", () => {
    const createRootImpl = vi.fn();

    const handle = mountWorkspaceShell({
      createRootImpl,
      enabled: false,
      snapshot: createDefaultPlotypusSnapshot(),
      target: {} as Element
    });

    expect(handle).toBeNull();
    expect(createRootImpl).not.toHaveBeenCalled();
  });

  it("mounts, updates from a new snapshot, and unmounts", () => {
    const render = vi.fn();
    const unmount = vi.fn();
    const createRootImpl = vi.fn(() => ({ render, unmount }));
    const snapshot = createDefaultPlotypusSnapshot();

    const handle = mountWorkspaceShell({
      createRootImpl,
      enabled: true,
      snapshot,
      target: {} as Element
    }) as WorkspaceShellMountHandle;

    expect(render).toHaveBeenCalledTimes(1);
    expect((render.mock.calls[0][0] as WorkspaceShellElement).props.activeWorkspace).toBe("preview");

    handle.render({
      ...snapshot,
      activeWorkspace: "projects"
    });

    expect(render).toHaveBeenCalledTimes(2);
    expect((render.mock.calls[1][0] as WorkspaceShellElement).props.activeWorkspace).toBe("projects");

    handle.unmount();
    expect(unmount).toHaveBeenCalledTimes(1);
  });
});
