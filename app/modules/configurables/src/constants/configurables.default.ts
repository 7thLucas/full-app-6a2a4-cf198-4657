/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TPipelineStage = {
  key: string;
  label: string;
  kind: "open" | "won" | "lost";
};

export type TInteractionType = {
  key: string;
  label: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  tagline?: string;
  staleAfterDays?: number;
  pipelineStages?: TPipelineStage[];
  interactionTypes?: TInteractionType[];
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Thread",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#4f46e5",
    secondary: "#eef2ff",
    accent: "#6366f1",
  },
  tagline: "Your contacts, interactions, and pipeline — all in one calm place.",
  staleAfterDays: 7,
  pipelineStages: [
    { key: "lead", label: "Lead", kind: "open" },
    { key: "contacted", label: "Contacted", kind: "open" },
    { key: "proposal", label: "Proposal", kind: "open" },
    { key: "negotiation", label: "Negotiation", kind: "open" },
    { key: "won", label: "Won", kind: "won" },
    { key: "lost", label: "Lost", kind: "lost" },
  ],
  interactionTypes: [
    { key: "call", label: "Call" },
    { key: "email", label: "Email" },
    { key: "meeting", label: "Meeting" },
    { key: "note", label: "Note" },
  ],
  // ─────────────────────────────────────────────────────────────────────
  // Add new field defaults here. See RULES.md §5 for per-type shape.
  // Required branding fields → use the FILL_X_HERE placeholder pattern.
  // Optional/typed defaults → real value with a "// fill it here" comment:
  //
  //   maxItemsPerPage: 12,                     // fill it here
  //   enableNotifications: true,               // fill it here
  //   featuredCategories: [],                  // fill it here
  //   defaultLanguage: "en",                   // must match enum options
  //   launchDate: "2025-01-01T00:00:00.000Z",  // ISO-8601
  //   heroImage: "",                           // resolved URL after upload
  //   galleryImages: [],                       // array of resolved URLs
  // ─────────────────────────────────────────────────────────────────────
};
