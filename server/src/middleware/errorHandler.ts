import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, res) => {
	res.status(404).json({
		error: 'Not found.',
		path: req.originalUrl,
	});
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
	if (res.headersSent) {
		next(error);
		return;
	}

	console.error('Unhandled server error', error);
	res.status(500).json({ error: 'Internal server error.' });
};
