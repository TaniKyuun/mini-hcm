import { type RequestHandler, Router } from 'express';
import {
	serializeAttendance,
	serializeDailySummary,
	serializeProfile,
} from '../lib/serialize';
import { authenticateFirebase } from '../middleware/authenticateFirebase';
import { type AdminLocals, requireAdmin } from '../middleware/requireAdmin';
import {
	adminListAttendance,
	adminUpdateAttendance,
	NotFoundError,
} from '../services/attendanceService';
import {
	buildWeekDates,
	listAllDailySummariesInRange,
	listAllDailySummariesOnDate,
} from '../services/summaryService';
import { adminUpdateProfile, listAllProfiles } from '../services/userService';
import type { UserRole } from '../types/models';

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
	schedule?: { start: string; end: string };
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

export const adminRouter = Router();

adminRouter.use(authenticateFirebase, requireAdmin);
adminRouter.get('/employees', getEmployees);
adminRouter.put('/employees/:uid', putEmployee);
adminRouter.get('/attendance', getAttendance);
adminRouter.put('/attendance/:id', putAttendance);
adminRouter.get('/reports/daily', getDailyReport);
adminRouter.get('/reports/weekly', getWeeklyReport);
