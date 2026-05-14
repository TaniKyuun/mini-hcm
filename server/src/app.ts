import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { adminRouter } from './routes/admin';
import { apiRouter } from './routes/api';
import { attendanceRouter } from './routes/attendance';
import { summaryRouter } from './routes/summary';
import { usersRouter } from './routes/users';

export function createApp() {
	const app = express();

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
	app.use('/api/admin', adminRouter);
	app.use(notFoundHandler);

	app.use(errorHandler);

	return app;
}
