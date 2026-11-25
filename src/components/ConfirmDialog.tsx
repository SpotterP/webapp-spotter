import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="dialog" onCancel={onCancel} aria-labelledby="dialog-title">
      <h2 id="dialog-title" className="display-sm">
        {title}
      </h2>
      <p className="muted">{message}</p>
      <div className="dialog__actions">
        <button type="button" className="button button--secondary" onClick={onCancel} autoFocus>
          {t('common.cancel')}
        </button>
        <button type="button" className="button button--danger" onClick={onConfirm} disabled={busy}>
          {busy ? t('routines.deleting') : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
