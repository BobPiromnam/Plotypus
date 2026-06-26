import { Button, Select, ToolbarGroup } from "../../components/primitives";

export type ProjectPointsToolbarCopy = {
  addFromSource: string;
  addGroup: string;
  addRow: string;
  clearCoordinates: string;
  clearTable: string;
  delete: string;
  language: string;
  multiSelectGroup: string;
  priority: string;
};

export type ProjectPointsToolbarState = {
  activeLanguage: "en" | "fr";
  selectedCellCount: number;
  selectedRowCount: number;
};

type ProjectPointsToolbarProps = {
  copy?: Partial<ProjectPointsToolbarCopy>;
  onAddFromSource?: () => void;
  onAddRow?: () => void;
  onClearCoordinates?: () => void;
  onClearTable?: () => void;
  onDelete?: () => void;
  onLanguageChange?: (language: ProjectPointsToolbarState["activeLanguage"]) => void;
  onPriorityChange?: (priority: string) => void;
  state: ProjectPointsToolbarState;
};

const defaultCopy: ProjectPointsToolbarCopy = {
  addFromSource: "From source",
  addGroup: "Add",
  addRow: "Row",
  clearCoordinates: "Clear coordinates",
  clearTable: "Clear table",
  delete: "Delete",
  language: "Language",
  multiSelectGroup: "Multi select",
  priority: "Priority"
};

export function ProjectPointsToolbar({
  copy: copyOverrides,
  onAddFromSource,
  onAddRow,
  onClearCoordinates,
  onClearTable,
  onDelete,
  onLanguageChange,
  onPriorityChange,
  state
}: ProjectPointsToolbarProps) {
  const copy = { ...defaultCopy, ...copyOverrides };
  const hasSelection = state.selectedCellCount > 0 || state.selectedRowCount > 0;

  return (
    <div className="project-points-toolbar-sandbox" aria-label="Project points controls">
      <ToolbarGroup label={copy.language}>
        <div className="project-points-language-toggle" role="group" aria-label={copy.language}>
          <button
            type="button"
            className={state.activeLanguage === "en" ? "is-active" : ""}
            aria-pressed={state.activeLanguage === "en"}
            onClick={() => onLanguageChange?.("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={state.activeLanguage === "fr" ? "is-active" : ""}
            aria-pressed={state.activeLanguage === "fr"}
            onClick={() => onLanguageChange?.("fr")}
          >
            FR
          </button>
        </div>
      </ToolbarGroup>

      <ToolbarGroup label={copy.addGroup}>
        <Button icon="plus" onClick={onAddRow}>
          {copy.addRow}
        </Button>
        <Button icon="table" onClick={onAddFromSource}>
          {copy.addFromSource}
        </Button>
      </ToolbarGroup>

      <ToolbarGroup label={copy.multiSelectGroup}>
        <Select
          label={copy.priority}
          value=""
          disabled={!hasSelection}
          onChange={(event) => onPriorityChange?.(event.currentTarget.value)}
          options={[
            { label: copy.priority, value: "" },
            { label: "0", value: "0" },
            { label: "1", value: "1" },
            { label: "2", value: "2" },
            { label: "3", value: "3" }
          ]}
        />
        <Button icon="eraser" disabled={!hasSelection} onClick={onClearCoordinates}>
          {copy.clearCoordinates}
        </Button>
        <Button icon="trash" disabled={!hasSelection} onClick={onDelete}>
          {copy.delete}
        </Button>
      </ToolbarGroup>

      <ToolbarGroup label="Table">
        <Button icon="eraser" variant="danger" onClick={onClearTable}>
          {copy.clearTable}
        </Button>
      </ToolbarGroup>
    </div>
  );
}
