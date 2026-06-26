import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createDefaultPlotypusSnapshot, createMemoryPlotypusStateAdapter } from "../../core/plotypusStateAdapter";
import { ProjectPointsToolbarInteractiveSandbox } from "./ProjectPointsToolbarInteractiveSandbox";

describe("ProjectPointsToolbarInteractiveSandbox", () => {
  it("renders an adapter-backed toolbar sandbox with state readouts", () => {
    const html = renderToStaticMarkup(<ProjectPointsToolbarInteractiveSandbox />);

    expect(html).toContain("Adapter-backed sandbox");
    expect(html).toContain("Interactive Project points toolbar");
    expect(html).toContain("Select 3 cells");
    expect(html).toContain("Clear selection");
    expect(html).toContain("Last action: No action yet");
  });

  it("renders from an injected adapter without mutating production state", () => {
    const snapshot = createDefaultPlotypusSnapshot();
    snapshot.projectPoints.toolbar = {
      activeLanguage: "fr",
      selectedCellCount: 0,
      selectedRowCount: 0
    };
    const adapter = createMemoryPlotypusStateAdapter(snapshot);

    const html = renderToStaticMarkup(<ProjectPointsToolbarInteractiveSandbox adapter={adapter} />);

    expect(html).toContain("<dd>FR</dd>");
    expect(html).toContain("<dd>0</dd>");
  });
});
