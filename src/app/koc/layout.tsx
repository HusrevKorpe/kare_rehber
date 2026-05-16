import { PanelShell } from "@/components/app/panel-shell";
import { PANEL_MENULERI } from "@/lib/menu";
import { requireRole } from "@/server/auth";

export default async function KocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("KOC");
  return (
    <PanelShell
      rol="KOC"
      isim={session.user.name ?? "Koç"}
      menu={PANEL_MENULERI.KOC}
    >
      {children}
    </PanelShell>
  );
}
