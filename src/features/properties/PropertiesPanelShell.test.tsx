import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "../../components/primitives";
import { PropertiesPanelShell } from "./PropertiesPanelShell";

const sections = [
  {
    title: "Display",
    children: <p>Legend and callout controls</p>,
    actions: <Button icon="sliders">Reset</Button>
  },
  {
    title: "Interaction",
    children: <p>Lock markers and distance guides</p>
  }
];

describe("PropertiesPanelShell", () => {
  it("renders the standard right-panel heading and context copy", () => {
    const html = renderToStaticMarkup(
      <PropertiesPanelShell
        contextKind="Document"
        guidance="Click the map, a label, legend, or callout for object-specific controls."
        sections={sections}
        subtitle="Map display and interaction"
        title="Document"
      />
    );

    expect(html).toContain("Properties");
    expect(html).toContain("Document");
    expect(html).toContain("Map display and interaction");
    expect(html).toContain("Click the map");
    expect(html).toContain("Display");
    expect(html).toContain("Interaction");
  });

  it("renders actions inside their owning section", () => {
    const html = renderToStaticMarkup(
      <PropertiesPanelShell
        contextKind="Map"
        guidance="Choose the geographic extent and which regions appear on the map."
        sections={sections}
        subtitle="Boundary and region selection"
        title="Map baselayer"
      />
    );

    expect(html).toContain("Reset");
    expect(html.indexOf("Display")).toBeLessThan(html.indexOf("Reset"));
  });

  it("renders a compact rail when collapsed", () => {
    const html = renderToStaticMarkup(
      <PropertiesPanelShell
        collapsed
        contextKind="Document"
        guidance="Hidden while collapsed."
        sections={sections}
        subtitle="Map display and interaction"
        title="Document"
      />
    );

    expect(html).toContain("properties-shell-collapsed");
    expect(html).toContain("Expand properties");
    expect(html).not.toContain("Hidden while collapsed.");
  });
});
