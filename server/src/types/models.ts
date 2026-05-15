import type { Timestamp } from 'firebase-admin/firestore';

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
	createdAt: Timestamp;
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
	at: Timestamp;
	by: string;
	reason: string | null;
	before: AttendanceEditSnapshot;
	after: AttendanceEditSnapshot;
};

export type AttendanceDoc = {
	userId: string;
	date: string;
	timeIn: Timestamp;
	timeOut: Timestamp | null;
	status: AttendanceStatus;
	computed: ComputedAttendance | null;
	edits?: AttendanceEdit[];
	createdAt: Timestamp;
	updatedAt: Timestamp;
};

export type DailySummaryDoc = {
	userId: string;
	date: string;
	regularHours: number;
	overtimeHours: number;
	nightDifferentialHours: number;
	lateMinutes: number;
	undertimeMinutes: number;
	totalHours: number;
	sessionsCount: number;
	updatedAt: Timestamp;
};
