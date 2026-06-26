import type { MapDetailsValue } from "./MapDetailsDialog";

export type MapDetailsField = keyof MapDetailsValue;
export type MapDetailsSource = Partial<Record<MapDetailsField, unknown>>;

export type MapDetailsAdapter = {
  getMissingFields: (value?: MapDetailsValue) => MapDetailsField[];
  getValue: () => MapDetailsValue;
  saveValue: (value: MapDetailsValue) => MapDetailsValue;
};

type MapDetailsAdapterOptions = {
  onAfterSave?: (value: MapDetailsValue) => void;
  read: () => MapDetailsSource;
  write: (value: MapDetailsValue) => void;
};

const mapDetailsFields: MapDetailsField[] = ["titleEn", "titleFr", "textEn", "textFr"];

export function normalizeMapDetailsValue(source: MapDetailsSource = {}): MapDetailsValue {
  return {
    textEn: String(source.textEn ?? ""),
    textFr: String(source.textFr ?? ""),
    titleEn: String(source.titleEn ?? ""),
    titleFr: String(source.titleFr ?? "")
  };
}

export function trimMapDetailsValue(value: MapDetailsValue): MapDetailsValue {
  return {
    textEn: value.textEn.trim(),
    textFr: value.textFr.trim(),
    titleEn: value.titleEn.trim(),
    titleFr: value.titleFr.trim()
  };
}

export function getMissingMapDetailsFields(value: MapDetailsValue): MapDetailsField[] {
  return mapDetailsFields.filter((key) => !value[key].trim());
}

export function createMapDetailsAdapter({ onAfterSave, read, write }: MapDetailsAdapterOptions): MapDetailsAdapter {
  return {
    getMissingFields(value = normalizeMapDetailsValue(read())) {
      return getMissingMapDetailsFields(value);
    },
    getValue() {
      return normalizeMapDetailsValue(read());
    },
    saveValue(value) {
      const trimmed = trimMapDetailsValue(value);
      write(trimmed);
      onAfterSave?.(trimmed);
      return trimmed;
    }
  };
}
