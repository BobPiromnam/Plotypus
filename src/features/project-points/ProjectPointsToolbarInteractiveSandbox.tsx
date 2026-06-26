import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "../../components/primitives";
import { createMemoryPlotypusStateAdapter, type PlotypusStateAdapter } from "../../core/plotypusStateAdapter";
import { ProjectPointsToolbar } from "./ProjectPointsToolbar";

type ProjectPointsToolbarInteractiveSandboxProps = {
  adapter?: PlotypusStateAdapter;
};

export function ProjectPointsToolbarInteractiveSandbox({ adapter }: ProjectPointsToolbarInteractiveSandboxProps) {
  const sandboxAdapter = useMemo(() => adapter ?? createMemoryPlotypusStateAdapter(), [adapter]);
  const snapshot = useSyncExternalStore(
    sandboxAdapter.subscribe,
    sandboxAdapter.getSnapshot,
    sandboxAdapter.getSnapshot
  );
  const [lastAction, setLastAction] = useState("No action yet");

  const selection = snapshot.projectPoints.toolbar;

  return (
    <section className="project-toolbar-interactive-sandbox" aria-labelledby="projectToolbarInteractiveSandboxTitle">
      <div className="project-toolbar-interactive-heading">
        <p className="react-migration-kicker">Adapter-backed sandbox</p>
        <h3 id="projectToolbarInteractiveSandboxTitle">Interactive Project points toolbar</h3>
        <p>
          This uses the React state adapter to prove toolbar actions can read and update sandbox state while the
          production toolbar stays vanilla.
        </p>
      </div>

      <ProjectPointsToolbar
        onAddFromSource={() => setLastAction("Add from source clicked")}
        onAddRow={() => setLastAction("Add row clicked")}
        onClearCoordinates={() => setLastAction("Clear coordinates clicked")}
        onClearTable={() => {
          sandboxAdapter.setProjectPointsSelection({ selectedCellCount: 0, selectedRowCount: 0 });
          setLastAction("Clear table clicked");
        }}
        onDelete={() => {
          sandboxAdapter.setProjectPointsSelection({ selectedCellCount: 0, selectedRowCount: 0 });
          setLastAction("Delete clicked and sandbox selection cleared");
        }}
        onLanguageChange={sandboxAdapter.setLocale}
        onPriorityChange={(priority) => {
          setLastAction(priority ? `Priority ${priority} selected` : "Priority menu opened");
        }}
        state={selection}
      />

      <div className="project-toolbar-sim-controls" aria-label="Sandbox selection controls">
        <Button icon="table" onClick={() => sandboxAdapter.setProjectPointsSelection({ selectedCellCount: 3, selectedRowCount: 1 })}>
          Select 3 cells
        </Button>
        <Button icon="eraser" onClick={() => sandboxAdapter.setProjectPointsSelection({ selectedCellCount: 0, selectedRowCount: 0 })}>
          Clear selection
        </Button>
      </div>

      <dl className="project-toolbar-state-readout">
        <div>
          <dt>Language</dt>
          <dd>{selection.activeLanguage.toUpperCase()}</dd>
        </div>
        <div>
          <dt>Selected cells</dt>
          <dd>{selection.selectedCellCount}</dd>
        </div>
        <div>
          <dt>Selected rows</dt>
          <dd>{selection.selectedRowCount}</dd>
        </div>
      </dl>

      <p className="project-toolbar-action-log" aria-live="polite">
        Last action: {lastAction}
      </p>
    </section>
  );
}
