import { formatDistanceToNow } from 'date-fns';
import { BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/api';

export function NotificationBell() {
	const { notifications, unreadCount, error, markRead, markAllRead } =
		useNotifications();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`Notifications${
							unreadCount > 0 ? ` (${unreadCount} unread)` : ''
						}`}
						className="relative"
					/>
				}
			>
				<BellIcon />
				{unreadCount > 0 ? (
					<span className="absolute right-1 top-1 flex size-2 items-center justify-center rounded-full bg-rose-500 ring-2 ring-background" />
				) : null}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				sideOffset={6}
				className="w-80 min-w-80 p-0"
			>
				<div className="flex items-center gap-2 border-b px-3 py-2">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Notifications
					</span>
					{unreadCount > 0 ? (
						<span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-rose-700 dark:text-rose-400">
							{unreadCount}
						</span>
					) : null}
					<div className="flex-1" />
					{unreadCount > 0 ? (
						<Button
							variant="ghost"
							size="xs"
							onClick={() => void markAllRead()}
						>
							Mark all read
						</Button>
					) : null}
				</div>
				<div className="max-h-96 overflow-y-auto">
					{error ? (
						<div className="border-b bg-destructive/10 px-3 py-2 text-[11px] leading-relaxed text-destructive">
							<div className="font-semibold">Notifications listener error</div>
							<div className="mt-0.5 wrap-break-word font-mono text-[10px]">
								{error}
							</div>
							<div className="mt-1 text-muted-foreground">
								Make sure Firestore rules are deployed: <code>firebase deploy --only firestore:rules</code>
							</div>
						</div>
					) : null}
					{notifications.length === 0 && !error ? (
						<div className="px-4 py-8 text-center text-xs text-muted-foreground">
							No notifications yet.
						</div>
					) : notifications.length === 0 ? null : (
						<ul className="flex flex-col">
							{notifications.map((n, i) => (
								<li
									key={n.id}
									className={cn(
										'border-l-[3px]',
										!n.read
											? 'border-l-primary bg-primary/5'
											: 'border-l-transparent',
										i < notifications.length - 1 && 'border-b',
									)}
								>
									<button
										type="button"
										className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-muted/40"
										onClick={() => void markRead(n.id)}
									>
										<div className="flex items-baseline justify-between gap-2">
											<span
												className={cn(
													'truncate text-xs',
													n.read ? 'font-medium' : 'font-semibold',
												)}
											>
												{n.title}
											</span>
											<span className="shrink-0 text-[10px] text-muted-foreground">
												{relativeTime(n.createdAt)}
											</span>
										</div>
										<p className="truncate text-[11px] text-muted-foreground">
											{n.body}
										</p>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function relativeTime(iso: string | null): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return formatDistanceToNow(d, { addSuffix: true });
}

export type { Notification };
