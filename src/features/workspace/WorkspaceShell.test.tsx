import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDefaultPlotypusSnapshot } from "../../core/plotypusStateAdapter";
import { WorkspaceShell } from "./WorkspaceShell";

describe("WorkspaceShell", () => {
  it("renders workspace tabs and summary metrics", () => {
    const snapshot = createDefaultPlotypusSnapshot();
    const html = renderToStaticMarkup(
      <WorkspaceShell activeWorkspace="preview" summary={snapshot.workspaceSummary} />
    );

    expect(html).toContain("Map");
    expect(html).toContain("Project points");
    expect(html).toContain("Map baselayer");
    expect(html).toContain("Map quality");
    expect(html).toContain("Rows");
    expect(html).toContain("21");
    expect(html).toContain("aria-selected=\"true\"");
  });

  it("accepts French copy for production app wiring", () => {
    const snapshot = createDefaultPlotypusSnapshot();
    const html = renderToStaticMarkup(
      <WorkspaceShell
        activeWorkspace="translate"
        copy={{
          categories: "Catégories et repères",
          map: "Carte",
          projects: "Points de projet",
          quality: "Qualité de la carte",
          regions: "Fond de carte",
          translate: "Traduire"
        }}
        summary={snapshot.workspaceSummary}
      />
    );

    expect(html).toContain("Carte");
    expect(html).toContain("Fond de carte");
    expect(html).toContain("Traduire");
  });
});
