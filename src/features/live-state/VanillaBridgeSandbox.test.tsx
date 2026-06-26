import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDefaultPlotypusSnapshot, createMemoryPlotypusStateAdapter } from "../../core/plotypusStateAdapter";
import { getCommandModeUrl, VanillaBridgeCommandTestSurface, VanillaStateSnapshotPreview } from "./VanillaBridgeSandbox";

describe("VanillaStateSnapshotPreview", () => {
  it("renders React UI from a Plotypus snapshot", () => {
    const snapshot = createDefaultPlotypusSnapshot();
    const html = renderToStaticMarkup(<VanillaStateSnapshotPreview snapshot={snapshot} />);

    expect(html).toContain("State snapshot");
    expect(html).toContain("Workspace:");
    expect(html).toContain("Rows:");
    expect(html).toContain("Workspace summary");
    expect(html).toContain("Project points controls");
    expect(html).toContain("Project points preview");
    expect(html).toContain("Map baselayer preview");
    expect(html).toContain("Current Properties facts");
    expect(html).toContain("Map style");
  });

  it("reflects live project selection counts", () => {
    const snapshot = createDefaultPlotypusSnapshot();
    snapshot.projectPoints.toolbar.selectedCellCount = 8;
    snapshot.projectPoints.toolbar.selectedRowCount = 3;

    const html = renderToStaticMarkup(<VanillaStateSnapshotPreview snapshot={snapshot} />);

    expect(html).toContain("Multi select");
    expect(html).not.toContain("<select disabled");
  });

  it("renders a launch link for the command-enabled bridge surface", () => {
    const html = renderToStaticMarkup(
      <VanillaBridgeCommandTestSurface commandsEnabled={false} propertiesCollapsed={false} />
    );

    expect(html).toContain("Command bridge test");
    expect(html).toContain("Read-only mode");
    expect(html).toContain("Open command test");
    expect(html).toContain("reactCommands=1");
  });

  it("renders a command button when bridge commands are enabled", () => {
    const adapter = createMemoryPlotypusStateAdapter();
    const html = renderToStaticMarkup(
      <VanillaBridgeCommandTestSurface adapter={adapter} commandsEnabled propertiesCollapsed />
    );

    expect(html).toContain("Commands enabled");
    expect(html).toContain("Properties collapsed");
    expect(html).toContain("Toggle Properties from React");
  });

  it("adds command mode to existing bridge URLs", () => {
    expect(getCommandModeUrl("http://localhost/react-vanilla-bridge.html?workspace=preview")).toBe(
      "http://localhost/react-vanilla-bridge.html?workspace=preview&reactCommands=1"
    );
  });
});
