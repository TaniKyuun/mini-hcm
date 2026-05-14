export type UserRole = 'employee' | 'admin';

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

export type AttendanceRecord = {
	id: string;
	userId: string;
	date: string;
	timeIn: string;
	timeOut: string | null;
	status: AttendanceStatus;
	computed: ComputedAttendance | null;
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
