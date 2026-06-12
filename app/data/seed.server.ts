import { ContactModel } from "./contact.model";
import { DealModel } from "./deal.model";
import { InteractionModel } from "./interaction.model";

let seeded = false;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

/**
 * One-time demo seed so a brand-new install opens onto a living pipeline rather
 * than an empty board. Idempotent: only runs when there are zero contacts.
 * Lazily invoked from the contacts loader (no module-discovery seed needed).
 */
export async function ensureDemoData(): Promise<void> {
  if (seeded) return;
  const existing = await ContactModel.countDocuments({ deletedAt: null }).exec();
  if (existing > 0) {
    seeded = true;
    return;
  }

  try {
    const [maya, dan, priya, leo] = await ContactModel.create([
      {
        name: "Maya Chen",
        company: "Northwind Studio",
        email: "maya@northwind.studio",
        phone: "+1 415 555 0142",
        notes: "Met at the design meetup. Wants a brand refresh before their Q3 launch.",
      },
      {
        name: "Dan Okafor",
        company: "Lighthouse Coffee",
        email: "dan@lighthouse.coffee",
        phone: "+1 503 555 0188",
        notes: "Referral from Maya. Opening two new locations.",
      },
      {
        name: "Priya Raman",
        company: "Fernpath Outdoors",
        email: "priya@fernpath.co",
        notes: "Warm lead — replied to the newsletter. Budget unclear.",
      },
      {
        name: "Leo Martins",
        company: "Studio Vine",
        email: "leo@studiovine.io",
        phone: "+1 212 555 0119",
        notes: "Closed last year. Possible retainer renewal.",
      },
    ]);

    const [website, cafeBranding, retainer, packaging] = await DealModel.create([
      {
        title: "Website redesign",
        contactId: maya._id,
        stage: "proposal",
        value: 18000,
        nextFollowUpAt: daysFromNow(2),
        lastActivityAt: daysAgo(1),
      },
      {
        title: "Cafe branding package",
        contactId: dan._id,
        stage: "negotiation",
        value: 9500,
        nextFollowUpAt: daysAgo(1), // overdue follow-up
        lastActivityAt: daysAgo(3),
      },
      {
        title: "Newsletter consult",
        contactId: priya._id,
        stage: "lead",
        value: 2500,
        lastActivityAt: daysAgo(12), // stale
      },
      {
        title: "Annual retainer renewal",
        contactId: leo._id,
        stage: "won",
        value: 24000,
        lastActivityAt: daysAgo(5),
      },
    ]);

    await InteractionModel.create([
      {
        contactId: maya._id,
        dealId: website._id,
        type: "meeting",
        summary: "Walked through three homepage directions. She likes direction B. Sending proposal.",
        occurredAt: daysAgo(1),
      },
      {
        contactId: maya._id,
        dealId: website._id,
        type: "email",
        summary: "Sent the scoping questionnaire.",
        occurredAt: daysAgo(4),
      },
      {
        contactId: dan._id,
        dealId: cafeBranding._id,
        type: "call",
        summary: "Discussed budget. He needs to confirm with his partner this week.",
        occurredAt: daysAgo(3),
      },
      {
        contactId: priya._id,
        dealId: retainer._id,
        type: "note",
        summary: "Replied to newsletter asking about pricing. Haven't followed up — easy to let slip.",
        occurredAt: daysAgo(12),
      },
      {
        contactId: leo._id,
        dealId: packaging._id,
        type: "meeting",
        summary: "Signed the renewal. Kickoff scheduled for next month.",
        occurredAt: daysAgo(5),
      },
    ]);

    seeded = true;
  } catch (err) {
    // Non-fatal: an empty app is still usable.
    console.error("[Thread] demo seed failed:", err);
  }
}
