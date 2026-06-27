import { Button, Select, ToolbarGroup } from "../../components/primitives";

export type ProjectFilterValue = "all" | "missing" | "callouts";

export type ProjectFilterOption = {
  label: string;
  value: ProjectFilterValue;
};

export type ProjectPointsToolbarCopy = {
  addFromSource: string;
  addGroup: string;
  addRow: string;
  clearCoordinates: string;
  clearTable: string;
  delete: string;
  filters: string;
  importCsv: string;
  language: string;
  multiSelectGroup: string;
  priority: string;
  tableGroup: string;
};

export type ProjectPointsToolbarState = {
  activeFilter?: ProjectFilterValue;
  activeLanguage: "en" | "fr";
  filterOptions?: ProjectFilterOption[];
  selectedCellCount: number;
  selectedCoordinateCellCount?: number;
  selectedPriorityCellCount?: number;
  selectedRowCount: number;
};

type ProjectPointsToolbarProps = {
  copy?: Partial<ProjectPointsToolbarCopy>;
  onAddFromSource?: () => void;
  onAddRow?: () => void;
  onClearCoordinates?: () => void;
  onClearTable?: () => void;
  onDelete?: () => void;
  onFilterChange?: (filter: ProjectFilterValue) => void;
  onImportCsv?: () => void;
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
  filters: "Project point filters",
  importCsv: "Import CSV",
  language: "Language",
  multiSelectGroup: "Multi select",
  priority: "Priority",
  tableGroup: "Table"
};

export function ProjectPointsToolbar({
  copy: copyOverrides,
  onAddFromSource,
  onAddRow,
  onClearCoordinates,
  onClearTable,
  onDelete,
  onFilterChange,
  onImportCsv,
  onLanguageChange,
  onPriorityChange,
  state
}: ProjectPointsToolbarProps) {
  const copy = { ...defaultCopy, ...copyOverrides };
  const hasSelection = state.selectedCellCount > 0 || state.selectedRowCount > 0;
  const hasCoordinateSelection = (state.selectedCoordinateCellCount ?? state.selectedCellCount) > 0;
  const hasPrioritySelection = (state.selectedPriorityCellCount ?? state.selectedCellCount) > 0;
  const activeFilter = state.activeFilter ?? "all";
  const filterOptions = state.filterOptions ?? [
    { label: "All", value: "all" },
    { label: "Missing coordinates", value: "missing" },
    { label: "Callouts", value: "callouts" }
  ];

  return (
    <div className="project-points-toolbar-sandbox" aria-label="Project points controls">
      <div className="project-table-filters" aria-label={copy.filters}>
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === activeFilter ? "is-active" : ""}
            aria-pressed={option.value === activeFilter}
            data-react-project-filter={option.value}
            onClick={() => onFilterChange?.(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

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
          disabled={!hasPrioritySelection}
          onChange={(event) => onPriorityChange?.(event.currentTarget.value)}
          options={[
            { label: copy.priority, value: "" },
            { label: "0", value: "0" },
            { label: "1", value: "1" },
            { label: "2", value: "2" },
            { label: "3", value: "3" },
            { label: "4", value: "4" },
            { label: "5", value: "5" }
          ]}
        />
        <Button icon="eraser" disabled={!hasCoordinateSelection} onClick={onClearCoordinates}>
          {copy.clearCoordinates}
        </Button>
        <Button icon="trash" disabled={!hasSelection} onClick={onDelete}>
          {copy.delete}
        </Button>
      </ToolbarGroup>

      <ToolbarGroup label={copy.tableGroup}>
        <Button icon="download" onClick={onImportCsv}>
          {copy.importCsv}
        </Button>
        <Button icon="eraser" variant="danger" onClick={onClearTable}>
          {copy.clearTable}
        </Button>
      </ToolbarGroup>
    </div>
  );
}
