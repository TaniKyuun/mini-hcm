import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { adminRouter } from './routes/admin.js';
import { apiRouter } from './routes/api.js';
import { attendanceRouter } from './routes/attendance.js';
import { editRequestsRouter } from './routes/editRequests.js';
import { notificationsRouter } from './routes/notifications.js';
import { summaryRouter } from './routes/summary.js';
import { usersRouter } from './routes/users.js';

export function createApp() {
	const app = express();

	const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
		.map((o) => o.trim())
		.filter(Boolean);

	app.use(
		cors({
			origin: allowedOrigins?.length ? allowedOrigins : true,
			credentials: true,
		}),
	);

	app.use(express.json());

	app.get('/', (_req, res) => {
		res.json({
			name: 'mini-hcm API endpoint',
			status: 'ok',
		});
	});

	app.use('/api', apiRouter);
	app.use('/api', usersRouter);
	app.use('/api/attendance', attendanceRouter);
	app.use('/api/summary', summaryRouter);
	app.use('/api/notifications', notificationsRouter);
	app.use('/api/edit-requests', editRequestsRouter);
	app.use('/api/admin', adminRouter);
	app.use(notFoundHandler);

	app.use(errorHandler);

	return app;
}
