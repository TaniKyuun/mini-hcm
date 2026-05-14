import { type RequestHandler, Router } from 'express';
import { serializeAttendance } from '../lib/serialize';
import {
	type AuthenticatedLocals,
	authenticateFirebase,
} from '../middleware/authenticateFirebase';
import {
	AttendanceConflictError,
	findActiveSession,
	getHistory,
	NotFoundError,
	punchIn,
	punchOut,
} from '../services/attendanceService';
import { getOrCreateUserProfile } from '../services/userService';

const getActive: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (_req, res, next) => {
	try {
		const { uid } = res.locals.firebaseUser;
		const session = await findActiveSession(uid);
		if (!session) {
			res.json({ session: null });
			return;
		}
		res.json({ session: serializeAttendance(session.id, session) });
	} catch (error) {
		next(error);
	}
};

const postPunchIn: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (_req, res, next) => {
	try {
		const { uid, email, name } = res.locals.firebaseUser;
		const profile = await getOrCreateUserProfile({
			uid,
			email: email ?? null,
			displayName: name ?? null,
		});
		const session = await punchIn(profile);
		res.status(201).json(serializeAttendance(session.id, session));
	} catch (error) {
		if (error instanceof AttendanceConflictError) {
			res.status(409).json({ error: error.message });
			return;
		}
		next(error);
	}
};

const postPunchOut: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	Record<string, never>,
	AuthenticatedLocals
> = async (_req, res, next) => {
	try {
		const { uid, email, name } = res.locals.firebaseUser;
		const profile = await getOrCreateUserProfile({
			uid,
			email: email ?? null,
			displayName: name ?? null,
		});
		const session = await punchOut(profile);
		res.json(serializeAttendance(session.id, session));
	} catch (error) {
		if (error instanceof NotFoundError) {
			res.status(404).json({ error: error.message });
			return;
		}
		next(error);
	}
};

type HistoryQuery = {
	startDate?: string;
	endDate?: string;
};

const getHistoryHandler: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	HistoryQuery,
	AuthenticatedLocals
> = async (req, res, next) => {
	try {
		const { uid } = res.locals.firebaseUser;
		const { startDate, endDate } = resolveDateRange(req.query);
		const sessions = await getHistory(uid, startDate, endDate);
		res.json({
			startDate,
			endDate,
			sessions: sessions.map((s) => serializeAttendance(s.id, s)),
		});
	} catch (error) {
		next(error);
	}
};

function resolveDateRange(query: HistoryQuery): {
	startDate: string;
	endDate: string;
} {
	const today = new Date().toISOString().slice(0, 10);
	const endDate = query.endDate ?? today;
	const startDate = query.startDate ?? subtractDays(endDate, 30);
	return { startDate, endDate };
}

function subtractDays(dateStr: string, days: number): string {
	const d = new Date(`${dateStr}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString().slice(0, 10);
}

export const attendanceRouter = Router();

attendanceRouter.get('/active', authenticateFirebase, getActive);
attendanceRouter.post('/punch-in', authenticateFirebase, postPunchIn);
attendanceRouter.post('/punch-out', authenticateFirebase, postPunchOut);
attendanceRouter.get('/history', authenticateFirebase, getHistoryHandler);
