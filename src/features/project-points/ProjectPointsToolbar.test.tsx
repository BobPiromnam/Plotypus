import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProjectPointsToolbar } from "./ProjectPointsToolbar";

describe("ProjectPointsToolbar", () => {
  it("groups add and multi-select actions with standard labels", () => {
    const html = renderToStaticMarkup(
      <ProjectPointsToolbar state={{ activeLanguage: "en", selectedCellCount: 2, selectedRowCount: 1 }} />
    );

    expect(html).toContain("Add");
    expect(html).toContain("All");
    expect(html).toContain("Missing coordinates");
    expect(html).toContain("Callouts");
    expect(html).toContain("Row");
    expect(html).toContain("From source");
    expect(html).toContain("Multi select");
    expect(html).toContain("Clear coordinates");
    expect(html).toContain("Delete");
    expect(html).toContain("Table");
    expect(html).toContain("Import CSV");
    expect(html).toContain("5");
  });

  it("disables selection-dependent actions when nothing is selected", () => {
    const html = renderToStaticMarkup(
      <ProjectPointsToolbar state={{ activeLanguage: "en", selectedCellCount: 0, selectedRowCount: 0 }} />
    );

    expect(html).toContain("disabled");
  });

  it("supports French copy overrides for future bilingual wiring", () => {
    const html = renderToStaticMarkup(
      <ProjectPointsToolbar
        copy={{
          addFromSource: "Depuis une source",
          addGroup: "Ajouter",
          addRow: "Ligne",
          clearCoordinates: "Effacer les coordonnées",
          clearTable: "Effacer le tableau",
          delete: "Supprimer",
          filters: "Filtres",
          importCsv: "Importer CSV",
          language: "Langue",
          multiSelectGroup: "Sélection multiple",
          priority: "Priorité",
          tableGroup: "Tableau"
        }}
        state={{
          activeFilter: "missing",
          activeLanguage: "fr",
          filterOptions: [
            { label: "Tous 21", value: "all" },
            { label: "Coordonnées manquantes 2", value: "missing" },
            { label: "Repères 1", value: "callouts" }
          ],
          selectedCellCount: 1,
          selectedRowCount: 0
        }}
      />
    );

    expect(html).toContain("Ajouter");
    expect(html).toContain("Coordonnées manquantes 2");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).toContain("Depuis une source");
    expect(html).toContain("Sélection multiple");
    expect(html).toContain("Importer CSV");
    expect(html).toContain("Supprimer");
  });

  it("emits language changes from the sandbox toggle", () => {
    const onLanguageChange = vi.fn();
    const toolbar = (
      <ProjectPointsToolbar
        onLanguageChange={onLanguageChange}
        state={{ activeLanguage: "en", selectedCellCount: 0, selectedRowCount: 0 }}
      />
    );

    expect(renderToStaticMarkup(toolbar)).toContain("aria-pressed=\"true\"");
  });
});
