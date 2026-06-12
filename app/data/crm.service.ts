import { Types } from "mongoose";
import { ContactModel } from "./contact.model";
import { DealModel } from "./deal.model";
import { InteractionModel } from "./interaction.model";
import { ConfigurableModel } from "~/modules/configurables/src/models/configurables.model";
import { defaultConfigurablesData } from "~/modules/configurables/src/constants/configurables.default";
import type { ContactDTO, DealDTO, InteractionDTO } from "./types";

const DAY_MS = 1000 * 60 * 60 * 24;

function iso(value?: Date | null): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

async function getStaleAfterDays(): Promise<number> {
  const doc = await ConfigurableModel.findOne({ _singleton: true }).lean().exec();
  const fromConfig = doc?.configurable_data?.staleAfterDays;
  const fallback = defaultConfigurablesData.staleAfterDays ?? 7;
  return typeof fromConfig === "number" && fromConfig > 0 ? fromConfig : fallback;
}

async function getOpenStageKeys(): Promise<Set<string>> {
  const doc = await ConfigurableModel.findOne({ _singleton: true }).lean().exec();
  const stages = doc?.configurable_data?.pipelineStages ?? defaultConfigurablesData.pipelineStages ?? [];
  return new Set(
    stages.filter((s: { kind?: string }) => s.kind === "open").map((s: { key: string }) => s.key),
  );
}

function serializeContact(c: any): ContactDTO {
  return {
    id: String(c._id),
    name: c.name,
    company: c.company || undefined,
    email: c.email || undefined,
    phone: c.phone || undefined,
    notes: c.notes || undefined,
    createdAt: iso(c.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(c.updatedAt) ?? new Date().toISOString(),
  };
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function listContacts(search?: string): Promise<ContactDTO[]> {
  const query: Record<string, unknown> = { deletedAt: null };
  if (search && search.trim()) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { company: rx }, { email: rx }];
  }
  const docs = await ContactModel.find(query).sort({ name: 1 }).lean().exec();
  return docs.map(serializeContact);
}

export async function getContact(id: string): Promise<ContactDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await ContactModel.findOne({ _id: id, deletedAt: null }).lean().exec();
  return doc ? serializeContact(doc) : null;
}

export async function createContact(input: {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<ContactDTO> {
  const doc = await ContactModel.create({
    name: input.name,
    company: input.company,
    email: input.email,
    phone: input.phone,
    notes: input.notes,
  });
  return serializeContact(doc.toObject());
}

export async function updateContact(
  id: string,
  input: Partial<{ name: string; company: string; email: string; phone: string; notes: string }>,
): Promise<ContactDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await ContactModel.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: input },
    { new: true },
  )
    .lean()
    .exec();
  return doc ? serializeContact(doc) : null;
}

export async function deleteContact(id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const res = await ContactModel.updateOne(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  ).exec();
  // Cascade soft-delete related deals + interactions so the board stays clean.
  await DealModel.updateMany({ contactId: id }, { $set: { deletedAt: new Date() } }).exec();
  await InteractionModel.updateMany({ contactId: id }, { $set: { deletedAt: new Date() } }).exec();
  return res.modifiedCount > 0;
}

// ─── Deals ───────────────────────────────────────────────────────────────────

async function serializeDeal(
  d: any,
  contactMap: Map<string, any>,
  openStages: Set<string>,
  staleAfterDays: number,
): Promise<DealDTO> {
  const contact = contactMap.get(String(d.contactId));
  const last = d.lastActivityAt ? new Date(d.lastActivityAt) : new Date(d.createdAt);
  const daysSinceActivity = Math.floor((Date.now() - last.getTime()) / DAY_MS);
  const isOpen = openStages.has(d.stage);
  const isStale = isOpen && daysSinceActivity >= staleAfterDays;
  const followUp = d.nextFollowUpAt ? new Date(d.nextFollowUpAt) : undefined;
  const isFollowUpDue = isOpen && !!followUp && followUp.getTime() <= Date.now();
  return {
    id: String(d._id),
    title: d.title,
    contactId: String(d.contactId),
    contactName: contact?.name ?? "Unknown contact",
    contactCompany: contact?.company || undefined,
    stage: d.stage,
    value: d.value ?? 0,
    nextFollowUpAt: iso(followUp),
    lastActivityAt: iso(last) ?? new Date().toISOString(),
    createdAt: iso(d.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(d.updatedAt) ?? new Date().toISOString(),
    daysSinceActivity,
    isStale,
    isFollowUpDue,
  };
}

export async function listDeals(contactId?: string): Promise<DealDTO[]> {
  const [openStages, staleAfterDays] = await Promise.all([
    getOpenStageKeys(),
    getStaleAfterDays(),
  ]);
  const query: Record<string, unknown> = { deletedAt: null };
  if (contactId && Types.ObjectId.isValid(contactId)) query.contactId = contactId;
  const deals = await DealModel.find(query).sort({ lastActivityAt: -1 }).lean().exec();
  const contactIds = [...new Set(deals.map((d) => String(d.contactId)))];
  const contacts = await ContactModel.find({ _id: { $in: contactIds } })
    .lean()
    .exec();
  const contactMap = new Map(contacts.map((c) => [String(c._id), c]));
  return Promise.all(
    deals.map((d) => serializeDeal(d, contactMap, openStages, staleAfterDays)),
  );
}

export async function createDeal(input: {
  title: string;
  contactId: string;
  stage: string;
  value?: number;
  nextFollowUpAt?: string;
}): Promise<DealDTO | null> {
  if (!Types.ObjectId.isValid(input.contactId)) return null;
  const doc = await DealModel.create({
    title: input.title,
    contactId: new Types.ObjectId(input.contactId),
    stage: input.stage,
    value: input.value ?? 0,
    nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : undefined,
    lastActivityAt: new Date(),
  });
  const [openStages, staleAfterDays] = await Promise.all([
    getOpenStageKeys(),
    getStaleAfterDays(),
  ]);
  const contact = await ContactModel.findById(input.contactId).lean().exec();
  const contactMap = new Map(contact ? [[String(contact._id), contact]] : []);
  return serializeDeal(doc.toObject(), contactMap as Map<string, any>, openStages, staleAfterDays);
}

export async function updateDealStage(id: string, stage: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const res = await DealModel.updateOne(
    { _id: id, deletedAt: null },
    { $set: { stage, lastActivityAt: new Date() } },
  ).exec();
  return res.matchedCount > 0;
}

export async function updateDeal(
  id: string,
  input: Partial<{ title: string; stage: string; value: number; nextFollowUpAt: string | null }>,
): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const set: Record<string, unknown> = { lastActivityAt: new Date() };
  if (input.title !== undefined) set.title = input.title;
  if (input.stage !== undefined) set.stage = input.stage;
  if (input.value !== undefined) set.value = input.value;
  if (input.nextFollowUpAt !== undefined) {
    set.nextFollowUpAt = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null;
  }
  const res = await DealModel.updateOne({ _id: id, deletedAt: null }, { $set: set }).exec();
  return res.matchedCount > 0;
}

