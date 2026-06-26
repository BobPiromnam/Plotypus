import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { MapDetailsDialog, MapDetailsValue } from "./MapDetailsDialog";
import { createMapDetailsAdapter } from "./mapDetailsAdapter";
import { mountMapDetailsDialog, renderMapDetailsDialogForMount } from "./mountMapDetailsDialog";

type DialogElement = ReactElement<Parameters<typeof MapDetailsDialog>[0]>;

function createTestAdapter(initial: MapDetailsValue) {
  let store = initial;
  const write = vi.fn((value: MapDetailsValue) => {
    store = value;
  });
  const adapter = createMapDetailsAdapter({
    read: () => store,
    write
  });

  return { adapter, getStore: () => store, write };
}

describe("mountMapDetailsDialog", () => {
  it("does not mount when the feature flag is disabled", () => {
    const { adapter } = createTestAdapter({
      textEn: "",
      textFr: "",
      titleEn: "",
      titleFr: ""
    });
    const createRootImpl = vi.fn();

    const handle = mountMapDetailsDialog({
      adapter,
      createRootImpl,
      enabled: false,
      target: {} as Element
    });

    expect(handle).toBeNull();
    expect(createRootImpl).not.toHaveBeenCalled();
  });

  it("does not mount without a target element", () => {
    const { adapter } = createTestAdapter({
      textEn: "",
      textFr: "",
      titleEn: "",
      titleFr: ""
    });
    const createRootImpl = vi.fn();

    const handle = mountMapDetailsDialog({
      adapter,
      createRootImpl,
      enabled: true,
      target: null
    });

    expect(handle).toBeNull();
    expect(createRootImpl).not.toHaveBeenCalled();
  });

  it("mounts the dialog into the provided target and unmounts explicitly", () => {
    const { adapter } = createTestAdapter({
      textEn: "",
      textFr: "",
      titleEn: "Project map",
      titleFr: ""
    });
    const render = vi.fn();
    const unmount = vi.fn();
    const createRootImpl = vi.fn(() => ({ render, unmount }));
    const target = {} as Element;

    const handle = mountMapDetailsDialog({
      adapter,
      createRootImpl,
      enabled: true,
      target
    });

    expect(createRootImpl).toHaveBeenCalledWith(target);
    expect(render).toHaveBeenCalledTimes(1);

    const rendered = render.mock.calls[0][0] as DialogElement;
    expect(rendered.props.initialValue?.titleEn).toBe("Project map");

    handle?.unmount();
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it("saves through the adapter and unmounts after save", () => {
    const { adapter, getStore, write } = createTestAdapter({
      textEn: "",
      textFr: "",
      titleEn: "",
      titleFr: ""
    });
    const render = vi.fn();
    const unmount = vi.fn();
    const onSave = vi.fn();

    mountMapDetailsDialog({
      adapter,
      createRootImpl: vi.fn(() => ({ render, unmount })),
      enabled: true,
      onSave,
      target: {} as Element
    });

    const rendered = render.mock.calls[0][0] as DialogElement;
    rendered.props.onSave?.({
      textEn: " Description ",
      textFr: "",
      titleEn: " Project map ",
      titleFr: " Carte du projet "
    });

    expect(write).toHaveBeenCalledTimes(1);
    expect(getStore()).toEqual({
      textEn: "Description",
      textFr: "",
      titleEn: "Project map",
      titleFr: "Carte du projet"
    });
    expect(onSave).toHaveBeenCalledWith(getStore());
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it("can render a sandbox target without creating a root", () => {
    const { adapter } = createTestAdapter({
      textEn: "Description",
      textFr: "",
      titleEn: "Project map",
      titleFr: ""
    });

    const node = renderMapDetailsDialogForMount({
      adapter,
      enabled: true,
      locale: "fr",
      target: {} as Element
    });

    expect(renderToStaticMarkup(node as ReactElement)).toContain("Détails de la carte");
  });
});
