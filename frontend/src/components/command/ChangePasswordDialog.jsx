import { useState } from "react";
import { errorMessage } from "../../services/errors";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import { TextField } from "../ui/Field";
import { MIN_PASSWORD_LENGTH as MIN_LENGTH, validatePasswordChange } from "./passwordRules";


/** Admin password change. Signs out every other session on success. */
function ChangePasswordDialog({ onClose, onChanged, changePassword }) {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) => setValues((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const found = validatePasswordChange(values);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await changePassword(values.current, values.next);
      onChanged?.();
      onClose();
    } catch (err) {
      setFormError(errorMessage(err, "The password could not be changed."));
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Change password"
      description="You stay signed in here. Every other session is signed out."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="change-password-form" disabled={saving}>
            {saving ? "Changing password" : "Change password"}
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={submit} noValidate className="space-y-4">
        {formError ? (
          <p role="alert" className="rounded-md bg-outage/10 px-3 py-2 text-sm text-outage">
            {formError}
          </p>
        ) : null}
        <TextField label="Current password" type="password" autoComplete="current-password" value={values.current} onChange={set("current")} error={errors.current} />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={values.next}
          onChange={set("next")}
          error={errors.next}
          hint={`At least ${MIN_LENGTH} characters.`}
        />
        <TextField label="Repeat new password" type="password" autoComplete="new-password" value={values.confirm} onChange={set("confirm")} error={errors.confirm} />
      </form>
    </Dialog>
  );
}

export default ChangePasswordDialog;
