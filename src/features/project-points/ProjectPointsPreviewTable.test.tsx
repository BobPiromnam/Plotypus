import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDefaultPlotypusSnapshot } from "../../core/plotypusStateAdapter";
import { ProjectPointsPreviewTable } from "./ProjectPointsPreviewTable";

describe("ProjectPointsPreviewTable", () => {
  it("renders project rows from the read-only snapshot", () => {
    const rows = createDefaultPlotypusSnapshot().projectPoints.previewRows;
    const html = renderToStaticMarkup(<ProjectPointsPreviewTable rows={rows} />);

    expect(html).toContain("Project points preview");
    expect(html).toContain("Grays Bay Road and Port");
    expect(html).toContain("Mapped");
    expect(html).toContain("No coord.");
  });

  it("renders an empty state when no rows are available", () => {
    const html = renderToStaticMarkup(<ProjectPointsPreviewTable rows={[]} />);

    expect(html).toContain("No project rows in the read-only snapshot.");
  });
});
