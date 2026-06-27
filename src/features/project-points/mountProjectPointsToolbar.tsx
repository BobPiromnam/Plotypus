import { createRoot, type Root } from "react-dom/client";
import {
  ProjectPointsToolbar,
  type ProjectPointsToolbarCopy,
  type ProjectPointsToolbarState
} from "./ProjectPointsToolbar";

export type ProjectPointsToolbarMountHandle = {
  render: (state: ProjectPointsToolbarState) => void;
  unmount: () => void;
};

type MountProjectPointsToolbarOptions = {
  copy?: Partial<ProjectPointsToolbarCopy>;
  createRootImpl?: typeof createRoot;
  enabled: boolean;
  onAddFromSource?: () => void;
  onAddRow?: () => void;
  onClearCoordinates?: () => void;
  onClearTable?: () => void;
  onDelete?: () => void;
  onFilterChange?: (filter: NonNullable<ProjectPointsToolbarState["activeFilter"]>) => void;
  onImportCsv?: () => void;
  onLanguageChange?: (language: ProjectPointsToolbarState["activeLanguage"]) => void;
  onPriorityChange?: (priority: string) => void;
  state: ProjectPointsToolbarState;
  target: Element | null;
};

export function mountProjectPointsToolbar({
  copy,
  createRootImpl = createRoot,
  enabled,
  onAddFromSource,
  onAddRow,
  onClearCoordinates,
  onClearTable,
  onDelete,
  onFilterChange,
  onImportCsv,
  onLanguageChange,
  onPriorityChange,
  state,
  target
}: MountProjectPointsToolbarOptions): ProjectPointsToolbarMountHandle | null {
  if (!enabled || !target) return null;

  const root: Root = createRootImpl(target);

  const render = (nextState: ProjectPointsToolbarState) => {
    root.render(
      <ProjectPointsToolbar
        copy={copy}
        onAddFromSource={onAddFromSource}
        onAddRow={onAddRow}
        onClearCoordinates={onClearCoordinates}
        onClearTable={onClearTable}
        onDelete={onDelete}
        onFilterChange={onFilterChange}
        onImportCsv={onImportCsv}
        onLanguageChange={onLanguageChange}
        onPriorityChange={onPriorityChange}
        state={nextState}
      />
    );
  };

  render(state);

  return {
    render,
    unmount() {
      root.unmount();
    }
  };
}
