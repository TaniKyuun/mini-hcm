import { KpiCard } from '../components/KpiCard';
import { PunchCard } from '../components/PunchCard';
import { useActiveSession } from '../hooks/useActiveSession';
import { useDailySummary } from '../hooks/useDailySummary';
import { useProfile } from '../hooks/useProfile';
import { formatDate, formatHours } from '../utils/formatTime';

export function Dashboard() {
	const { profile } = useProfile();
	const { session, setSession, refresh: refreshSession } = useActiveSession();
	const { summary, date, refresh: refreshSummary } = useDailySummary();

	function handleSessionChange(next: typeof session) {
		setSession(next);
		void refreshSession();
		void refreshSummary();
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-zinc-900">
					Hi{profile ? `, ${profile.name}` : ''}.
				</h2>
				<p className="text-sm text-zinc-500">
					{date ? formatDate(date) : 'Today'} · scheduled{' '}
					{profile?.schedule.start ?? '09:00'} –{' '}
					{profile?.schedule.end ?? '18:00'}
				</p>
			</div>

			<PunchCard
				session={session}
				timezone={profile?.timezone}
				onChange={handleSessionChange}
			/>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Regular hours"
					value={formatHours(summary?.regularHours ?? 0)}
					accent="teal"
				/>
				<KpiCard
					label="Overtime"
					value={formatHours(summary?.overtimeHours ?? 0)}
					accent="amber"
				/>
				<KpiCard
					label="Night diff."
					value={formatHours(summary?.nightDifferentialHours ?? 0)}
					accent="indigo"
				/>
				<KpiCard
					label="Total today"
					value={formatHours(summary?.totalHours ?? 0)}
					hint={`${summary?.sessionsCount ?? 0} session${
						(summary?.sessionsCount ?? 0) === 1 ? '' : 's'
					}`}
				/>
				<KpiCard
					label="Late minutes"
					value={String(summary?.lateMinutes ?? 0)}
					accent="rose"
				/>
				<KpiCard
					label="Undertime"
					value={`${summary?.undertimeMinutes ?? 0} m`}
					accent="rose"
				/>
			</div>
		</div>
	);
}
