import { type RequestHandler, Router } from 'express';
import {
	serializeAttendance,
	serializeDailySummary,
	serializeEditRequest,
	serializeProfile,
} from '../lib/serialize.js';
import { authenticateFirebase } from '../middleware/authenticateFirebase.js';
import { type AdminLocals, requireAdmin } from '../middleware/requireAdmin.js';
import {
	adminListAttendance,
	adminUpdateAttendance,
	listAttendanceOnDate,
	NotFoundError,
} from '../services/attendanceService.js';
import {
	approveEditRequest,
	listEditRequests,
	rejectEditRequest,
} from '../services/editRequestService.js';
import { createNotification } from '../services/notificationService.js';
import {
	buildWeekDates,
	listAllDailySummariesInRange,
	listAllDailySummariesOnDate,
} from '../services/summaryService.js';
import {
	adminUpdateProfile,
	createEmployeeProfile,
	EmailAlreadyExistsError,
	listAllProfiles,
	ValidationError,
} from '../services/userService.js';
import type {
	EditRequestStatus,
	EmploymentType,
	UserLocation,
	UserRole,
	UserSchedule,
} from '../types/models.js';

const getEmployees: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AdminLocals
> = async (_req, res, next) => {
	try {
		const profiles = await listAllProfiles();
		res.json({ employees: profiles.map(serializeProfile) });
	} catch (error) {
		next(error);
	}
};

type AdminProfileUpdateBody = {
	name?: string;
	email?: string;
	role?: UserRole;
	timezone?: string;
	schedule?: UserSchedule;
	location?: UserLocation;
	employmentType?: EmploymentType;
};

const putEmployee: RequestHandler<
	{ uid: string },
	unknown,
	AdminProfileUpdateBody,
	Record<string, never>,
	AdminLocals
> = async (req, res, next) => {
	try {
		const updated = await adminUpdateProfile(req.params.uid, req.body ?? {});
		res.json(serializeProfile(updated));
	} catch (error) {
		if (error instanceof ValidationError) {
			res.status(400).json({ error: error.message, field: error.field });
			return;
		}
		next(error);
	}
};

type CreateEmployeeBody = {
	name?: string;
	email?: string;
	password?: string;
	role?: UserRole;
	timezone?: string;
	schedule?: UserSchedule;
	location?: UserLocation;
	employmentType?: EmploymentType;
};

const postEmployee: RequestHandler<
	Record<string, never>,
	unknown,
	CreateEmployeeBody,
	Record<string, never>,
	AdminLocals
> = async (req, res, next) => {
	try {
		const body = req.body ?? {};
		if (
			typeof body.name !== 'string' ||
			typeof body.email !== 'string' ||
			typeof body.password !== 'string'
		) {
			res
				.status(400)
				.json({ error: 'name, email, and password are required.' });
			return;
		}
		const created = await createEmployeeProfile({
			name: body.name,
			email: body.email,
			password: body.password,
			role: body.role,
			timezone: body.timezone,
			schedule: body.schedule,
			location: body.location,
			employmentType: body.employmentType,
		});
		res.status(201).json(serializeProfile(created));
	} catch (error) {
		if (error instanceof EmailAlreadyExistsError) {
			res.status(409).json({ error: error.message });
			return;
		}
		if (error instanceof ValidationError) {
			res.status(400).json({ error: error.message, field: error.field });
			return;
		}
		next(error);
	}
};

type AdminAttendanceQuery = {
	userId?: string;
	startDate?: string;
	endDate?: string;
};

const getAttendance: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	AdminAttendanceQuery,
	AdminLocals
> = async (req, res, next) => {
	try {
		const { userId, startDate, endDate } = req.query;
		if (!userId) {
			res.status(400).json({ error: 'userId is required.' });
			return;
		}
		const range = resolveDateRange(startDate, endDate);
		const sessions = await adminListAttendance(
			userId,
			range.startDate,
			range.endDate,
		);
		res.json({
			userId,
			startDate: range.startDate,
			endDate: range.endDate,
			sessions: sessions.map((s) => serializeAttendance(s.id, s)),
		});
	} catch (error) {
		next(error);
	}
};

type AdminAttendanceByDateQuery = {
	date?: string;
};

const getAttendanceByDate: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	AdminAttendanceByDateQuery,
	AdminLocals
> = async (req, res, next) => {
	try {
		const date = req.query.date ?? new Date().toISOString().slice(0, 10);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			res
				.status(400)
				.json({ error: 'date must be in YYYY-MM-DD format.', field: 'date' });
			return;
		}
		const sessions = await listAttendanceOnDate(date);
		res.json({
			date,
			sessions: sessions.map((s) => serializeAttendance(s.id, s)),
		});
	} catch (error) {
		next(error);
	}
};

type AdminAttendanceUpdateBody = {
	timeIn?: string;
	timeOut?: string | null;
	reason?: string;
	notify?: boolean;
};

const putAttendance: RequestHandler<
	{ id: string },
	unknown,
	AdminAttendanceUpdateBody,
	Record<string, never>,
	AdminLocals
> = async (req, res, next) => {
	try {
		const actingUid = res.locals.firebaseUser.uid;
		const updated = await adminUpdateAttendance(
			req.params.id,
			req.body ?? {},
			actingUid,
		);
		res.json(serializeAttendance(updated.id, updated));
	} catch (error) {
		if (error instanceof NotFoundError) {
			res.status(404).json({ error: error.message });
			return;
		}
		if (error instanceof ValidationError) {
			res.status(400).json({ error: error.message, field: error.field });
			return;
		}
		next(error);
	}
};