export async function deleteDeal(id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const res = await DealModel.updateOne(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  ).exec();
  return res.modifiedCount > 0;
}

// ─── Interactions ─────────────────────────────────────────────────────────────

export async function listInteractions(opts: {
  contactId?: string;
  limit?: number;
}): Promise<InteractionDTO[]> {
  const query: Record<string, unknown> = { deletedAt: null };
  if (opts.contactId && Types.ObjectId.isValid(opts.contactId)) query.contactId = opts.contactId;
  const docs = await InteractionModel.find(query)
    .sort({ occurredAt: -1 })
    .limit(opts.limit ?? 200)
    .lean()
    .exec();

  const contactIds = [...new Set(docs.map((d) => String(d.contactId)))];
  const dealIds = [...new Set(docs.filter((d) => d.dealId).map((d) => String(d.dealId)))];
  const [contacts, deals] = await Promise.all([
    ContactModel.find({ _id: { $in: contactIds } }).lean().exec(),
    DealModel.find({ _id: { $in: dealIds } }).lean().exec(),
  ]);
  const contactMap = new Map(contacts.map((c) => [String(c._id), c]));
  const dealMap = new Map(deals.map((d) => [String(d._id), d]));

  return docs.map((d) => ({
    id: String(d._id),
    contactId: String(d.contactId),
    contactName: contactMap.get(String(d.contactId))?.name,
    dealId: d.dealId ? String(d.dealId) : undefined,
    dealTitle: d.dealId ? dealMap.get(String(d.dealId))?.title : undefined,
    type: d.type,
    summary: d.summary || undefined,
    occurredAt: iso(d.occurredAt) ?? new Date().toISOString(),
    createdAt: iso(d.createdAt) ?? new Date().toISOString(),
  }));
}

export async function createInteraction(input: {
  contactId: string;
  dealId?: string;
  type: string;
  summary?: string;
  occurredAt?: string;
}): Promise<InteractionDTO | null> {
  if (!Types.ObjectId.isValid(input.contactId)) return null;
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const doc = await InteractionModel.create({
    contactId: new Types.ObjectId(input.contactId),
    dealId: input.dealId && Types.ObjectId.isValid(input.dealId)
      ? new Types.ObjectId(input.dealId)
      : undefined,
    type: input.type,
    summary: input.summary,
    occurredAt,
  });

  // Logging an interaction is activity — bump the linked deal so it leaves the
  // "stale" zone. If no deal was specified, bump the contact's most recent open deal.
  if (doc.dealId) {
    await DealModel.updateOne({ _id: doc.dealId }, { $set: { lastActivityAt: occurredAt } }).exec();
  } else {
    const latest = await DealModel.findOne({ contactId: input.contactId, deletedAt: null })
      .sort({ lastActivityAt: -1 })
      .exec();
    if (latest) {
      latest.lastActivityAt = occurredAt;
      await latest.save();
    }
  }

  return {
    id: String(doc._id),
    contactId: String(doc.contactId),
    dealId: doc.dealId ? String(doc.dealId) : undefined,
    type: doc.type,
    summary: doc.summary || undefined,
    occurredAt: occurredAt.toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export async function deleteInteraction(id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const res = await InteractionModel.updateOne(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  ).exec();
  return res.modifiedCount > 0;
}

export interface PipelineSummary {
  totalOpen: number;
  totalOpenValue: number;
  staleCount: number;
  followUpDueCount: number;
}

export async function getPipelineSummary(deals: DealDTO[], openStages: Set<string>): Promise<PipelineSummary> {
  const open = deals.filter((d) => openStages.has(d.stage));
  return {
    totalOpen: open.length,
    totalOpenValue: open.reduce((sum, d) => sum + (d.value || 0), 0),
    staleCount: deals.filter((d) => d.isStale).length,
    followUpDueCount: deals.filter((d) => d.isFollowUpDue).length,
  };
}

export async function getOpenStageKeysPublic(): Promise<string[]> {
  return [...(await getOpenStageKeys())];
}
