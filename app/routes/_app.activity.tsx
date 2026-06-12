import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Mail, PhoneCall, Users as Handshake, StickyNote, Activity } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Button, Card } from "~/components/ui";
import { InteractionForm } from "~/components/interaction-form";
import { useThreadConfig } from "~/components/use-thread-config";
import { fetchInteractions, fetchContacts, fetchDeals } from "~/components/crm-api";
import { formatDateTime, initials } from "~/components/format";
import type { ContactDTO, DealDTO, InteractionDTO } from "~/data/types";

export const meta: MetaFunction = () => [{ title: "Activity · Thread" }];

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  call: PhoneCall,
  email: Mail,
  meeting: Handshake,
  note: StickyNote,
};

export default function ActivityPage() {
  const { interactionTypes } = useThreadConfig();
  const [interactions, setInteractions] = useState<InteractionDTO[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);

  const typeLabel = useMemo(() => {
    const m = new Map(interactionTypes.map((t) => [t.key, t.label]));
    return (key: string) => m.get(key) ?? key;
  }, [interactionTypes]);

  const load = useCallback(async () => {
    const [i, c, d] = await Promise.all([
      fetchInteractions(undefined, 200),
      fetchContacts(),
      fetchDeals(),
    ]);
    setInteractions(i);
    setContacts(c);
    setDeals(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: InteractionDTO[] }[] = [];
    const byDay = new Map<string, InteractionDTO[]>();
    for (const it of interactions) {
      const day = new Date(it.occurredAt).toDateString();
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(it);
    }
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    for (const [day, items] of byDay) {
      let label = new Date(day).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (day === today) label = "Today";
      else if (day === yesterday) label = "Yesterday";
      groups.push({ label, items });
    }
    return groups;
  }, [interactions]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Activity</h1>
          <p className="mt-1 text-sm text-slate-500">Everything you&apos;ve logged, newest first.</p>
        </div>
        <Button onClick={() => setLogOpen(true)} disabled={contacts.length === 0}>
          <Plus className="h-4 w-4" /> Log interaction
        </Button>
      </div>

      <div className="mt-6 max-w-2xl">
        {loading ? (
          <FeedSkeleton />
        ) : interactions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--th-secondary)] text-[var(--th-primary)]">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-800">No activity yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Every call, email, meeting and note you log will show up here as a single running thread.
            </p>
            {contacts.length > 0 ? (
              <Button className="mt-5" onClick={() => setLogOpen(true)}>
                Log your first interaction
              </Button>
            ) : (
              <Link to="/contacts" className="mt-5">
                <Button>Add a contact first</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {group.items.map((it) => {
                    const Icon = TYPE_ICON[it.type] ?? StickyNote;
                    return (
                      <Link
                        key={it.id}
                        to={`/contacts/${it.contactId}`}
                        className="flex gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-slate-300"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--th-secondary)] text-[var(--th-primary)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {typeLabel(it.type)}
                              <span className="font-normal text-slate-500">
                                {" "}
                                with {it.contactName ?? "a contact"}
                              </span>
                            </p>
                            <span className="shrink-0 text-xs text-slate-400">
                              {formatDateTime(it.occurredAt)}
                            </span>
                          </div>
                          {it.dealTitle ? (
                            <p className="text-xs text-[var(--th-primary)]">on {it.dealTitle}</p>
                          ) : null}
                          {it.summary ? (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{it.summary}</p>
                          ) : null}
                        </div>
                        {it.contactName ? (
                          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 sm:flex">
                            {initials(it.contactName)}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <InteractionForm
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={load}
        contacts={contacts}
        deals={deals}
      />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
