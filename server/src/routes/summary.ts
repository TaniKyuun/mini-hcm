import { formatInTimeZone } from 'date-fns-tz';
import { type RequestHandler, Router } from 'express';
import { serializeDailySummary } from '../lib/serialize';
import {
	type AuthenticatedLocals,
	authenticateFirebase,
} from '../middleware/authenticateFirebase';
import {
	readDailySummary,
	readWeeklySummaries,
} from '../services/summaryService';
import { getOrCreateUserProfile } from '../services/userService';

type DailyQuery = {
	date?: string;
};

const getDaily: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	DailyQuery,
	AuthenticatedLocals
> = async (req, res, next) => {
	try {
		const { uid, email, name } = res.locals.firebaseUser;
		const profile = await getOrCreateUserProfile({
			uid,
			email: email ?? null,
			displayName: name ?? null,
		});
		const date =
			req.query.date ??
			formatInTimeZone(new Date(), profile.timezone, 'yyyy-MM-dd');
		const summary = await readDailySummary(uid, date);

		res.json({
			date,
			summary: summary
				? serializeDailySummary(summary)
				: serializeDailySummary({
						userId: uid,
						date,
						regularHours: 0,
						overtimeHours: 0,
						nightDifferentialHours: 0,
						lateMinutes: 0,
						undertimeMinutes: 0,
						totalHours: 0,
						sessionsCount: 0,
						updatedAt: null as never,
					}),
		});
	} catch (error) {
		next(error);
	}
};

type WeeklyQuery = {
	startDate?: string;
};

const getWeekly: RequestHandler<
	Record<string, never>,
	unknown,
	unknown,
	WeeklyQuery,
	AuthenticatedLocals
> = async (req, res, next) => {
	try {
		const { uid, email, name } = res.locals.firebaseUser;
		const profile = await getOrCreateUserProfile({
			uid,
			email: email ?? null,
			displayName: name ?? null,
		});
		const startDate =
			req.query.startDate ??
			formatInTimeZone(new Date(), profile.timezone, 'yyyy-MM-dd');
		const days = await readWeeklySummaries(uid, startDate);
		res.json({
			startDate,
			days: days.map(serializeDailySummary),
		});
	} catch (error) {
		next(error);
	}
};

export const summaryRouter = Router();

summaryRouter.get('/daily', authenticateFirebase, getDaily);
summaryRouter.get('/weekly', authenticateFirebase, getWeekly);
