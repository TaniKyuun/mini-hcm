import express from 'express';
import { env } from './config/env';
import { paths } from './config/paths';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes/api';

export function createApp() {
	const app = express();

	app.use(express.json());
	app.use(express.static(paths.clientDist));

	app.get('/', (_req, res) => {
		res.send('Server Root End Point');
	});

	app.use('/api', apiRouter);

	if (env.isProduction) {
		app.get(/(.*)/, (_req, res) => {
			res.sendFile(paths.clientIndexHtml);
		});
	} else {
		app.use(notFoundHandler);
	}

	app.use(errorHandler);

	return app;
}
