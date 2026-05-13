import 'dotenv/config';

function getRequiredEnv(name: string) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

function parsePort(value: string | undefined) {
	const port = Number(value ?? 3000);

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(`Invalid PORT value: ${value}`);
	}

	return port;
}

export const env = {
	nodeEnv: process.env.NODE_ENV ?? 'development',
	isProduction: process.env.NODE_ENV === 'production',
	port: parsePort(process.env.PORT),
	firebase: {
		projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
		clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
		privateKey: getRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
	},
};
