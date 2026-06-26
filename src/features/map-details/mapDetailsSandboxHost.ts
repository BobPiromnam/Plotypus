import type { MapDetailsValue } from "./MapDetailsDialog";
import { createMapDetailsAdapter, type MapDetailsAdapter } from "./mapDetailsAdapter";
import { mountMapDetailsDialog, type MapDetailsMountHandle } from "./mountMapDetailsDialog";

type SandboxButton = Pick<HTMLButtonElement, "addEventListener" | "disabled" | "removeEventListener">;
type SandboxStatus = Pick<HTMLElement, "textContent">;

type SandboxHostElements = {
  mountButton: SandboxButton;
  status: SandboxStatus;
  target: Element;
  unmountButton: SandboxButton;
};

type SandboxMount = (options: {
  adapter: MapDetailsAdapter;
  enabled: boolean;
  onCancel: () => void;
  onSave: (value: MapDetailsValue) => void;
  target: Element;
}) => MapDetailsMountHandle | null;

type SandboxControllerOptions = {
  adapter: MapDetailsAdapter;
  elements: SandboxHostElements;
  mount?: SandboxMount;
};

export function createMapDetailsSandboxStore(initial: MapDetailsValue = {
  textEn: "Sample map description",
  textFr: "Description d'exemple de la carte",
  titleEn: "Sample project map",
  titleFr: "Carte de projet d'exemple"
}) {
  let store = initial;

  return createMapDetailsAdapter({
    read: () => store,
    write: (value) => {
      store = value;
    }
  });
}

export function createMapDetailsSandboxController({
  adapter,
  elements,
  mount = mountMapDetailsDialog
}: SandboxControllerOptions) {
  let handle: MapDetailsMountHandle | null = null;

  const setStatus = (message: string) => {
    elements.status.textContent = message;
  };

  const setMountedState = (isMounted: boolean) => {
    elements.mountButton.disabled = isMounted;
    elements.unmountButton.disabled = !isMounted;
  };

  const unmountCurrent = () => {
    handle?.unmount();
    handle = null;
    setMountedState(false);
    setStatus("Unmounted.");
  };

  const mountDialog = () => {
    handle?.unmount();
    handle = mount({
      adapter,
      enabled: true,
      onCancel: () => {
        handle = null;
        setMountedState(false);
        setStatus("Cancelled.");
      },
      onSave: () => {
        handle = null;
        setMountedState(false);
        setStatus("Saved to sandbox store.");
      },
      target: elements.target
    });

    if (handle) {
      setMountedState(true);
      setStatus("Mounted.");
    }
  };

  const cleanup = () => {
    handle?.unmount();
    handle = null;
    setMountedState(false);
  };

  return {
    cleanup,
    mountDialog,
    unmountCurrent
  };
}

export function initializeMapDetailsSandboxHost(documentRef: Document = document) {
  const mountButton = documentRef.getElementById("mountMapDetailsSandboxBtn") as HTMLButtonElement | null;
  const unmountButton = documentRef.getElementById("unmountMapDetailsSandboxBtn") as HTMLButtonElement | null;
  const target = documentRef.getElementById("mapDetailsSandboxTarget");
  const status = documentRef.getElementById("mapDetailsSandboxStatus");

  if (!mountButton || !unmountButton || !target || !status) {
    return () => undefined;
  }

  const controller = createMapDetailsSandboxController({
    adapter: createMapDetailsSandboxStore(),
    elements: {
      mountButton,
      status,
      target,
      unmountButton
    }
  });

  mountButton.addEventListener("click", controller.mountDialog);
  unmountButton.addEventListener("click", controller.unmountCurrent);
  unmountButton.disabled = true;

  return () => {
    mountButton.removeEventListener("click", controller.mountDialog);
    unmountButton.removeEventListener("click", controller.unmountCurrent);
    controller.cleanup();
  };
}
