import { createRoot, type Root } from "react-dom/client";
import type { PlotypusSnapshot, WorkspaceSummaryMetric, WorkspaceValue } from "../../core/plotypusStateAdapter";
import { WorkspaceShell, type WorkspaceShellCopy } from "./WorkspaceShell";

export type WorkspaceShellMountHandle = {
  render: (snapshot: PlotypusSnapshot) => void;
  unmount: () => void;
};

type MountWorkspaceShellOptions = {
  copy?: Partial<WorkspaceShellCopy>;
  createRootImpl?: typeof createRoot;
  enabled: boolean;
  onSummaryAction?: (metric: WorkspaceSummaryMetric) => void;
  onWorkspaceChange?: (workspace: WorkspaceValue) => void;
  snapshot: PlotypusSnapshot;
  target: Element | null;
};

export function mountWorkspaceShell({
  copy,
  createRootImpl = createRoot,
  enabled,
  onSummaryAction,
  onWorkspaceChange,
  snapshot,
  target
}: MountWorkspaceShellOptions): WorkspaceShellMountHandle | null {
  if (!enabled || !target) return null;

  const root: Root = createRootImpl(target);

  const render = (nextSnapshot: PlotypusSnapshot) => {
    root.render(
      <WorkspaceShell
        activeWorkspace={nextSnapshot.activeWorkspace}
        copy={copy}
        onSummaryAction={onSummaryAction}
        onWorkspaceChange={onWorkspaceChange}
        summary={nextSnapshot.workspaceSummary}
      />
    );
  };

  render(snapshot);

  return {
    render,
    unmount() {
      root.unmount();
    }
  };
}
