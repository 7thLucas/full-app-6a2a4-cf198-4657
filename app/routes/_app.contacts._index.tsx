import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, Users, ChevronRight } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Button, Card, Input } from "~/components/ui";
import { ContactForm } from "~/components/contact-form";
import { fetchContacts } from "~/components/crm-api";
import { initials } from "~/components/format";
import type { ContactDTO } from "~/data/types";

export const meta: MetaFunction = () => [{ title: "Contacts · Thread" }];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    const list = await fetchContacts();
    setContacts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = contacts.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Contacts</h1>
          <p className="mt-1 text-sm text-slate-500">
            {contacts.length} {contacts.length === 1 ? "person" : "people"} in your orbit
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Add contact
        </Button>
      </div>

      <div className="relative mt-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company or email"
          className="pl-9"
        />
      </div>

      <div className="mt-5">
        {loading ? (
          <ListSkeleton />
        ) : contacts.length === 0 ? (
          <EmptyContacts onAdd={() => setFormOpen(true)} />
        ) : filtered.length === 0 ? (
          <Card className="px-6 py-12 text-center text-sm text-slate-500">
            No contacts match “{query}”.
          </Card>
        ) : (
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/contacts/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--th-secondary)] text-sm font-semibold text-[var(--th-primary)]">
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[c.company, c.email].filter(Boolean).join(" · ") || "No details yet"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            ))}
          </Card>
        )}
      </div>

      <ContactForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
    </div>
  );
}

function ListSkeleton() {
  return (
    <Card className="divide-y divide-slate-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </Card>
  );
}

function EmptyContacts({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--th-secondary)] text-[var(--th-primary)]">
        <Users className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">No contacts yet</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Add the first person you want to keep track of. It takes seconds — just a name to start.
      </p>
      <Button className="mt-5" onClick={onAdd}>
        <Plus className="h-4 w-4" /> Add your first contact
      </Button>
    </Card>
  );
}
