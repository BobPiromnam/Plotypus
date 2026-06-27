import { createRoot, type Root } from "react-dom/client";
import type { CommandBarCommand, PlotypusSnapshot, PropertiesCommand } from "../../core/plotypusStateAdapter";
import { CommandBar, type CommandBarCopy } from "./CommandBar";

export type CommandBarMountHandle = {
  render: (snapshot: PlotypusSnapshot) => void;
  unmount: () => void;
};

type MountCommandBarOptions = {
  copy?: Partial<CommandBarCopy>;
  createRootImpl?: typeof createRoot;
  enabled: boolean;
  onCommand?: (command: CommandBarCommand) => void;
  onPropertiesCommand?: (command: PropertiesCommand) => void;
  snapshot: PlotypusSnapshot;
  target: Element | null;
};

export function mountCommandBar({
  copy,
  createRootImpl = createRoot,
  enabled,
  onCommand,
  onPropertiesCommand,
  snapshot,
  target
}: MountCommandBarOptions): CommandBarMountHandle | null {
  if (!enabled || !target) return null;

  const root: Root = createRootImpl(target);

  const render = (nextSnapshot: PlotypusSnapshot) => {
    root.render(
      <CommandBar
        copy={copy}
        onCommand={onCommand}
        onPropertiesCommand={onPropertiesCommand}
        propertiesCollapsed={nextSnapshot.properties.collapsed}
        state={nextSnapshot.commandBar}
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
