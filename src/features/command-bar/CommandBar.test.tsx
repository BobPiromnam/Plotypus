import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommandBar } from "./CommandBar";
import type { CommandBarSnapshot } from "../../core/plotypusStateAdapter";

const state: CommandBarSnapshot = {
  canUndo: true,
  exportMenuOpen: false,
  mapDetailsMissingCount: 2,
  mapDetailsNeedsFrench: true,
  mapLanguage: "en",
  mapStyle: "GoC green",
  uiLanguage: "en"
};

describe("CommandBar", () => {
  it("renders the production command groups and warning badge", () => {
    const html = renderToStaticMarkup(<CommandBar state={state} />);

    expect(html).toContain("Plotypus");
    expect(html).toContain("Open");
    expect(html).toContain("Save");
    expect(html).toContain("Sample");
    expect(html).toContain("Import CSV");
    expect(html).toContain("Export CSV");
    expect(html).toContain("Map details");
    expect(html).toContain("FR");
    expect(html).toContain("Language");
    expect(html).toContain("Export");
  });

  it("renders the export menu when open", () => {
    const html = renderToStaticMarkup(
      <CommandBar
        state={{
          ...state,
          exportMenuOpen: true
        }}
      />
    );

    expect(html).toContain("Export PNG");
    expect(html).toContain("Export SVG");
    expect(html).toContain("role=\"menu\"");
  });

  it("accepts French copy for production app wiring", () => {
    const html = renderToStaticMarkup(
      <CommandBar
        copy={{
          export: "Exporter",
          importCsv: "Importer CSV",
          language: "Langue",
          mapDetails: "Détails de la carte",
          open: "Ouvrir",
          save: "Enregistrer"
        }}
        state={{
          ...state,
          uiLanguage: "fr"
        }}
      />
    );

    expect(html).toContain("Exporter");
    expect(html).toContain("Importer CSV");
    expect(html).toContain("Langue");
    expect(html).toContain("Détails de la carte");
    expect(html).toContain("aria-pressed=\"true\"");
  });
});
