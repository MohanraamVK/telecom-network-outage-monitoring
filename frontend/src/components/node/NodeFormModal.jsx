import { useState } from "react";
import { errorMessage } from "../../services/errors";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import { SelectField, TextField } from "../ui/Field";

const EMPTY = { name: "", location: "", status: "ACTIVE" };

/** Add or edit a node. `node` = null for a new one. */
function NodeFormModal({ open, node, onClose, onSave }) {
  const [form, setForm] = useState(node ? { name: node.name, location: node.location, status: node.status } : EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Enter a node name.";
    if (!form.location.trim()) next.location = "Enter where the node is.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setSaving(true);
      setFormError("");
      await onSave({ name: form.name.trim(), location: form.location.trim(), status: form.status });
    } catch (err) {
      setFormError(errorMessage(err, "The node could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={node ? `Edit ${node.name}` : "Add node"}
      description={node ? null : "New nodes are monitored as soon as they send a heartbeat."}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="node-form" disabled={saving}>
            {saving ? "Saving…" : node ? "Save changes" : "Add node"}
          </Button>
        </>
      }
    >
      <form id="node-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError ? <p className="rounded bg-outage/10 px-3 py-2 text-sm text-outage">{formError}</p> : null}
        <TextField label="Name" value={form.name} onChange={set("name")} error={errors.name} placeholder="GBG-Tower-14" maxLength={100} />
        <TextField label="Location" value={form.location} onChange={set("location")} error={errors.location} placeholder="Gothenburg, Majorna" maxLength={255} />
        <SelectField
          label="Status"
          value={form.status}
          onChange={set("status")}
          hint="Maintenance pauses outage alerts for this node."
        >
          <option value="ACTIVE">Up</option>
          <option value="DOWN">Down</option>
          <option value="MAINTENANCE">Maintenance</option>
        </SelectField>
      </form>
    </Dialog>
  );
}

export default NodeFormModal;
