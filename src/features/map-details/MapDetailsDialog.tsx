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

export type MapDetailsFieldIds = Partial<Record<keyof MapDetailsValue, string>>;

type MapDetailsCopy = {
  cancel: string;
  close: string;
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
    close: "Close map details",
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
    close: "Fermer les détails de la carte",
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
  embedded = false,
  fieldIds = {},
  initialValue = emptyDetails,
  locale = "en",
  onCancel,
  onDraftChange,
  onSave,
  titleId
}: {
  embedded?: boolean;
  fieldIds?: MapDetailsFieldIds;
  initialValue?: MapDetailsValue;
  locale?: MapDetailsLocale;
  onCancel?: () => void;
  onDraftChange?: (value: MapDetailsValue) => void;
  onSave?: (value: MapDetailsValue) => void;
  titleId?: string;
}) {
  const [draft, setDraft] = useState<MapDetailsValue>(initialValue);
  const copy = copyByLocale[locale];
  const missingFields = getMissingMapDetailsFields(draft);

  const updateDraft = (key: keyof MapDetailsValue, value: string) => {
    const next = { ...draft, [key]: value };
    onDraftChange?.(next);
    setDraft(next);
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
      closeLabel={copy.close}
      icon="file-text"
      modal={!embedded}
      onClose={onCancel}
      title={copy.title}
      titleId={titleId}
      subtitle={copy.subtitle}
    >
      <div className="map-details-note" data-missing-count={missingFields.length}>
        <strong>{copy.noteTitle}</strong>
        <span>{copy.noteBody}</span>
      </div>
      <BilingualFieldGroup
        english={draft.titleEn}
        englishAutoFocus
        englishId={fieldIds.titleEn}
        englishLabel={copy.english}
        french={draft.titleFr}
        frenchId={fieldIds.titleFr}
        frenchLabel={copy.french}
        label={copy.mapTitle}
        onEnglishChange={(value) => updateDraft("titleEn", value)}
        onFrenchChange={(value) => updateDraft("titleFr", value)}
      />
      <BilingualFieldGroup
        english={draft.textEn}
        englishId={fieldIds.textEn}
        englishLabel={copy.english}
        french={draft.textFr}
        frenchId={fieldIds.textFr}
        frenchLabel={copy.french}
        label={copy.textVersion}
        multiline
        onEnglishChange={(value) => updateDraft("textEn", value)}
        onFrenchChange={(value) => updateDraft("textFr", value)}
      />
    </Dialog>
  );
}
