import type { Timestamp } from 'firebase-admin/firestore';

export type UserRole = 'employee' | 'admin';

export type UserLocation = 'On-Site' | 'Remote' | 'Hybrid';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contractual';

export type UserSchedule = {
	start: string;
	end: string;
	/** Day-of-week indices the employee is scheduled to work; 0=Sun..6=Sat. Defaults to Mon–Fri when absent. */
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
	/** Earliest completed-session timeIn for the day. Null when the day has no completed sessions, or on legacy summaries written before this field existed. */
	firstTimeIn: Timestamp | null;
	/** Latest completed-session timeOut for the day. Same null-rules as firstTimeIn. */
	lastTimeOut: Timestamp | null;
	updatedAt: Timestamp | null;
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

export type NotificationDoc = {
	recipientUid: string;
	actorUid: string;
	type: NotificationType;
	read: boolean;
	title: string;
	body: string;
	metadata?: NotificationMetadata;
	createdAt: Timestamp;
};

export type EditRequestStatus = 'pending' | 'approved' | 'rejected';

export type AttendanceEditRequestDoc = {
	/** Doc id of the attendance record being amended. */
	attendanceId: string;
	/** uid of the employee who owns the attendance and filed the request. */
	requesterUid: string;
	/** YYYY-MM-DD date of the punch (from the attendance doc). */
	date: string;
	/** Snapshot of the times when the request was filed. */
	originalTimeIn: string;
	originalTimeOut: string | null;
	/** Requested replacements. `null` = clear field, `undefined` = leave as-is. */
	requestedTimeIn: string | null;
	requestedTimeOut: string | null;
	/** Required free-text from the employee. */
	reason: string;
	status: EditRequestStatus;
	createdAt: Timestamp;
	resolvedAt: Timestamp | null;
	resolvedBy: string | null;
	adminNote: string | null;
};
