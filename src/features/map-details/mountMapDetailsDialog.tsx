import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MapDetailsDialog, type MapDetailsLocale, type MapDetailsValue } from "./MapDetailsDialog";
import type { MapDetailsAdapter } from "./mapDetailsAdapter";

type ReactRoot = Pick<Root, "render" | "unmount">;
type CreateRoot = (target: Element) => ReactRoot;

export type MapDetailsMountHandle = {
  unmount: () => void;
};

export type MountMapDetailsDialogOptions = {
  adapter: MapDetailsAdapter;
  createRootImpl?: CreateRoot;
  enabled: boolean;
  locale?: MapDetailsLocale;
  onCancel?: () => void;
  onSave?: (value: MapDetailsValue) => void;
  target: Element | null;
};

export function mountMapDetailsDialog({
  adapter,
  createRootImpl = createRoot,
  enabled,
  locale = "en",
  onCancel,
  onSave,
  target
}: MountMapDetailsDialogOptions): MapDetailsMountHandle | null {
  if (!enabled || !target) return null;

  const root = createRootImpl(target);
  const unmount = () => root.unmount();

  root.render(
    <MapDetailsDialog
      initialValue={adapter.getValue()}
      locale={locale}
      onCancel={() => {
        onCancel?.();
        unmount();
      }}
      onSave={(value) => {
        const saved = adapter.saveValue(value);
        onSave?.(saved);
        unmount();
      }}
    />
  );

  return { unmount };
}

export function renderMapDetailsDialogForMount(options: MountMapDetailsDialogOptions): ReactNode | null {
  const { adapter, enabled, locale = "en", onCancel, onSave, target } = options;
  if (!enabled || !target) return null;

  return (
    <MapDetailsDialog
      initialValue={adapter.getValue()}
      locale={locale}
      onCancel={onCancel}
      onSave={(value) => {
        const saved = adapter.saveValue(value);
        onSave?.(saved);
      }}
    />
  );
}
