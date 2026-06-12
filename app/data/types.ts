/**
 * Client-safe DTO shapes shared between resource-route loaders/actions and the
 * React pages. These mirror the Mongo documents but use plain JSON types so they
 * serialize cleanly across the loader boundary.
 */

export interface ContactDTO {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealDTO {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  contactCompany?: string;
  stage: string;
  value: number;
  nextFollowUpAt?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  /** Days since last activity, computed server-side for attention surfacing. */
  daysSinceActivity: number;
  /** True when the deal is open and has gone stale per the configured threshold. */
  isStale: boolean;
  /** True when an open deal has a follow-up date that is today or past. */
  isFollowUpDue: boolean;
}

export interface InteractionDTO {
  id: string;
  contactId: string;
  contactName?: string;
  dealId?: string;
  dealTitle?: string;
  type: string;
  summary?: string;
  occurredAt: string;
  createdAt: string;
}
