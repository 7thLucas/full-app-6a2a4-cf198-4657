import { Outlet } from "react-router";
import { AppShell } from "~/components/app-shell";

/**
 * Pathless layout wrapping every authenticated-free CRM page in the app shell
 * (sidebar / mobile nav). Single-user app — no auth gate by design.
 */
export default function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
