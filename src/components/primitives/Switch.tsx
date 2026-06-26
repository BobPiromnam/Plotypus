type SwitchProps = {
  checked: boolean;
  label: string;
  hint?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function Switch({ checked, disabled = false, hint, label, onChange }: SwitchProps) {
  return (
    <label className="pt-switch-row">
      <span>
        <span className="pt-switch-label">{label}</span>
        {hint ? <span className="pt-switch-hint">{hint}</span> : null}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="pt-switch" aria-hidden="true" />
    </label>
  );
}
