import { describe, expect, it, vi } from "vitest";
import type { MapDetailsValue } from "./MapDetailsDialog";
import { createMapDetailsAdapter } from "./mapDetailsAdapter";
import {
  createMapDetailsSandboxController,
  createMapDetailsSandboxStore,
  initializeMapDetailsSandboxHost
} from "./mapDetailsSandboxHost";

function createButton() {
  const listeners = new Map<string, EventListener>();

  return {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }),
    click: () => listeners.get("click")?.({} as Event),
    disabled: false,
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type);
    })
  };
}

function createAdapter(initial: MapDetailsValue = {
  textEn: "",
  textFr: "",
  titleEn: "",
  titleFr: ""
}) {
  let store = initial;

  return createMapDetailsAdapter({
    read: () => store,
    write: (value) => {
      store = value;
    }
  });
}

describe("mapDetailsSandboxHost", () => {
  it("creates a sandbox adapter with seeded bilingual details", () => {
    const adapter = createMapDetailsSandboxStore();

    expect(adapter.getValue().titleEn).toBe("Sample project map");
    expect(adapter.getValue().titleFr).toBe("Carte de projet d'exemple");
  });

  it("mounts into the target and disables the mount button while mounted", () => {
    const mountHandle = { unmount: vi.fn() };
    const mount = vi.fn(() => mountHandle);
    const mountButton = createButton();
    const unmountButton = createButton();
    const status = { textContent: "" };

    const controller = createMapDetailsSandboxController({
      adapter: createAdapter(),
      elements: {
        mountButton,
        status,
        target: {} as Element,
        unmountButton
      },
      mount
    });

    controller.mountDialog();

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mountButton.disabled).toBe(true);
    expect(unmountButton.disabled).toBe(false);
    expect(status.textContent).toBe("Mounted.");
  });

  it("unmounts the active dialog and resets controls", () => {
    const mountHandle = { unmount: vi.fn() };
    const mountButton = createButton();
    const unmountButton = createButton();
    const status = { textContent: "" };
    const controller = createMapDetailsSandboxController({
      adapter: createAdapter(),
      elements: {
        mountButton,
        status,
        target: {} as Element,
        unmountButton
      },
      mount: vi.fn(() => mountHandle)
    });

    controller.mountDialog();
    controller.unmountCurrent();

    expect(mountHandle.unmount).toHaveBeenCalledTimes(1);
    expect(mountButton.disabled).toBe(false);
    expect(unmountButton.disabled).toBe(true);
    expect(status.textContent).toBe("Unmounted.");
  });

  it("resets controls when the mounted dialog saves or cancels itself", () => {
    const mountButton = createButton();
    const unmountButton = createButton();
    const status = { textContent: "" };
    let onCancel: (() => void) | undefined;
    let onSave: ((value: MapDetailsValue) => void) | undefined;
    const controller = createMapDetailsSandboxController({
      adapter: createAdapter(),
      elements: {
        mountButton,
        status,
        target: {} as Element,
        unmountButton
      },
      mount: vi.fn((options) => {
        onCancel = options.onCancel;
        onSave = options.onSave;
        return { unmount: vi.fn() };
      })
    });

    controller.mountDialog();
    onCancel?.();
    expect(mountButton.disabled).toBe(false);
    expect(unmountButton.disabled).toBe(true);
    expect(status.textContent).toBe("Cancelled.");

    controller.mountDialog();
    onSave?.({
      textEn: "Description",
      textFr: "Description",
      titleEn: "Title",
      titleFr: "Titre"
    });
    expect(mountButton.disabled).toBe(false);
    expect(unmountButton.disabled).toBe(true);
    expect(status.textContent).toBe("Saved to sandbox store.");
  });

  it("returns a no-op cleanup when sandbox markup is missing", () => {
    const documentRef = {
      getElementById: vi.fn(() => null)
    } as unknown as Document;

    const cleanup = initializeMapDetailsSandboxHost(documentRef);

    expect(() => cleanup()).not.toThrow();
  });
});
