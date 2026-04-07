export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[26px] border border-[var(--line)] bg-white/90 p-5 shadow-[0_12px_30px_rgba(32,42,56,0.06)]">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-500)]">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-none text-[var(--ink-900)]">
        {value}
      </p>
      <p className="mt-3 text-sm text-[var(--ink-600)]">{helper}</p>
    </div>
  );
}

