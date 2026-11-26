import Dialog from "../ui/Dialog";
import { isMac, SHORTCUTS } from "./commands";
import { KeySequence } from "./Kbd";

function ShortcutHelp({ open, onClose, canEdit }) {
  const mac = isMac();
  const shortcuts = SHORTCUTS.filter((s) => canEdit || !s.adminOnly);
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" description="Letter shortcuts work anywhere except while typing in a field.">
      <dl className="divide-y divide-fjord-800">
        {shortcuts.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-fjord-300">{s.label}</dt>
            <dd>
              <KeySequence keys={mac && s.mac ? s.mac : s.keys} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-fjord-400">For two-key shortcuts, press the keys one after the other.</p>
    </Dialog>
  );
}

export default ShortcutHelp;
