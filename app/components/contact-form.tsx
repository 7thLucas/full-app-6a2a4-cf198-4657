import { useState } from "react";
import { Modal, Field, Input, Textarea, Button } from "./ui";
import { createContact, updateContact } from "./crm-api";
import type { ContactDTO } from "~/data/types";

export function ContactForm({
  open,
  onClose,
  onSaved,
  contact,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  contact?: ContactDTO | null;
}) {
  const editing = !!contact;
  const [name, setName] = useState(contact?.name ?? "");
  const [company, setCompany] = useState(contact?.company ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please add a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name, company, email, phone, notes };
      if (editing && contact) await updateContact(contact.id, payload);
      else await createContact(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save contact.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit contact" : "Add contact"}
      description={editing ? undefined : "Just a name to start — fill in the rest anytime."}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" htmlFor="c-name">
          <Input
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company" htmlFor="c-company">
            <Input
              id="c-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
            />
          </Field>
          <Field label="Phone" htmlFor="c-phone">
            <Input
              id="c-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </Field>
        </div>
        <Field label="Email" htmlFor="c-email">
          <Input
            id="c-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
          />
        </Field>
        <Field label="Notes" htmlFor="c-notes">
          <Textarea
            id="c-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How you met, context, anything worth remembering."
          />
        </Field>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add contact"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
