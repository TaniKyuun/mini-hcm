import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes/api';

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
	app.use(notFoundHandler);

	app.use(errorHandler);

	return app;
}
