import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  listInteractions,
  createInteraction,
  deleteInteraction,
} from "~/data/crm.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const contactId = url.searchParams.get("contactId") ?? undefined;
  const limit = url.searchParams.get("limit");
  const interactions = await listInteractions({
    contactId,
    limit: limit ? Number(limit) : undefined,
  });
  return Response.json({ interactions });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "create");

  if (intent === "create") {
    const contactId = String(form.get("contactId") ?? "");
    const type = String(form.get("type") ?? "").trim();
    if (!contactId || !type) {
      return Response.json({ error: "Contact and type are required" }, { status: 400 });
    }
    const interaction = await createInteraction({
      contactId,
      dealId: str(form.get("dealId")),
      type,
      summary: str(form.get("summary")),
      occurredAt: str(form.get("occurredAt")),
    });
    if (!interaction) return Response.json({ error: "Invalid contact" }, { status: 400 });
    return Response.json({ interaction });
  }

  if (intent === "delete") {
    const id = String(form.get("id") ?? "");
    const ok = await deleteInteraction(id);
    return Response.json({ ok });
  }

  return Response.json({ error: "Unknown intent" }, { status: 400 });
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s.length ? s : undefined;
}
