import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

function getRequiredFirebaseEnv(name: keyof ImportMetaEnv) {
	const value = import.meta.env[name];

	if (!value) {
		throw new Error(`Missing Firebase client environment variable: ${name}`);
	}

	return value;
}

const firebaseConfig = {
	apiKey: getRequiredFirebaseEnv('VITE_FIREBASE_API_KEY'),
	authDomain: getRequiredFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN'),
	projectId: getRequiredFirebaseEnv('VITE_FIREBASE_PROJECT_ID'),
	appId: getRequiredFirebaseEnv('VITE_FIREBASE_APP_ID'),
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
