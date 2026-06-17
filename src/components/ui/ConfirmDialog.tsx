import ButtonLabel from "./ButtonLabel";
import DraggableDialog from "./DraggableDialog";

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
    <DraggableDialog labelledBy="confirm-dialog-title">
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
    </DraggableDialog>
  );
}
