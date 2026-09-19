"use client";

export type Point = { label: string; value: number };

function niceMax(values: number[]) {
  const max = Math.max(1, ...values);
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / pow) * pow;
}

export function LineChart({ data, height = 160, color = "#60a5fa" }: { data: Point[]; height?: number; color?: string }) {
  if (data.length === 0) return <Empty height={height} />;
  const max = niceMax(data.map((d) => d.value));
  const stepX = data.length > 1 ? 100 / (data.length - 1) : 0;
  const points = data.map((d, i) => `${i * stepX},${100 - (d.value / max) * 100}`).join(" ");
  const area = `0,100 ${points} 100,100`;
  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height }}>
        <polygon points={area} fill={color} opacity={0.15} />
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      <Axis data={data} max={max} />
    </div>
  );
}

export function BarChart({ data, height = 160, color = "#34d399" }: { data: Point[]; height?: number; color?: string }) {
  if (data.length === 0) return <Empty height={height} />;
  const max = niceMax(data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col justify-end" title={`${d.label}: ${d.value}`}>
            <div style={{ height: `${(d.value / max) * 100}%`, background: color, borderRadius: 4, minHeight: 2 }} />
          </div>
        ))}
      </div>
      <Axis data={data} max={max} />
    </div>
  );
}

export function DonutChart({ data, size = 160 }: { data: Point[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (!total) return <Empty height={size} />;
  const palette = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171", "#38bdf8", "#4ade80"];
  let offset = 0;
  const radius = 15.9155;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" width={size} height={size}>
        {data.map((d, i) => {
          const pct = (d.value / total) * 100;
          const circle = (
            <circle
              key={d.label}
              cx="21"
              cy="21"
              r={radius}
              fill="transparent"
              stroke={palette[i % palette.length]}
              strokeWidth="6"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={25 - offset}
            />
          );
          offset += pct;
          return circle;
        })}
      </svg>
      <div className="space-y-1 text-sm">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: palette[i % palette.length] }}
            />
            <span>{d.label}</span>
            <span className="muted">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Axis({ data, max }: { data: Point[]; max: number }) {
  return (
    <div className="flex justify-between muted text-[10px] mt-1">
      <span>{data[0]?.label}</span>
      <span>макс. {max}</span>
      <span>{data[data.length - 1]?.label}</span>
    </div>
  );
}

function Empty({ height }: { height: number }) {
  return (
    <div className="grid place-items-center muted text-sm" style={{ height }}>
      Нет данных за период
    </div>
  );
}
