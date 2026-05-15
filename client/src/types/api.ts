export type UserRole = 'employee' | 'admin';

export type UserLocation = 'On-Site' | 'Remote' | 'Hybrid';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contractual';

export type UserSchedule = {
	start: string;
	end: string;
	/** Day-of-week indices the employee works; 0=Sun..6=Sat. Defaults to Mon–Fri when absent. */
	workingDays?: number[];
};

export type UserProfile = {
	uid: string;
	name: string;
	email: string;
	role: UserRole;
	timezone: string;
	schedule: UserSchedule;
	location?: UserLocation;
	employmentType?: EmploymentType;
	createdAt: string | null;
};

export type AttendanceStatus = 'active' | 'completed';

export type ComputedAttendance = {
	regularHours: number;
	overtimeHours: number;
	nightDifferentialHours: number;
	lateMinutes: number;
	undertimeMinutes: number;
};

export type AttendanceEditSnapshot = {
	timeIn: string;
	timeOut: string | null;
};

export type AttendanceEdit = {
	at: string | null;
	by: string;
	reason: string | null;
	before: AttendanceEditSnapshot;
	after: AttendanceEditSnapshot;
};

export type AttendanceRecord = {
	id: string;
	userId: string;
	date: string;
	timeIn: string;
	timeOut: string | null;
	status: AttendanceStatus;
	computed: ComputedAttendance | null;
	edits?: AttendanceEdit[];
	createdAt: string | null;
	updatedAt: string | null;
};

export type DailySummary = {
	userId: string;
	date: string;
	regularHours: number;
	overtimeHours: number;
	nightDifferentialHours: number;
	lateMinutes: number;
	undertimeMinutes: number;
	totalHours: number;
	sessionsCount: number;
	/** ISO timestamp of the earliest completed-session timeIn for the day. */
	firstTimeIn: string | null;
	/** ISO timestamp of the latest completed-session timeOut for the day. */
	lastTimeOut: string | null;
	updatedAt: string | null;
};

export type HistoryResponse = {
	startDate: string;
	endDate: string;
	sessions: AttendanceRecord[];
};

export type ActiveSessionResponse = {
	session: AttendanceRecord | null;
};

export type DailySummaryResponse = {
	date: string;
	summary: DailySummary;
};

export type WeeklySummaryResponse = {
	startDate: string;
	days: DailySummary[];
};

export type EmployeesResponse = {
	employees: UserProfile[];
};

export type AdminAttendanceResponse = {
	userId: string;
	startDate: string;
	endDate: string;
	sessions: AttendanceRecord[];
};

export type AdminAttendanceByDateResponse = {
	date: string;
	sessions: AttendanceRecord[];
};

export type DailyReportResponse = {
	date: string;
	employees: UserProfile[];
	summaries: DailySummary[];
};

export type WeeklyReportResponse = {
	startDate: string;
	endDate: string;
	dates: string[];
	employees: UserProfile[];
	summaries: DailySummary[];
};

export type NotificationType =
	| 'punch_edited'
	| 'edit_request_created'
	| 'edit_request_approved'
	| 'edit_request_rejected';

export type NotificationMetadata = {
	attendanceId?: string;
	date?: string;
};

export type Notification = {
	id: string;
	recipientUid: string;
	actorUid: string;
	type: NotificationType;
	read: boolean;
	title: string;
	body: string;
	metadata?: NotificationMetadata;
	createdAt: string | null;
};

export type NotificationsResponse = {
	notifications: Notification[];
	unreadCount: number;
};

export type EditRequestStatus = 'pending' | 'approved' | 'rejected';

export type EditRequest = {
	id: string;
	attendanceId: string;
	requesterUid: string;
	date: string;
	originalTimeIn: string;
	originalTimeOut: string | null;
	requestedTimeIn: string | null;
	requestedTimeOut: string | null;
	reason: string;
	status: EditRequestStatus;
	createdAt: string | null;
	resolvedAt: string | null;
	resolvedBy: string | null;
	adminNote: string | null;
};

export type EditRequestsResponse = {
	editRequests: EditRequest[];
};
