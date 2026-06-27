import type { ReactNode } from "react";
import { flushSync } from "react-dom";
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
  onDraftChange?: (value: MapDetailsValue) => void;
  onSave?: (value: MapDetailsValue) => void;
  target: Element | null;
};

export function mountMapDetailsDialog({
  adapter,
  createRootImpl = createRoot,
  enabled,
  locale = "en",
  onCancel,
  onDraftChange,
  onSave,
  target
}: MountMapDetailsDialogOptions): MapDetailsMountHandle | null {
  if (!enabled || !target) return null;

  const root = createRootImpl(target);
  const unmount = () => root.unmount();

  flushSync(() => {
    root.render(
      <MapDetailsDialog
        embedded={Boolean(target.closest?.(".app-dialog"))}
        fieldIds={{
          textEn: "mapTextEnInput",
          textFr: "mapTextFrInput",
          titleEn: "mapTitleEnInput",
          titleFr: "mapTitleFrInput"
        }}
        initialValue={adapter.getValue()}
        locale={locale}
        onCancel={() => {
          onCancel?.();
          unmount();
        }}
        onDraftChange={onDraftChange}
        onSave={(value) => {
          const saved = adapter.saveValue(value);
          onSave?.(saved);
          unmount();
        }}
        titleId={target.closest?.(".app-dialog") ? "reactMapDetailsTitle" : undefined}
      />
    );
  });

  return { unmount };
}

export function renderMapDetailsDialogForMount(options: MountMapDetailsDialogOptions): ReactNode | null {
  const { adapter, enabled, locale = "en", onCancel, onDraftChange, onSave, target } = options;
  if (!enabled || !target) return null;

  return (
    <MapDetailsDialog
      embedded={Boolean(target.closest?.(".app-dialog"))}
      fieldIds={{
        textEn: "mapTextEnInput",
        textFr: "mapTextFrInput",
        titleEn: "mapTitleEnInput",
        titleFr: "mapTitleFrInput"
      }}
      initialValue={adapter.getValue()}
      locale={locale}
      onCancel={onCancel}
      onDraftChange={onDraftChange}
      onSave={(value) => {
        const saved = adapter.saveValue(value);
        onSave?.(saved);
      }}
      titleId={target.closest?.(".app-dialog") ? "reactMapDetailsTitle" : undefined}
    />
  );
}
