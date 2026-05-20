import 'dotenv/config';

function getRequiredEnv(name: string) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

function parsePrivateKey(raw: string) {
	let key = raw.trim();
	if (
		(key.startsWith('"') && key.endsWith('"')) ||
		(key.startsWith("'") && key.endsWith("'"))
	) {
		key = key.slice(1, -1);
	}
	key = key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
	if (!key.includes('-----BEGIN') || !key.includes('PRIVATE KEY-----')) {
		throw new Error(
			'FIREBASE_PRIVATE_KEY is malformed: expected PEM-encoded private key',
		);
	}
	return key;
}

function parsePort(value: string | undefined) {
	const port = Number(value ?? 3000);

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(`Invalid PORT value: ${value}`);
	}

	return port;
}

function loadFirebaseCredentials() {
	const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
	if (b64) {
		const json = JSON.parse(
			Buffer.from(b64, 'base64').toString('utf8'),
		) as {
			project_id: string;
			client_email: string;
			private_key: string;
		};
		return {
			projectId: json.project_id,
			clientEmail: json.client_email,
			privateKey: parsePrivateKey(json.private_key),
		};
	}
	return {
		projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
		clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
		privateKey: parsePrivateKey(getRequiredEnv('FIREBASE_PRIVATE_KEY')),
	};
}

export const env = {
	nodeEnv: process.env.NODE_ENV ?? 'development',
	isProduction: process.env.NODE_ENV === 'production',
	port: parsePort(process.env.PORT),
	firebase: loadFirebaseCredentials(),
};
