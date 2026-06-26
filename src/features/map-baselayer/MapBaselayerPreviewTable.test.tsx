import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MapBaselayerPreviewRow } from "../../core/plotypusStateAdapter";
import { MapBaselayerPreviewTable } from "./MapBaselayerPreviewTable";

const rows: MapBaselayerPreviewRow[] = [
  {
    colour: "#c7ded5",
    colourOrder: 0,
    included: true,
    name: "Alberta",
    pointCount: 0,
    regionId: "alberta"
  },
  {
    colour: "#24745f",
    colourOrder: 3,
    included: false,
    name: "British Columbia",
    pointCount: 4,
    regionId: "british-columbia"
  }
];

describe("MapBaselayerPreviewTable", () => {
  it("renders read-only baselayer rows with editable and automatic column hints", () => {
    const html = renderToStaticMarkup(
      <MapBaselayerPreviewTable
        boundary="Canada provinces and territories"
        includedCount={1}
        regionCount={2}
        rows={rows}
      />
    );

    expect(html).toContain("Map baselayer preview");
    expect(html).toContain("Canada provinces and territories");
    expect(html).toContain("1/2 included");
    expect(html).toContain("Alberta");
    expect(html).toContain("#24745f");
    expect(html).toContain("aria-label=\"editable\"");
    expect(html).toContain("aria-label=\"automatic\"");
  });

  it("renders an empty state when the bridge has no baselayer rows", () => {
    const html = renderToStaticMarkup(
      <MapBaselayerPreviewTable boundary="Unknown boundary" includedCount={0} regionCount={0} rows={[]} />
    );

    expect(html).toContain("No baselayer rows in the read-only snapshot.");
  });
});
