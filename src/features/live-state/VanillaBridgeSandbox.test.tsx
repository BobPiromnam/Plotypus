import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDefaultPlotypusSnapshot } from "../../core/plotypusStateAdapter";
import { VanillaStateSnapshotPreview } from "./VanillaBridgeSandbox";

describe("VanillaStateSnapshotPreview", () => {
  it("renders React UI from a Plotypus snapshot", () => {
    const snapshot = createDefaultPlotypusSnapshot();
    const html = renderToStaticMarkup(<VanillaStateSnapshotPreview snapshot={snapshot} />);

    expect(html).toContain("State snapshot");
    expect(html).toContain("Workspace:");
    expect(html).toContain("Rows:");
    expect(html).toContain("Project points controls");
    expect(html).toContain("Project points preview");
    expect(html).toContain("Bridge data");
  });

  it("reflects live project selection counts", () => {
    const snapshot = createDefaultPlotypusSnapshot();
    snapshot.projectPoints.toolbar.selectedCellCount = 8;
    snapshot.projectPoints.toolbar.selectedRowCount = 3;

    const html = renderToStaticMarkup(<VanillaStateSnapshotPreview snapshot={snapshot} />);

    expect(html).toContain("<dd>8</dd>");
    expect(html).toContain("<dd>3</dd>");
  });
});
