"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { gorusmeOnayla, gorusmeReddet } from "@/server/gorusme";

export function OnayAksiyon({ gorusmeId }: { gorusmeId: string }) {
  const router = useRouter();
  const [bekliyor, startTransition] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [redModu, setRedModu] = useState(false);
  const [redSebebi, setRedSebebi] = useState("");

  const onaylaTikla = () => {
    if (!confirm("Görüşme onaylanacak. Devam?")) return;
    setHata(null);
    startTransition(async () => {
      const s = await gorusmeOnayla(gorusmeId);
      if (!s.ok) {
        setHata(s.hata);
        return;
      }
      router.refresh();
    });
  };

  const reddetGonder = () => {
    setHata(null);
    startTransition(async () => {
      const s = await gorusmeReddet(gorusmeId, redSebebi || undefined);
      if (!s.ok) {
        setHata(s.hata);
        return;
      }
      setRedModu(false);
      setRedSebebi("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {hata ? <Alert tonu="hata">{hata}</Alert> : null}
      {!redModu ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onaylaTikla} disabled={bekliyor} size="sm">
            Onayla
          </Button>
          <Button
            variant="outline"
            onClick={() => setRedModu(true)}
            disabled={bekliyor}
            size="sm"
          >
            Reddet
          </Button>
        </div>
      ) : (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="text-xs font-medium text-slate-600">
            Red sebebi (opsiyonel)
          </label>
          <Textarea
            value={redSebebi}
            onChange={(e) => setRedSebebi(e.target.value)}
            rows={2}
            placeholder="Koça gidecek not."
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={reddetGonder}
              disabled={bekliyor}
              size="sm"
            >
              Reddi onayla
            </Button>
            <Button
              variant="ghost"
              onClick={() => setRedModu(false)}
              disabled={bekliyor}
              size="sm"
            >
              Vazgeç
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
