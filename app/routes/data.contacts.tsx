import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
} from "~/data/crm.service";
import { ensureDemoData } from "~/data/seed.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await ensureDemoData();
  const url = new URL(request.url);
  const search = url.searchParams.get("q") ?? undefined;
  const contacts = await listContacts(search);
  return Response.json({ contacts });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "create");

  if (intent === "create") {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
    const contact = await createContact({
      name,
      company: str(form.get("company")),
      email: str(form.get("email")),
      phone: str(form.get("phone")),
      notes: str(form.get("notes")),
    });
    return Response.json({ contact });
  }

  if (intent === "update") {
    const id = String(form.get("id") ?? "");
    const contact = await updateContact(id, {
      name: str(form.get("name")),
      company: str(form.get("company")),
      email: str(form.get("email")),
      phone: str(form.get("phone")),
      notes: str(form.get("notes")),
    });
    if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });
    return Response.json({ contact });
  }

  if (intent === "delete") {
    const id = String(form.get("id") ?? "");
    const ok = await deleteContact(id);
    return Response.json({ ok });
  }

  return Response.json({ error: "Unknown intent" }, { status: 400 });
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s.length ? s : undefined;
}
