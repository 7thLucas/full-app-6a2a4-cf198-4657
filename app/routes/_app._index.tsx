import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, AlertTriangle, Clock, TrendingUp, CalendarClock } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Button, Card, Badge } from "~/components/ui";
import { DealForm } from "~/components/deal-form";
import { InteractionForm } from "~/components/interaction-form";
import { useThreadConfig } from "~/components/use-thread-config";
import { fetchDeals, fetchContacts, moveDeal } from "~/components/crm-api";
import { formatCurrency, timeAgo, initials, formatDate } from "~/components/format";
import type { DealDTO, ContactDTO } from "~/data/types";

export const meta: MetaFunction = () => [{ title: "Pipeline · Thread" }];

export default function PipelinePage() {
  const { pipelineStages, tagline } = useThreadConfig();
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealModal, setDealModal] = useState<{ open: boolean; stage?: string }>({ open: false });
  const [logOpen, setLogOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [d, c] = await Promise.all([fetchDeals(), fetchContacts()]);
    setDeals(d);
    setContacts(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openStageKeys = useMemo(
    () => new Set(pipelineStages.filter((s) => s.kind === "open").map((s) => s.key)),
    [pipelineStages],
  );

  const summary = useMemo(() => {
    const open = deals.filter((d) => openStageKeys.has(d.stage));
    return {
      openCount: open.length,
      openValue: open.reduce((s, d) => s + (d.value || 0), 0),
      stale: deals.filter((d) => d.isStale).length,
      due: deals.filter((d) => d.isFollowUpDue).length,
    };
  }, [deals, openStageKeys]);

  const dealsByStage = useMemo(() => {
    const map = new Map<string, DealDTO[]>();
    for (const s of pipelineStages) map.set(s.key, []);
    for (const d of deals) {
      if (!map.has(d.stage)) map.set(d.stage, []);
      map.get(d.stage)!.push(d);
    }
    return map;
  }, [deals, pipelineStages]);

  async function handleDrop(stageKey: string) {
    setOverStage(null);
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;
    const current = deals.find((d) => d.id === id);
    if (!current || current.stage === stageKey) return;
    // Optimistic move
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage: stageKey, isStale: false } : d)));
    try {
      await moveDeal(id, stageKey);
      load();
    } catch {
      load();
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Pipeline</h1>
          {tagline ? <p className="mt-1 max-w-xl text-sm text-slate-500">{tagline}</p> : null}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setLogOpen(true)} disabled={contacts.length === 0}>
            Log interaction
          </Button>
          <Button onClick={() => setDealModal({ open: true })} disabled={contacts.length === 0}>
            <Plus className="h-4 w-4" /> New deal
          </Button>
        </div>
      </div>

      {/* Attention strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={TrendingUp} tone="brand" label="Open deals" value={String(summary.openCount)} />
        <Stat
          icon={TrendingUp}
          tone="green"
          label="Open value"
          value={formatCurrency(summary.openValue)}
        />
        <Stat
          icon={CalendarClock}
          tone={summary.due ? "amber" : "neutral"}
          label="Follow-ups due"
          value={String(summary.due)}
        />
        <Stat
          icon={AlertTriangle}
          tone={summary.stale ? "rose" : "neutral"}
          label="Going stale"
          value={String(summary.stale)}
        />
      </div>

      {loading ? (
        <BoardSkeleton stages={pipelineStages.length} />
      ) : contacts.length === 0 ? (
        <EmptyPipeline />
      ) : (
        <div className="th-scroll mt-6 flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => {
            const items = dealsByStage.get(stage.key) ?? [];
            const stageValue = items.reduce((s, d) => s + (d.value || 0), 0);
            return (
              <div
                key={stage.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(stage.key);
                }}
                onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
                onDrop={() => handleDrop(stage.key)}
                className={`flex w-72 shrink-0 flex-col rounded-xl border p-2 transition-colors ${
                  overStage === stage.key
                    ? "border-[var(--th-primary)] bg-[var(--th-secondary)]/60"
                    : "border-slate-200/70 bg-slate-100/40"
                }`}
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${stageDot(stage.kind)}`} />
                    <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                    <span className="text-xs text-slate-400">{items.length}</span>
                  </div>
                  {stageValue > 0 ? (
                    <span className="text-xs font-medium text-slate-400">
                      {formatCurrency(stageValue)}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-2 px-0.5 pb-1">
                  {items.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      dragging={draggingId === deal.id}
                      onDragStart={() => setDraggingId(deal.id)}
                      onDragEnd={() => setDraggingId(null)}
                    />
                  ))}
                  {items.length === 0 ? (
                    <button
                      onClick={() => setDealModal({ open: true, stage: stage.key })}
                      className="rounded-lg border border-dashed border-slate-300 py-6 text-xs text-slate-400 transition hover:border-[var(--th-primary)] hover:text-[var(--th-primary)]"
                    >
                      Drop a deal here
                    </button>
                  ) : (
                    <button
                      onClick={() => setDealModal({ open: true, stage: stage.key })}
                      className="mt-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-slate-400 transition hover:bg-white hover:text-[var(--th-primary)]"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DealForm
        open={dealModal.open}
        onClose={() => setDealModal({ open: false })}
        onSaved={load}
        contacts={contacts}
        defaultStage={dealModal.stage}
      />
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

function stageDot(kind: string): string {
  if (kind === "won") return "bg-emerald-500";
  if (kind === "lost") return "bg-slate-400";
  return "bg-[var(--th-primary)]";
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "brand" | "green" | "amber" | "rose" | "neutral";
}) {
  const tones: Record<string, string> = {
    brand: "text-[var(--th-primary)] bg-[var(--th-secondary)]",
    green: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
    neutral: "text-slate-500 bg-slate-100",
  };
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-lg font-semibold leading-tight text-slate-800">{value}</p>
      </div>
    </Card>
  );
}

function DealCard({
  deal,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  deal: DealDTO;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <Link
      to={`/contacts/${deal.contactId}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group block cursor-grab rounded-lg border bg-white p-3 shadow-sm transition active:cursor-grabbing ${
        dragging
          ? "border-[var(--th-primary)] opacity-50"
          : deal.isStale
            ? "border-rose-200"
            : deal.isFollowUpDue
              ? "border-amber-200"
              : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 group-hover:text-[var(--th-primary)]">
          {deal.title}
        </p>
        {deal.value > 0 ? (
          <span className="shrink-0 text-xs font-semibold text-slate-500">
            {formatCurrency(deal.value)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--th-secondary)] text-[9px] font-bold text-[var(--th-primary)]">
          {initials(deal.contactName)}
        </span>
        <span className="truncate text-xs text-slate-500">{deal.contactName}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {deal.isStale ? (
          <Badge tone="rose">
            <AlertTriangle className="h-3 w-3" /> Stale · {deal.daysSinceActivity}d
          </Badge>
        ) : deal.isFollowUpDue ? (
          <Badge tone="amber">
            <CalendarClock className="h-3 w-3" /> Follow up
          </Badge>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" /> {timeAgo(deal.lastActivityAt)}
          </span>
        )}
        {deal.nextFollowUpAt && !deal.isFollowUpDue ? (
          <span className="text-[11px] text-slate-400">· next {formatDate(deal.nextFollowUpAt)}</span>
        ) : null}
      </div>
    </Link>
  );
}

function BoardSkeleton({ stages }: { stages: number }) {
  return (
    <div className="mt-6 flex gap-4 overflow-hidden pb-4">
      {Array.from({ length: Math.max(stages, 4) }).map((_, i) => (
        <div key={i} className="w-72 shrink-0 rounded-xl border border-slate-200/70 bg-slate-100/40 p-2">
          <div className="mb-3 h-5 w-24 animate-pulse rounded bg-slate-200" />
          <div className="space-y-2">
            <div className="h-20 animate-pulse rounded-lg bg-white" />
            <div className="h-20 animate-pulse rounded-lg bg-white" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPipeline() {
  return (
    <Card className="mt-6 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--th-secondary)] text-[var(--th-primary)]">
        <TrendingUp className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">Your pipeline starts with a contact</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Add your first contact, then create a deal to watch it move across the board.
      </p>
      <Link to="/contacts" className="mt-5">
        <Button>
          <Plus className="h-4 w-4" /> Add your first contact
        </Button>
      </Link>
    </Card>
  );
}
