import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MapDetailsDialog } from "./MapDetailsDialog";
import { getMissingMapDetailsFields } from "./mapDetailsAdapter";

describe("MapDetailsDialog", () => {
  it("allows partial map details while reporting missing fields", () => {
    const missing = getMissingMapDetailsFields({
      textEn: "",
      textFr: "",
      titleEn: "Project map",
      titleFr: ""
    });

    expect(missing).toEqual(["titleFr", "textEn", "textFr"]);
  });

  it("renders English dialog copy", () => {
    const html = renderToStaticMarkup(
      <MapDetailsDialog
        initialValue={{
          textEn: "",
          textFr: "",
          titleEn: "Project map",
          titleFr: ""
        }}
      />
    );

    expect(html).toContain("Map details");
    expect(html).toContain("Both languages are required.");
    expect(html).toContain("Save map details");
    expect(html).toContain('data-missing-count="3"');
  });

  it("renders French dialog copy", () => {
    const html = renderToStaticMarkup(
      <MapDetailsDialog
        locale="fr"
        initialValue={{
          textEn: "Description",
          textFr: "Description française",
          titleEn: "Project map",
          titleFr: "Carte du projet"
        }}
      />
    );

    expect(html).toContain("Détails de la carte");
    expect(html).toContain("Les deux langues sont requises.");
    expect(html).toContain("Enregistrer les détails de la carte");
    expect(html).toContain('data-missing-count="0"');
  });
});
