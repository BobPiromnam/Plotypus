import { describe, expect, it, vi } from "vitest";
import {
  createMapDetailsAdapter,
  getMissingMapDetailsFields,
  normalizeMapDetailsValue,
  trimMapDetailsValue
} from "./mapDetailsAdapter";

describe("mapDetailsAdapter", () => {
  it("normalizes unknown persisted values into the dialog shape", () => {
    expect(normalizeMapDetailsValue({ textEn: 42, titleFr: "Carte" })).toEqual({
      textEn: "42",
      textFr: "",
      titleEn: "",
      titleFr: "Carte"
    });
  });

  it("trims values only on save", () => {
    expect(
      trimMapDetailsValue({
        textEn: " Description ",
        textFr: " Description française ",
        titleEn: " Project map ",
        titleFr: " Carte du projet "
      })
    ).toEqual({
      textEn: "Description",
      textFr: "Description française",
      titleEn: "Project map",
      titleFr: "Carte du projet"
    });
  });

  it("reports missing fields without blocking partial values", () => {
    expect(
      getMissingMapDetailsFields({
        textEn: "",
        textFr: "",
        titleEn: "Project map",
        titleFr: ""
      })
    ).toEqual(["titleFr", "textEn", "textFr"]);
  });

  it("adapts a mutable vanilla-style store behind a stable interface", () => {
    let store = {
      textEn: "",
      textFr: "",
      titleEn: " Project map ",
      titleFr: ""
    };
    const afterSave = vi.fn();
    const adapter = createMapDetailsAdapter({
      onAfterSave: afterSave,
      read: () => store,
      write: (value) => {
        store = value;
      }
    });

    expect(adapter.getValue().titleEn).toBe(" Project map ");

    const saved = adapter.saveValue({
      textEn: " Description ",
      textFr: "",
      titleEn: " Project map ",
      titleFr: " Carte du projet "
    });

    expect(saved).toEqual({
      textEn: "Description",
      textFr: "",
      titleEn: "Project map",
      titleFr: "Carte du projet"
    });
    expect(store).toEqual(saved);
    expect(afterSave).toHaveBeenCalledWith(saved);
    expect(adapter.getMissingFields()).toEqual(["textFr"]);
  });
});
