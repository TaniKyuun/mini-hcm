import { Card, CardContent } from '@/components/ui/card';

type KpiCardProps = {
	label: string;
	value: string;
	hint?: string;
	accent?: 'default' | 'primary';
};

export function KpiCard({
	label,
	value,
	hint,
	accent = 'default',
}: KpiCardProps) {
	return (
		<Card className={accent === 'primary' ? 'ring-2 ring-primary/50' : ''}>
			<CardContent className="flex flex-col gap-2">
				<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
					{label}
				</p>
				<p className="text-3xl font-semibold tabular-nums leading-none tracking-tight">
					{value}
				</p>
				{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
			</CardContent>
		</Card>
	);
}
