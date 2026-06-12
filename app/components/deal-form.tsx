import { useState } from "react";
import { Modal, Field, Input, Select, Button } from "./ui";
import { createDeal, updateDeal } from "./crm-api";
import { useThreadConfig } from "./use-thread-config";
import { toDateInput } from "./format";
import type { ContactDTO, DealDTO } from "~/data/types";

export function DealForm({
  open,
  onClose,
  onSaved,
  contacts,
  deal,
  defaultContactId,
  defaultStage,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  contacts: ContactDTO[];
  deal?: DealDTO | null;
  defaultContactId?: string;
  defaultStage?: string;
}) {
  const { pipelineStages } = useThreadConfig();
  const editing = !!deal;
  const [title, setTitle] = useState(deal?.title ?? "");
  const [contactId, setContactId] = useState(deal?.contactId ?? defaultContactId ?? "");
  const [stage, setStage] = useState(deal?.stage ?? defaultStage ?? pipelineStages[0]?.key ?? "");
  const [value, setValue] = useState(deal?.value ? String(deal.value) : "");
  const [followUp, setFollowUp] = useState(toDateInput(deal?.nextFollowUpAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Give the deal a title.");
    if (!contactId) return setError("Pick a contact.");
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        contactId,
        stage,
        value: value || "0",
        nextFollowUpAt: followUp ? new Date(followUp).toISOString() : "",
      };
      if (editing && deal) await updateDeal(deal.id, payload);
      else await createDeal(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save deal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit deal" : "New deal"}
      description={editing ? undefined : "Add it to the board and start tracking what's next."}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Deal title" htmlFor="d-title">
          <Input
            id="d-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Website redesign"
            autoFocus
          />
        </Field>
        <Field label="Contact" htmlFor="d-contact">
          <Select
            id="d-contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            disabled={!!defaultContactId}
          >
            <option value="">Select a contact…</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` · ${c.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Stage" htmlFor="d-stage">
            <Select id="d-stage" value={stage} onChange={(e) => setStage(e.target.value)}>
              {pipelineStages.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Value (USD)" htmlFor="d-value">
            <Input
              id="d-value"
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
        <Field label="Next follow-up" htmlFor="d-follow" hint="When should you reach out next? Overdue follow-ups get flagged.">
          <Input
            id="d-follow"
            type="date"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add deal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
