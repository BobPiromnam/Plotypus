import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("React migration shell", () => {
  it("renders the scaffold heading", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("React shell scaffold");
    expect(html).toContain("production app");
    expect(html).toContain("Design-system primitives");
  });
});