type DailyReportQuery = {
	date?: string;
};

const getDailyReport: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	DailyReportQuery,
	AdminLocals
> = async (req, res, next) => {
	try {
		const date = req.query.date ?? new Date().toISOString().slice(0, 10);
		const [summaries, employees] = await Promise.all([
			listAllDailySummariesOnDate(date),
			listAllProfiles(),
		]);
		res.json({
			date,
			employees: employees.map(serializeProfile),
			summaries: summaries.map(serializeDailySummary),
		});
	} catch (error) {
		next(error);
	}
};

type WeeklyReportQuery = {
	startDate?: string;
};

const getWeeklyReport: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	WeeklyReportQuery,
	AdminLocals
> = async (req, res, next) => {
	try {
		const startDate =
			req.query.startDate ?? new Date().toISOString().slice(0, 10);
		const dates = buildWeekDates(startDate);
		const lastDate = dates[dates.length - 1] ?? startDate;
		const [summaries, employees] = await Promise.all([
			listAllDailySummariesInRange(startDate, lastDate),
			listAllProfiles(),
		]);
		res.json({
			startDate,
			endDate: lastDate,
			dates,
			employees: employees.map(serializeProfile),
			summaries: summaries.map(serializeDailySummary),
		});
	} catch (error) {
		next(error);
	}
};

function resolveDateRange(
	startDate: string | undefined,
	endDate: string | undefined,
): { startDate: string; endDate: string } {
	const today = new Date().toISOString().slice(0, 10);
	const resolvedEnd = endDate ?? today;
	const resolvedStart = startDate ?? subtractDays(resolvedEnd, 30);
	return { startDate: resolvedStart, endDate: resolvedEnd };
}

function subtractDays(dateStr: string, days: number): string {
	const d = new Date(`${dateStr}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString().slice(0, 10);
}

type TestNotificationBody = {
	recipientUid?: string;
};

const postTestNotification: RequestHandler<
	Record<string, never>,
	unknown,
	TestNotificationBody,
	Record<string, never>,
	AdminLocals
> = async (req, res, next) => {
	try {
		const actorUid = res.locals.firebaseUser.uid;
		const recipientUid = req.body?.recipientUid?.trim() || actorUid;
		const id = await createNotification({
			recipientUid,
			actorUid,
			type: 'punch_edited',
			title: 'Test notification',
			body: `Demo from admin settings · ${new Date().toLocaleString()}`,
		});
		res.status(201).json({ id, recipientUid });
	} catch (error) {
		next(error);
	}
};

type AdminEditRequestsQuery = {
	status?: EditRequestStatus;
};

const getEditRequests: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	AdminEditRequestsQuery,
	AdminLocals
> = async (req, res, next) => {
	try {
		const status =
			req.query.status === 'pending' ||
			req.query.status === 'approved' ||
			req.query.status === 'rejected'
				? req.query.status
				: undefined;
		const items = await listEditRequests(status);
		const sorted = items.sort(
			(a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
		);
		res.json({
			editRequests: sorted.map((r) => serializeEditRequest(r.id, r)),
		});
	} catch (error) {
		next(error);
	}
};

type AdminResolveEditRequestBody = {
	adminNote?: string;
};

const postApproveEditRequest: RequestHandler<
	{ id: string },
	unknown,
	AdminResolveEditRequestBody,
	Record<string, never>,
	AdminLocals
> = async (req, res, next) => {
	try {
		const adminUid = res.locals.firebaseUser.uid;
		const updated = await approveEditRequest(
			req.params.id,
			adminUid,
			req.body?.adminNote,
		);
		res.json(serializeEditRequest(updated.id, updated));
	} catch (error) {
		if (error instanceof NotFoundError) {
			res.status(404).json({ error: error.message });
			return;
		}
		if (error instanceof ValidationError) {
			res.status(400).json({ error: error.message, field: error.field });
			return;
		}
		next(error);
	}
};

const postRejectEditRequest: RequestHandler<
	{ id: string },
	unknown,
	AdminResolveEditRequestBody,
	Record<string, never>,
	AdminLocals
> = async (req, res, next) => {
	try {
		const adminUid = res.locals.firebaseUser.uid;
		const updated = await rejectEditRequest(
			req.params.id,
			adminUid,
			req.body?.adminNote,
		);
		res.json(serializeEditRequest(updated.id, updated));
	} catch (error) {
		if (error instanceof NotFoundError) {
			res.status(404).json({ error: error.message });
			return;
		}
		if (error instanceof ValidationError) {
			res.status(400).json({ error: error.message, field: error.field });
			return;
		}
		next(error);
	}
};

export const adminRouter = Router();

adminRouter.use(authenticateFirebase, requireAdmin);
adminRouter.get('/employees', getEmployees);
adminRouter.post('/employees', postEmployee);
adminRouter.put('/employees/:uid', putEmployee);
adminRouter.get('/attendance', getAttendance);
adminRouter.get('/attendance/by-date', getAttendanceByDate);
adminRouter.put('/attendance/:id', putAttendance);
adminRouter.get('/reports/daily', getDailyReport);
adminRouter.get('/reports/weekly', getWeeklyReport);
adminRouter.post('/notifications/test', postTestNotification);
adminRouter.get('/edit-requests', getEditRequests);
adminRouter.post('/edit-requests/:id/approve', postApproveEditRequest);
adminRouter.post('/edit-requests/:id/reject', postRejectEditRequest);
