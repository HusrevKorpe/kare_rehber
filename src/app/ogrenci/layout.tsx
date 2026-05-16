import { PanelShell } from "@/components/app/panel-shell";
import { PANEL_MENULERI } from "@/lib/menu";
import { requireRole } from "@/server/auth";

export default async function OgrenciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("OGRENCI");
  return (
    <PanelShell
      rol="OGRENCI"
      isim={session.user.name ?? "Öğrenci"}
      menu={PANEL_MENULERI.OGRENCI}
    >
      {children}
    </PanelShell>
  );
}
