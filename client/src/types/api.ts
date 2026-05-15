export type UserRole = 'employee' | 'admin';

export type UserLocation = 'On-Site' | 'Remote' | 'Hybrid';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contractual';

export type UserSchedule = {
	start: string;
	end: string;
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
