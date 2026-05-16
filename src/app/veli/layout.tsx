import { PanelShell } from "@/components/app/panel-shell";
import { PANEL_MENULERI } from "@/lib/menu";
import { requireRole } from "@/server/auth";

export default async function VeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("VELI");
  return (
    <PanelShell
      rol="VELI"
      isim={session.user.name ?? "Veli"}
      menu={PANEL_MENULERI.VELI}
    >
      {children}
    </PanelShell>
  );
}
