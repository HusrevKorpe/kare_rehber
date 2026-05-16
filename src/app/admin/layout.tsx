import { PanelShell } from "@/components/app/panel-shell";
import { PANEL_MENULERI } from "@/lib/menu";
import { requireRole } from "@/server/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("ADMIN");
  return (
    <PanelShell
      rol="ADMIN"
      isim={session.user.name ?? "Admin"}
      menu={PANEL_MENULERI.ADMIN}
    >
      {children}
    </PanelShell>
  );
}
