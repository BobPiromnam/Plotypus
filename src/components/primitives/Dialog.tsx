import type { ReactNode } from "react";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./IconButton";

type DialogProps = {
  actions?: ReactNode;
  children: ReactNode;
  icon?: IconName;
  onClose?: () => void;
  open?: boolean;
  subtitle?: string;
  title: string;
};

export function Dialog({ actions, children, icon, onClose, open = true, subtitle, title }: DialogProps) {
  if (!open) return null;

  return (
    <section className="pt-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <header className="pt-dialog-header">
        {icon ? (
          <span className="pt-dialog-icon" aria-hidden="true">
            <Icon name={icon} />
          </span>
        ) : null}
        <div>
          <h2 id="ptDialogTitle">{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {onClose ? <IconButton className="pt-dialog-close" icon="x" label="Close" onClick={onClose} /> : null}
      </header>
      <div className="pt-dialog-body">{children}</div>
      {actions ? <footer className="pt-dialog-footer">{actions}</footer> : null}
    </section>
  );
}

export function DialogActions({
  cancelLabel = "Cancel",
  onCancel,
  onSave,
  saveLabel = "Save"
}: {
  cancelLabel?: string;
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
}) {
  return (
    <>
      <Button onClick={onCancel}>{cancelLabel}</Button>
      <Button onClick={onSave} variant="primary">
        {saveLabel}
      </Button>
    </>
  );
}
