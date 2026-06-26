import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Button,
  IconButton,
  PropertySection,
  SegmentedControl,
  Select,
  Switch,
  TableCell,
  TableHeaderCell,
  ToolbarGroup
} from "../components/primitives";
import { createMemoryPlotypusStateAdapter } from "../core/plotypusStateAdapter";
import { MapDetailsDialog } from "../features/map-details/MapDetailsDialog";
import { PropertiesPanelShell } from "../features/properties/PropertiesPanelShell";
import { ProjectPointsToolbar } from "../features/project-points/ProjectPointsToolbar";

export function PrimitiveGallery() {
  const plotypusState = useMemo(() => createMemoryPlotypusStateAdapter(), []);
  const snapshot = useSyncExternalStore(plotypusState.subscribe, plotypusState.getSnapshot, plotypusState.getSnapshot);
  const language = snapshot.locale;
  const [legendEnabled, setLegendEnabled] = useState(true);
  const [titleEn, setTitleEn] = useState("Project map");
  const [titleFr, setTitleFr] = useState("Carte du projet");

  return (
    <section className="react-gallery" aria-labelledby="primitiveGalleryTitle">
      <div className="react-gallery-heading">
        <p className="react-migration-kicker">Design-system primitives</p>
        <h2 id="primitiveGalleryTitle">Reusable controls before UI migration</h2>
        <p>
          These components reuse Plotypus tokens and stay isolated from the production editor until a migration slice is
          ready.
        </p>
      </div>

      <PropertySection title="Buttons">
        <div className="react-gallery-row">
          <Button icon="folder-open">Open</Button>
          <Button icon="save" variant="primary">
            Save
          </Button>
          <Button icon="trash" variant="danger">
            Delete
          </Button>
          <IconButton icon="sliders" label="Properties" />
          <Button icon="download" disabled>
            Export
          </Button>
        </div>
      </PropertySection>

      <PropertySection title="Grouped controls">
        <div className="react-gallery-row">
          <ToolbarGroup label="Add">
            <Button icon="plus">Row</Button>
            <Button icon="table">From source</Button>
          </ToolbarGroup>
          <ToolbarGroup label="Multi select">
            <Select
              label="Priority"
              value="0"
              onChange={() => undefined}
              options={[
                { label: "Priority", value: "" },
                { label: "0", value: "0" },
                { label: "1", value: "1" },
                { label: "2", value: "2" }
              ]}
            />
            <Button icon="eraser">Clear coordinates</Button>
          </ToolbarGroup>
        </div>
      </PropertySection>

      <PropertySection title="Project points toolbar slice">
        <ProjectPointsToolbar
          onLanguageChange={plotypusState.setLocale}
          state={snapshot.projectPoints.toolbar}
        />
      </PropertySection>

      <PropertySection title="Properties panel shell slice">
        <PropertiesPanelShell
          collapsed={snapshot.properties.collapsed}
          contextKind={snapshot.properties.contextKind}
          contextIcon="file-text"
          guidance="Click the map, a label, legend, or callout to inspect object-specific controls."
          onCollapse={() => plotypusState.setPropertiesCollapsed(!snapshot.properties.collapsed)}
          subtitle={snapshot.properties.subtitle}
          title={snapshot.properties.title}
          sections={[
            {
              title: "Map style",
              children: (
                <Select
                  label="Style"
                  value="goc-green"
                  onChange={() => undefined}
                  options={[
                    { label: "GoC green", value: "goc-green" },
                    { label: "GoC blue", value: "goc-blue" }
                  ]}
                />
              )
            },
            {
              title: "Display",
              children: (
                <div className="properties-shell-demo-stack">
                  <Switch checked={legendEnabled} label="Legend" onChange={setLegendEnabled} />
                  <Switch checked label="No-coordinate callouts" onChange={() => undefined} />
                </div>
              )
            }
          ]}
        />
      </PropertySection>

      <PropertySection title="Stateful controls">
        <div className="react-gallery-row">
          <SegmentedControl
            ariaLabel="Language"
            options={[
              { label: "EN", value: "en" },
              { label: "FR", value: "fr" }
            ]}
            value={language}
            onChange={plotypusState.setLocale}
          />
          <Switch
            checked={legendEnabled}
            hint="Map furniture visibility"
            label="Legend"
            onChange={setLegendEnabled}
          />
        </div>
      </PropertySection>

      <PropertySection title="Table semantics">
        <table className="pt-demo-table">
          <thead>
            <tr>
              <TableHeaderCell origin="editable">Project name</TableHeaderCell>
              <TableHeaderCell origin="editable">Priority</TableHeaderCell>
              <TableHeaderCell origin="automatic">Status</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            <tr>
              <TableCell>Grays Bay Road and Port</TableCell>
              <TableCell>0</TableCell>
              <TableCell>Mapped</TableCell>
            </tr>
          </tbody>
        </table>
      </PropertySection>

      <PropertySection title="Dialog and bilingual fields">
        <MapDetailsDialog
          initialValue={{
            textEn: "Short accessible description for the generated map.",
            textFr: "Courte description accessible de la carte générée.",
            titleEn,
            titleFr
          }}
          locale={language}
          onSave={(value) => {
            setTitleEn(value.titleEn);
            setTitleFr(value.titleFr);
          }}
        />
      </PropertySection>
    </section>
  );
}
