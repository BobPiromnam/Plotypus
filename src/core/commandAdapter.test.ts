import { describe, expect, it } from "vitest";
import { createCommandResult, createReadOnlyCommandResult } from "./commandAdapter";

describe("commandAdapter", () => {
  it("creates a standard adapter command result", () => {
    expect(createCommandResult("Action requested")).toEqual({ label: "Action requested" });
  });

  it("creates a standard read-only bridge result", () => {
    expect(createReadOnlyCommandResult("add-row")).toEqual({ label: "Read-only bridge ignored add-row" });
  });
});
