import { useLocation } from 'react-router-dom';
import { NotificationBell } from '@/components/NotificationBell';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useProfile } from '@/hooks/useProfile';

const TITLES: Record<string, string> = {
	'/admin': 'Dashboard',
	'/admin/today': 'Today',
	'/admin/employees': 'Employees',
	'/admin/attendance': 'Attendance',
	'/admin/reports': 'Reports',
	'/today': 'Today',
	'/history': 'History',
	'/profile': 'Profile',
	'/settings': 'Settings',
	'/employees': 'Employees',
	'/attendance': 'Attendance',
	'/reports': 'Reports',
};

function titleFor(pathname: string, isAdmin: boolean): string {
	if (pathname === '/') return isAdmin ? 'Dashboard' : 'Today';
	return TITLES[pathname] ?? 'Mini HCM';
}

export function SiteHeader() {
	const { pathname } = useLocation();
	const { profile } = useProfile();
	const isAdmin = profile?.role === 'admin';
	const title = titleFor(pathname, isAdmin);

	const now = new Intl.DateTimeFormat(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date());

	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 h-4 data-vertical:self-auto"
				/>
				<h1 className="text-base font-medium">{title}</h1>
				<div className="ml-auto flex items-center gap-1">
					<NotificationBell />
					<Separator
						orientation="vertical"
						className="mx-2 h-4 data-vertical:self-auto"
					/>
					<span className="text-xs text-muted-foreground hidden sm:inline">
						{now}
					</span>
				</div>
			</div>
		</header>
	);
}
