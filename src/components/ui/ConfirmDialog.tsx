import ButtonLabel from "./ButtonLabel";

type ConfirmDialogProps = {
  cancelLabel: string;
  confirmLabel: string;
  isDanger?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export default function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  isDanger = false,
  message,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <div aria-labelledby="confirm-dialog-title" aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="confirm-dialog">
        <div>
          <h3 id="confirm-dialog-title">{title}</h3>
          <p>{message}</p>
        </div>
        <div className="confirm-dialog__actions">
          <button className="secondary-button" onClick={onCancel} type="button">
            <ButtonLabel icon="cancel">{cancelLabel}</ButtonLabel>
          </button>
          <button className={isDanger ? "danger-button" : undefined} onClick={onConfirm} type="button">
            <ButtonLabel icon="deactivate">{confirmLabel}</ButtonLabel>
          </button>
        </div>
      </div>
    </div>
  );
}
