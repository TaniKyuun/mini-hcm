type KpiCardProps = {
	label: string;
	value: string;
	hint?: string;
	accent?: 'teal' | 'amber' | 'indigo' | 'rose' | 'zinc';
};

const accentClasses: Record<NonNullable<KpiCardProps['accent']>, string> = {
	teal: 'text-teal-700',
	amber: 'text-amber-700',
	indigo: 'text-indigo-700',
	rose: 'text-rose-700',
	zinc: 'text-zinc-700',
};

export function KpiCard({ label, value, hint, accent = 'zinc' }: KpiCardProps) {
	return (
		<div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
			<p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
				{label}
			</p>
			<p
				className={`mt-2 text-2xl font-semibold tabular-nums ${accentClasses[accent]}`}
			>
				{value}
			</p>
			{hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
		</div>
	);
}
