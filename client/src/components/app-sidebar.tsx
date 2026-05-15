import {
	CalendarIcon,
	ChartBarIcon,
	ClockIcon,
	CommandIcon,
	HistoryIcon,
	InboxIcon,
	LayoutDashboardIcon,
	type LucideIcon,
	Settings2Icon,
	UserIcon,
	UsersIcon,
} from 'lucide-react';
import type * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NavUser } from '@/components/nav-user';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth';

type NavItem = {
	title: string;
	url: string;
	icon: LucideIcon;
};

const employeeNav: NavItem[] = [
	{ title: 'Today', url: '/', icon: LayoutDashboardIcon },
	{ title: 'History', url: '/history', icon: HistoryIcon },
	{ title: 'Schedule', url: '/schedule', icon: CalendarIcon },
	{ title: 'Profile', url: '/profile', icon: UserIcon },
	{ title: 'Settings', url: '/settings', icon: Settings2Icon },
];

const adminBase = '/admin';
const adminNav: NavItem[] = [
	{ title: 'Dashboard', url: adminBase, icon: LayoutDashboardIcon },
	{ title: 'Today', url: `${adminBase}/today`, icon: ClockIcon },
	{ title: 'Employees', url: `${adminBase}/employees`, icon: UsersIcon },
	{ title: 'Attendance', url: `${adminBase}/attendance`, icon: ClockIcon },
	{ title: 'Edit requests', url: `${adminBase}/edit-requests`, icon: InboxIcon },
	{ title: 'Reports', url: `${adminBase}/reports`, icon: ChartBarIcon },
	{ title: 'Profile', url: '/profile', icon: UserIcon },
	{ title: 'Settings', url: '/settings', icon: Settings2Icon },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user } = useAuth();
	const { profile } = useProfile();
	const { pathname } = useLocation();

	const isAdmin = profile?.role === 'admin';
	const items = isAdmin ? adminNav : employeeNav;

	const displayName = profile?.name ?? user?.email ?? 'Account';
	const email = user?.email ?? '';
	const subtitle = isAdmin ? 'People Ops' : 'Employee';

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							className="data-[slot=sidebar-menu-button]:p-1.5!"
							render={<NavLink to={isAdmin ? '/admin' : '/'} />}
						>
							<CommandIcon className="size-5!" />
							<span className="text-base font-semibold">Mini HCM</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => {
								const Icon = item.icon;
								const isActive =
									item.url === '/'
										? pathname === '/'
										: pathname === item.url ||
											pathname.startsWith(`${item.url}/`);
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											tooltip={item.title}
											isActive={isActive}
											render={<NavLink to={item.url} end={item.url === '/'} />}
										>
											<Icon />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{
						name: displayName,
						email: email || subtitle,
						avatar: '',
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	);
}
