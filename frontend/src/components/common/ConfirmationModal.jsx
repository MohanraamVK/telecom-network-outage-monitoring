import Button from "../ui/Button";
import Dialog from "../ui/Dialog";

function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      title={title}
      width="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} data-autofocus>
            {cancelText}
          </Button>
          <Button variant={confirmVariant === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-fjord-300">{message}</p>
    </Dialog>
  );
}

export default ConfirmationModal;
