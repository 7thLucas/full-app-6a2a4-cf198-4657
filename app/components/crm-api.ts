import type { ContactDTO, DealDTO, InteractionDTO } from "~/data/types";

async function post(path: string, fields: Record<string, string | undefined>) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null) body.append(k, v);
  }
  const res = await fetch(path, { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Request failed");
  return json;
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function fetchContacts(q?: string): Promise<ContactDTO[]> {
  const url = q ? `/data/contacts?q=${encodeURIComponent(q)}` : "/data/contacts";
  const res = await fetch(url);
  const json = await res.json();
  return json.contacts ?? [];
}

export async function fetchContact(id: string): Promise<ContactDTO | null> {
  const list = await fetchContacts();
  return list.find((c) => c.id === id) ?? null;
}

export function createContact(input: Record<string, string | undefined>) {
  return post("/data/contacts", { intent: "create", ...input });
}

export function updateContact(id: string, input: Record<string, string | undefined>) {
  return post("/data/contacts", { intent: "update", id, ...input });
}

export function deleteContact(id: string) {
  return post("/data/contacts", { intent: "delete", id });
}

// ─── Deals ───────────────────────────────────────────────────────────────────

export async function fetchDeals(contactId?: string): Promise<DealDTO[]> {
  const url = contactId ? `/data/deals?contactId=${contactId}` : "/data/deals";
  const res = await fetch(url);
  const json = await res.json();
  return json.deals ?? [];
}

export function createDeal(input: Record<string, string | undefined>) {
  return post("/data/deals", { intent: "create", ...input });
}

export function moveDeal(id: string, stage: string) {
  return post("/data/deals", { intent: "move", id, stage });
}

export function updateDeal(id: string, input: Record<string, string | undefined>) {
  return post("/data/deals", { intent: "update", id, ...input });
}

export function deleteDeal(id: string) {
  return post("/data/deals", { intent: "delete", id });
}

// ─── Interactions ─────────────────────────────────────────────────────────────

export async function fetchInteractions(contactId?: string, limit?: number): Promise<InteractionDTO[]> {
  const params = new URLSearchParams();
  if (contactId) params.set("contactId", contactId);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await fetch(`/data/interactions${qs ? `?${qs}` : ""}`);
  const json = await res.json();
  return json.interactions ?? [];
}

export function createInteraction(input: Record<string, string | undefined>) {
  return post("/data/interactions", { intent: "create", ...input });
}

export function deleteInteraction(id: string) {
  return post("/data/interactions", { intent: "delete", id });
}
