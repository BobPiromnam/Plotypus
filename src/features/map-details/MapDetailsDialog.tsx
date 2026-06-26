import { useState } from "react";
import { BilingualFieldGroup, Dialog, DialogActions } from "../../components/primitives";
import { getMissingMapDetailsFields, trimMapDetailsValue } from "./mapDetailsAdapter";

export type MapDetailsValue = {
  textEn: string;
  textFr: string;
  titleEn: string;
  titleFr: string;
};

export type MapDetailsLocale = "en" | "fr";

type MapDetailsCopy = {
  cancel: string;
  english: string;
  french: string;
  noteBody: string;
  noteTitle: string;
  save: string;
  subtitle: string;
  textVersion: string;
  title: string;
  mapTitle: string;
};

const copyByLocale: Record<MapDetailsLocale, MapDetailsCopy> = {
  en: {
    cancel: "Cancel",
    english: "English",
    french: "Français",
    noteBody:
      "Map details support bilingual publishing and accessible non-visual alternatives. They are not drawn in SVG or PNG exports.",
    noteTitle: "Both languages are required.",
    save: "Save map details",
    subtitle: "Title and text version - English and French - for web and Word",
    textVersion: "Text version - long description",
    title: "Map details",
    mapTitle: "Map title"
  },
  fr: {
    cancel: "Annuler",
    english: "Anglais",
    french: "Français",
    noteBody:
      "Les détails de la carte soutiennent la publication bilingue et les alternatives accessibles non visuelles. Ils ne sont pas dessinés dans les exports SVG ou PNG.",
    noteTitle: "Les deux langues sont requises.",
    save: "Enregistrer les détails de la carte",
    subtitle: "Titre et version texte - anglais et français - pour le Web et Word",
    textVersion: "Version texte - description longue",
    title: "Détails de la carte",
    mapTitle: "Titre de la carte"
  }
};

const emptyDetails: MapDetailsValue = {
  textEn: "",
  textFr: "",
  titleEn: "",
  titleFr: ""
};

export function MapDetailsDialog({
  initialValue = emptyDetails,
  locale = "en",
  onCancel,
  onSave
}: {
  initialValue?: MapDetailsValue;
  locale?: MapDetailsLocale;
  onCancel?: () => void;
  onSave?: (value: MapDetailsValue) => void;
}) {
  const [draft, setDraft] = useState<MapDetailsValue>(initialValue);
  const copy = copyByLocale[locale];
  const missingFields = getMissingMapDetailsFields(draft);

  const updateDraft = (key: keyof MapDetailsValue, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog
      actions={
        <DialogActions
          cancelLabel={copy.cancel}
          onCancel={onCancel}
          onSave={() => onSave?.(trimMapDetailsValue(draft))}
          saveLabel={copy.save}
        />
      }
      icon="file-text"
      title={copy.title}
      subtitle={copy.subtitle}
    >
      <div className="map-details-note" data-missing-count={missingFields.length}>
        <strong>{copy.noteTitle}</strong>
        <span>{copy.noteBody}</span>
      </div>
      <BilingualFieldGroup
        english={draft.titleEn}
        englishLabel={copy.english}
        french={draft.titleFr}
        frenchLabel={copy.french}
        label={copy.mapTitle}
        onEnglishChange={(value) => updateDraft("titleEn", value)}
        onFrenchChange={(value) => updateDraft("titleFr", value)}
      />
      <BilingualFieldGroup
        english={draft.textEn}
        englishLabel={copy.english}
        french={draft.textFr}
        frenchLabel={copy.french}
        label={copy.textVersion}
        multiline
        onEnglishChange={(value) => updateDraft("textEn", value)}
        onFrenchChange={(value) => updateDraft("textFr", value)}
      />
    </Dialog>
  );
}
