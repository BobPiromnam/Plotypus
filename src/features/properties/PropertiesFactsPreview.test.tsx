import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertiesFactsPreview } from "./PropertiesFactsPreview";

describe("PropertiesFactsPreview", () => {
  it("renders properties sections with editable and automatic origin icons", () => {
    const html = renderToStaticMarkup(
      <PropertiesFactsPreview
        sections={[
          {
            title: "Map size",
            rows: [
              { label: "Canvas size", origin: "editable", value: "Full page" },
              { label: "Regions", origin: "automatic", value: "13/13" }
            ]
          }
        ]}
      />
    );

    expect(html).toContain("Map size");
    expect(html).toContain("Canvas size");
    expect(html).toContain("13/13");
    expect(html).toContain("aria-label=\"editable\"");
    expect(html).toContain("aria-label=\"automatic\"");
  });

  it("renders an empty state when no sections are available", () => {
    const html = renderToStaticMarkup(<PropertiesFactsPreview sections={[]} />);

    expect(html).toContain("No Properties facts in the read-only snapshot.");
  });
});
