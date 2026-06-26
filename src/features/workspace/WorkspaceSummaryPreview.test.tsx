import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDefaultPlotypusSnapshot } from "../../core/plotypusStateAdapter";
import { WorkspaceSummaryPreview } from "./WorkspaceSummaryPreview";

describe("WorkspaceSummaryPreview", () => {
  it("renders workspace metrics from the read-only snapshot", () => {
    const snapshot = createDefaultPlotypusSnapshot();
    const html = renderToStaticMarkup(<WorkspaceSummaryPreview summary={snapshot.workspaceSummary} />);

    expect(html).toContain("Workspace summary");
    expect(html).toContain("Map");
    expect(html).toContain("Rows");
    expect(html).toContain("13/13");
    expect(html).toContain("is-warning");
  });
});
