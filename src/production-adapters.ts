import { createMapDetailsAdapter } from "./features/map-details/mapDetailsAdapter";
import { mountMapDetailsDialog } from "./features/map-details/mountMapDetailsDialog";
import type { MapDetailsLocale, MapDetailsValue } from "./features/map-details/MapDetailsDialog";
import "./components/primitives/primitives.css";
import "./react-shell.css";

type MapDetailsMountOptions = {
  locale?: MapDetailsLocale;
  onCancel?: () => void;
  onDraftChange?: (value: MapDetailsValue) => void;
  onSave?: (value: MapDetailsValue) => void;
  read: () => Partial<MapDetailsValue>;
  target: Element | null;
  write: (value: MapDetailsValue) => void;
};

type PlotypusReactAdapters = {
  mountMapDetailsDialog: (options: MapDetailsMountOptions) => { unmount: () => void } | null;
};

declare global {
  interface Window {
    PLOTYPUS_REACT_ADAPTERS?: PlotypusReactAdapters;
  }
}

window.PLOTYPUS_REACT_ADAPTERS = {
  mountMapDetailsDialog({ locale = "en", onCancel, onDraftChange, onSave, read, target, write }) {
    return mountMapDetailsDialog({
      adapter: createMapDetailsAdapter({ read, write }),
      enabled: true,
      locale,
      onCancel,
      onDraftChange,
      onSave,
      target
    });
  }
};
