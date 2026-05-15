import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

if (!process.env.VERCEL) {
	app.listen(env.port, () => {
		console.log(`Server running at http://localhost:${env.port}`);
	});
}

export default app;
