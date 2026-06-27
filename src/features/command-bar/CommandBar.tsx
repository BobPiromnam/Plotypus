import { Button, Icon, SegmentedControl } from "../../components/primitives";
import type { CommandBarCommand, CommandBarSnapshot, PlotypusLocale, PropertiesCommand } from "../../core/plotypusStateAdapter";

export type CommandBarCopy = {
  appSubtitle: string;
  export: string;
  exportCsv: string;
  exportPngDescription: string;
  exportPngTitle: string;
  exportSvgDescription: string;
  exportSvgTitle: string;
  importCsv: string;
  language: string;
  mapDetails: string;
  open: string;
  properties: string;
  sample: string;
  save: string;
  undo: string;
};

type CommandBarProps = {
  copy?: Partial<CommandBarCopy>;
  onCommand?: (command: CommandBarCommand) => void;
  onPropertiesCommand?: (command: PropertiesCommand) => void;
  propertiesCollapsed?: boolean;
  state: CommandBarSnapshot;
};

const defaultCopy: CommandBarCopy = {
  appSubtitle: "CSV -> Static map",
  export: "Export",
  exportCsv: "Export CSV",
  exportPngDescription: "Raster image for documents",
  exportPngTitle: "Export PNG",
  exportSvgDescription: "Editable vector artwork",
  exportSvgTitle: "Export SVG",
  importCsv: "Import CSV",
  language: "Language",
  mapDetails: "Map details",
  open: "Open",
  properties: "Properties",
  sample: "Sample",
  save: "Save",
  undo: "Undo"
};

export function CommandBar({
  copy,
  onCommand,
  onPropertiesCommand,
  propertiesCollapsed = false,
  state
}: CommandBarProps) {
  const labels = { ...defaultCopy, ...copy };
  const languageOptions: Array<{ label: string; value: PlotypusLocale }> = [
    { label: "EN", value: "en" },
    { label: "FR", value: "fr" }
  ];

  return (
    <div className="react-command-bar" aria-label="Application actions">
      <div className="react-command-brand" aria-label="Application identity">
        <img src="assets/plotypus-pin.png" alt="" aria-hidden="true" width="32" height="32" />
        <div>
          <h1>Plotypus</h1>
          <p>{labels.appSubtitle}</p>
        </div>
      </div>

      <div className="react-command-group" aria-label="Project file actions">
        <Button icon="undo" iconOnly disabled={!state.canUndo} onClick={() => onCommand?.({ type: "undo" })}>
          {labels.undo}
        </Button>
        <Button icon="folder-open" onClick={() => onCommand?.({ type: "open-project" })}>
          {labels.open}
        </Button>
        <Button icon="save" onClick={() => onCommand?.({ type: "save-project" })}>
          {labels.save}
        </Button>
      </div>

      <div className="react-command-group" aria-label="Project data actions">
        <Button icon="table" onClick={() => onCommand?.({ type: "load-sample" })}>
          {labels.sample}
        </Button>
        <Button icon="upload" onClick={() => onCommand?.({ type: "import-csv" })}>
          {labels.importCsv}
        </Button>
        <Button icon="download" onClick={() => onCommand?.({ type: "export-csv" })}>
          {labels.exportCsv}
        </Button>
      </div>

      <div className="react-command-spacer" />

      <div className="react-command-group react-command-appearance" aria-label="Map appearance actions">
        <Button
          className={state.mapDetailsNeedsFrench ? "has-warning" : ""}
          icon="file-text"
          onClick={() => onCommand?.({ type: "open-map-details" })}
        >
          {labels.mapDetails}
          {state.mapDetailsNeedsFrench ? <span className="react-command-warning">FR</span> : null}
        </Button>
        <Button
          aria-pressed={!propertiesCollapsed}
          icon="sliders"
          onClick={() => onPropertiesCommand?.({ type: "toggle-collapsed" })}
        >
          {labels.properties}
        </Button>
        <div className="react-command-language">
          <span>{labels.language}</span>
          <SegmentedControl<PlotypusLocale>
            ariaLabel={labels.language}
            options={languageOptions}
            value={state.uiLanguage}
            onChange={(language) => onCommand?.({ language, type: "set-ui-language" })}
          />
        </div>
      </div>

      <div className="react-command-export">
        <Button
          aria-controls="reactCommandExportMenu"
          aria-expanded={state.exportMenuOpen}
          aria-haspopup="menu"
          icon="download"
          variant="primary"
          onClick={() => onCommand?.({ type: "toggle-export-menu" })}
        >
          {labels.export}
        </Button>
        {state.exportMenuOpen ? (
          <div id="reactCommandExportMenu" className="react-command-export-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => onCommand?.({ type: "export-png" })}>
              <Icon name="image" />
              <span>
                <strong>{labels.exportPngTitle}</strong>
                <small>{labels.exportPngDescription}</small>
              </span>
            </button>
            <button type="button" role="menuitem" onClick={() => onCommand?.({ type: "export-svg" })}>
              <Icon name="svg-file" />
              <span>
                <strong>{labels.exportSvgTitle}</strong>
                <small>{labels.exportSvgDescription}</small>
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
