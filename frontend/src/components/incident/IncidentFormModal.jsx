import { useEffect, useState } from "react";
import { errorMessage } from "../../services/errors";
import { getNodeOptions } from "../../services/nodeService";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import { SelectField, TextArea } from "../ui/Field";

function IncidentFormModal({ open, defaultNodeId, onClose, onSave }) {
  const [nodes, setNodes] = useState([]);
  const [form, setForm] = useState({ nodeId: defaultNodeId ?? "", description: "", severity: "MEDIUM", status: "OPEN" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNodeOptions().then(setNodes).catch(() => setFormError("Nodes could not be loaded."));
  }, []);

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.nodeId) next.nodeId = "Choose the affected node.";
    if (!form.description.trim()) next.description = "Describe what is wrong.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setSaving(true);
      setFormError("");
      await onSave({ ...form, description: form.description.trim() });
    } catch (err) {
      setFormError(errorMessage(err, "The incident could not be raised."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Raise incident"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="incident-form" disabled={saving}>
            {saving ? "Raising…" : "Raise incident"}
          </Button>
        </>
      }
    >
      <form id="incident-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError ? <p className="rounded bg-outage/10 px-3 py-2 text-sm text-outage">{formError}</p> : null}
        <SelectField label="Node" value={form.nodeId} onChange={set("nodeId")} error={errors.nodeId}>
          <option value="">Choose a node</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name} ({node.location})
            </option>
          ))}
        </SelectField>
        <TextArea
          label="What is wrong?"
          value={form.description}
          onChange={set("description")}
          error={errors.description}
          placeholder="Packet loss above 2% on uplink to Borås"
          maxLength={255}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Severity" value={form.severity} onChange={set("severity")}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </SelectField>
          <SelectField label="Status" value={form.status} onChange={set("status")}>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
          </SelectField>
        </div>
      </form>
    </Dialog>
  );
}

export default IncidentFormModal;
