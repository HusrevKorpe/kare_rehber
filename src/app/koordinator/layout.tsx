import { PanelShell } from "@/components/app/panel-shell";
import { PANEL_MENULERI } from "@/lib/menu";
import { requireRole } from "@/server/auth";

export default async function KoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("KOORDINATOR");
  return (
    <PanelShell
      rol="KOORDINATOR"
      isim={session.user.name ?? "Koordinatör"}
      menu={PANEL_MENULERI.KOORDINATOR}
    >
      {children}
    </PanelShell>
  );
}
