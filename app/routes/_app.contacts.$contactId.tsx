import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Plus,
  Phone,
  Mail,
  Building2,
  Pencil,
  Trash2,
  PhoneCall,
  Users as Handshake,
  StickyNote,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, Badge } from "~/components/ui";
import { ContactForm } from "~/components/contact-form";
import { DealForm } from "~/components/deal-form";
import { InteractionForm } from "~/components/interaction-form";
import { useThreadConfig } from "~/components/use-thread-config";
import {
  fetchContacts,
  fetchDeals,
  fetchInteractions,
  deleteContact,
  deleteDeal,
} from "~/components/crm-api";
import {
  initials,
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
} from "~/components/format";
import type { ContactDTO, DealDTO, InteractionDTO } from "~/data/types";

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  call: PhoneCall,
  email: Mail,
  meeting: Handshake,
  note: StickyNote,
};

export default function ContactDetailPage() {
  const { contactId = "" } = useParams();
  const { pipelineStages, interactionTypes } = useThreadConfig();
  const [contact, setContact] = useState<ContactDTO | null>(null);
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [interactions, setInteractions] = useState<InteractionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const stageLabel = useMemo(() => {
    const m = new Map(pipelineStages.map((s) => [s.key, s.label]));
    return (key: string) => m.get(key) ?? key;
  }, [pipelineStages]);

  const typeLabel = useMemo(() => {
    const m = new Map(interactionTypes.map((t) => [t.key, t.label]));
    return (key: string) => m.get(key) ?? key;
  }, [interactionTypes]);

  const load = useCallback(async () => {
    const [contacts, d, i] = await Promise.all([
      fetchContacts(),
      fetchDeals(contactId),
      fetchInteractions(contactId),
    ]);
    setContact(contacts.find((c) => c.id === contactId) ?? null);
    setDeals(d);
    setInteractions(i);
    setLoading(false);
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDeleteContact() {
    if (!confirm("Delete this contact and all their deals and interactions?")) return;
    await deleteContact(contactId);
    window.location.href = "/contacts";
  }

  async function handleDeleteDeal(id: string) {
    if (!confirm("Delete this deal?")) return;
    await deleteDeal(id);
    load();
  }

  if (loading) return <DetailSkeleton />;

  if (!contact) {
    return (
      <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm text-slate-500">This contact could not be found.</p>
        <Link to="/contacts" className="mt-4">
          <Button variant="secondary">Back to contacts</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <Link
        to="/contacts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--th-secondary)] text-lg font-bold text-[var(--th-primary)]">
            {initials(contact.name)}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">{contact.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              {contact.company ? (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {contact.company}
                </span>
              ) : null}
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-[var(--th-primary)]"
                >
                  <Mail className="h-3.5 w-3.5" /> {contact.email}
                </a>
              ) : null}
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-1.5 hover:text-[var(--th-primary)]"
                >
                  <Phone className="h-3.5 w-3.5" /> {contact.phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteContact}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {contact.notes ? (
        <Card className="mt-4 bg-amber-50/50 p-4 text-sm leading-relaxed text-slate-600">
          {contact.notes}
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Deals */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Deals</h2>
            <Button variant="ghost" size="sm" onClick={() => setDealOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {deals.length === 0 ? (
              <Card className="px-4 py-8 text-center text-sm text-slate-400">
                No deals yet. Add one to track it on the pipeline.
              </Card>
            ) : (
              deals.map((d) => (
                <Card key={d.id} className="group p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{d.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone="brand">{stageLabel(d.stage)}</Badge>
                        {d.value > 0 ? (
                          <span className="text-xs font-medium text-slate-500">
                            {formatCurrency(d.value)}
                          </span>
                        ) : null}
                        {d.isStale ? (
                          <Badge tone="rose">
                            <AlertTriangle className="h-3 w-3" /> Stale
                          </Badge>
                        ) : d.isFollowUpDue ? (
                          <Badge tone="amber">
                            <CalendarClock className="h-3 w-3" /> Due
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Last activity {timeAgo(d.lastActivityAt)}
                        {d.nextFollowUpAt ? ` · next ${formatDate(d.nextFollowUpAt)}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDeal(d.id)}
                      className="shrink-0 rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                      aria-label="Delete deal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Interaction timeline */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Interactions</h2>
            <Button size="sm" onClick={() => setLogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Log interaction
            </Button>
          </div>
          <div className="mt-3">
            {interactions.length === 0 ? (
              <Card className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-600">Nothing logged yet</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">
                  Log a call, email, meeting or note. It takes seconds and keeps the deal warm.
                </p>
                <Button className="mt-4" size="sm" onClick={() => setLogOpen(true)}>
                  Log the first one
                </Button>
              </Card>
            ) : (
              <ol className="relative space-y-1 pl-2">
                {interactions.map((it, idx) => {
                  const Icon = TYPE_ICON[it.type] ?? StickyNote;
                  return (
                    <li key={it.id} className="relative flex gap-3 pb-4">
                      {idx !== interactions.length - 1 ? (
                        <span className="absolute left-[15px] top-8 h-full w-px bg-slate-200" />
                      ) : null}
                      <span className="z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--th-secondary)] text-[var(--th-primary)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg border border-slate-100 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-700">
                            {typeLabel(it.type)}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatDateTime(it.occurredAt)}
                          </span>
                        </div>
                        {it.dealTitle ? (
                          <p className="mt-0.5 text-xs text-[var(--th-primary)]">on {it.dealTitle}</p>
                        ) : null}
                        {it.summary ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{it.summary}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>

      <ContactForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        contact={contact}
      />
      <DealForm
        open={dealOpen}
        onClose={() => setDealOpen(false)}
        onSaved={load}
        contacts={[contact]}
        defaultContactId={contact.id}
      />
      <InteractionForm
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={load}
        contacts={[contact]}
        deals={deals}
        defaultContactId={contact.id}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 flex items-center gap-4">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-3.5 w-56 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <div className="h-24 animate-pulse rounded-xl bg-white" />
          <div className="h-24 animate-pulse rounded-xl bg-white" />
        </div>
        <div className="space-y-2 lg:col-span-3">
          <div className="h-16 animate-pulse rounded-xl bg-white" />
          <div className="h-16 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    </div>
  );
}
