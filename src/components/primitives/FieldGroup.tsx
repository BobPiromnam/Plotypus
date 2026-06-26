import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  language?: string;
};

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  language?: string;
};

type BilingualFieldGroupProps = {
  english: string;
  englishLabel?: string;
  french: string;
  frenchLabel?: string;
  label: string;
  multiline?: boolean;
  onEnglishChange: (value: string) => void;
  onFrenchChange: (value: string) => void;
};

export function TextField({ label, language, ...props }: TextFieldProps) {
  return (
    <label className="pt-text-field">
      <span>
        {language ? <span className="pt-language-chip">{language}</span> : null}
        {label}
      </span>
      <input {...props} />
    </label>
  );
}

export function TextAreaField({ label, language, ...props }: TextAreaFieldProps) {
  return (
    <label className="pt-text-field">
      <span>
        {language ? <span className="pt-language-chip">{language}</span> : null}
        {label}
      </span>
      <textarea {...props} />
    </label>
  );
}

export function BilingualFieldGroup({
  english,
  englishLabel = "English",
  french,
  frenchLabel = "Français",
  label,
  multiline = false,
  onEnglishChange,
  onFrenchChange
}: BilingualFieldGroupProps) {
  const Field = multiline ? TextAreaField : TextField;

  return (
    <fieldset className="pt-bilingual-field-group">
      <legend>{label}</legend>
      <div className="pt-bilingual-fields">
        <Field
          language="EN"
          label={englishLabel}
          value={english}
          onChange={(event) => onEnglishChange(event.target.value)}
        />
        <Field
          language="FR"
          label={frenchLabel}
          value={french}
          onChange={(event) => onFrenchChange(event.target.value)}
        />
      </div>
    </fieldset>
  );
}
