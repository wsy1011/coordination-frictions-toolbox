"use client";

function scale(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((value) => Math.max((Math.abs(value) / max) * 100, 4));
}

export function BarChartPanel({
  title,
  subtitle,
  labels,
  values,
  color,
}: {
  title: string;
  subtitle: string;
  labels: string[];
  values: number[];
  color: string;
}) {
  const widths = scale(values);

  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-display)] text-xl">{title}</h3>
        <p className="text-sm text-[var(--ink-600)]">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {labels.map((label, index) => (
          <div key={`${label}-${index}`} className="grid grid-cols-[120px_1fr_70px] items-center gap-3">
            <p className="truncate text-sm text-[var(--ink-700)]">{label}</p>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--sand-200)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${widths[index]}%`, backgroundColor: color }}
              />
            </div>
            <p className="text-right text-sm font-medium text-[var(--ink-800)]">
              {values[index].toFixed(3)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DoughnutChartPanel({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ name: string; value: number }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const colors = ["#0d5291", "#4f7cac", "#d77223", "#c4a25a"];
  const conic = items
    .map((item, index) => {
      const before = items.slice(0, index).reduce((sum, current) => sum + current.value, 0);
      const start = (before / total) * 360;
      const end = ((before + item.value) / total) * 360;
      return `${colors[index % colors.length]} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-white/92 p-5 shadow-[0_16px_40px_rgba(32,42,56,0.08)]">
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-display)] text-xl">{title}</h3>
        <p className="text-sm text-[var(--ink-600)]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-6">
        <div
          className="relative h-44 w-44 rounded-full"
          style={{ background: `conic-gradient(${conic})` }}
        >
          <div className="absolute inset-[26%] rounded-full bg-white" />
        </div>
        <div className="flex-1 space-y-2">
          {items.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-[var(--ink-700)]">{item.name}</span>
              </div>
              <span className="font-medium text-[var(--ink-900)]">
                {(item.value * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
