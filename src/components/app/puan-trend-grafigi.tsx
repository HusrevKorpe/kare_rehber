type Veri = { tarih: Date; puan: number };

export function PuanTrendGrafigi({ veri }: { veri: Veri[] }) {
  if (veri.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Henüz puanlı görüşme bulunmuyor.
      </p>
    );
  }

  const w = 480;
  const h = 160;
  const padX = 28;
  const padY = 20;

  const n = veri.length;
  const adim = n === 1 ? 0 : (w - padX * 2) / (n - 1);

  const noktalar = veri.map((d, i) => {
    const x = n === 1 ? w / 2 : padX + i * adim;
    const y = padY + (1 - d.puan / 10) * (h - padY * 2);
    return { x, y, puan: d.puan, tarih: d.tarih };
  });

  const cizgi = noktalar
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const yGrid = [0, 5, 10];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Son 6 görüşme ilerleme puan trendi"
      className="w-full max-w-xl"
    >
      {yGrid.map((v) => {
        const y = padY + (1 - v / 10) * (h - padY * 2);
        return (
          <g key={v}>
            <line
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text x={4} y={y + 4} fontSize="10" fill="#64748b">
              {v}
            </text>
          </g>
        );
      })}
      <path d={cizgi} fill="none" stroke="#0f172a" strokeWidth="2" />
      {noktalar.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#0f172a" />
          <text
            x={p.x}
            y={p.y - 8}
            fontSize="10"
            textAnchor="middle"
            fill="#0f172a"
          >
            {p.puan}
          </text>
        </g>
      ))}
    </svg>
  );
}
