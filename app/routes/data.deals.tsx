import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  listDeals,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from "~/data/crm.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const contactId = url.searchParams.get("contactId") ?? undefined;
  const deals = await listDeals(contactId);
  return Response.json({ deals });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "create");

  if (intent === "create") {
    const title = String(form.get("title") ?? "").trim();
    const contactId = String(form.get("contactId") ?? "");
    const stage = String(form.get("stage") ?? "").trim();
    if (!title || !contactId || !stage) {
      return Response.json({ error: "Title, contact and stage are required" }, { status: 400 });
    }
    const deal = await createDeal({
      title,
      contactId,
      stage,
      value: num(form.get("value")),
      nextFollowUpAt: str(form.get("nextFollowUpAt")),
    });
    if (!deal) return Response.json({ error: "Invalid contact" }, { status: 400 });
    return Response.json({ deal });
  }

  if (intent === "move") {
    const id = String(form.get("id") ?? "");
    const stage = String(form.get("stage") ?? "").trim();
    const ok = await updateDealStage(id, stage);
    return Response.json({ ok });
  }

  if (intent === "update") {
    const id = String(form.get("id") ?? "");
    const followUpRaw = form.get("nextFollowUpAt");
    const ok = await updateDeal(id, {
      title: str(form.get("title")),
      stage: str(form.get("stage")),
      value: num(form.get("value")),
      nextFollowUpAt: followUpRaw === null ? undefined : (str(followUpRaw) ?? null),
    });
    return Response.json({ ok });
  }

  if (intent === "delete") {
    const id = String(form.get("id") ?? "");
    const ok = await deleteDeal(id);
    return Response.json({ ok });
  }

  return Response.json({ error: "Unknown intent" }, { status: 400 });
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s.length ? s : undefined;
}

function num(v: FormDataEntryValue | null): number | undefined {
  if (v == null || String(v).trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
