import { useState } from "react";
import { Modal, Field, Input, Textarea, Select, Button } from "./ui";
import { createInteraction } from "./crm-api";
import { useThreadConfig } from "./use-thread-config";
import { toDateInput } from "./format";
import type { ContactDTO, DealDTO } from "~/data/types";

/**
 * Fast interaction capture. Type + date are prefilled so a log can be saved in
 * one tap. Optionally tied to a specific deal.
 */
export function InteractionForm({
  open,
  onClose,
  onSaved,
  contacts,
  deals,
  defaultContactId,
  defaultDealId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  contacts: ContactDTO[];
  deals?: DealDTO[];
  defaultContactId?: string;
  defaultDealId?: string;
}) {
  const { interactionTypes } = useThreadConfig();
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [dealId, setDealId] = useState(defaultDealId ?? "");
  const [type, setType] = useState(interactionTypes[0]?.key ?? "note");
  const [summary, setSummary] = useState("");
  const [occurredAt, setOccurredAt] = useState(toDateInput(new Date().toISOString()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactDeals = (deals ?? []).filter((d) => d.contactId === contactId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactId) {
      setError("Choose a contact.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createInteraction({
        contactId,
        dealId: dealId || undefined,
        type,
        summary,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log interaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log interaction" description="A few seconds — and the pipeline knows it happened.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {interactionTypes.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                type === t.key
                  ? "border-[var(--th-primary)] bg-[var(--th-secondary)] text-[var(--th-primary)]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!defaultContactId ? (
          <Field label="Contact" htmlFor="i-contact">
            <Select
              id="i-contact"
              value={contactId}
              onChange={(e) => {
                setContactId(e.target.value);
                setDealId("");
              }}
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
        ) : null}

        {contactDeals.length > 0 && !defaultDealId ? (
          <Field label="Deal (optional)" htmlFor="i-deal">
            <Select id="i-deal" value={dealId} onChange={(e) => setDealId(e.target.value)}>
              <option value="">No specific deal</option>
              {contactDeals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field label="Date" htmlFor="i-date">
          <Input
            id="i-date"
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </Field>

        <Field label="Note" htmlFor="i-summary">
          <Textarea
            id="i-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What was said, what's next…"
          />
        </Field>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Logging…" : "Log it"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
