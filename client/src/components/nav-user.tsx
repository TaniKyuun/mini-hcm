import { signOut } from 'firebase/auth';
import { LogOutIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { auth } from '@/lib/firebase';

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0) return '··';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		avatar: string;
	};
}) {
	const initials = getInitials(user.name);

	async function handleSignOut() {
		try {
			await signOut(auth);
		} catch {
			/* surfaces on next interaction */
		}
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<div className="overflow-hidden rounded-md bg-sidebar-accent/40 group-data-[collapsible=icon]:bg-transparent">
					{/* Profile */}
					<div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:p-0">
						<Avatar className="size-8 shrink-0 rounded-lg">
							<AvatarImage src={user.avatar} alt={user.name} />
							<AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
						</Avatar>
						<div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
							<span className="truncate text-sm font-medium">{user.name}</span>
							<span className="truncate text-xs text-muted-foreground">
								{user.email}
							</span>
						</div>
					</div>

					{/* Sign out - visually attached to the profile, destructive on hover */}
					<button
						type="button"
						onClick={() => void handleSignOut()}
						title="Sign out"
						className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground/75 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive focus-visible:outline-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-2"
					>
						<span className="flex size-6 shrink-0 items-center justify-center group-data-[collapsible=icon]:size-auto">
							<LogOutIcon className="size-4" />
						</span>
						<span className="group-data-[collapsible=icon]:hidden">
							Sign out
						</span>
					</button>
				</div>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
