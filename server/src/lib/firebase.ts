import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { env } from '../config/env';

let firebaseApp: App | undefined;
let firebaseAuth: Auth | undefined;

export function getFirebaseApp() {
	firebaseApp ??=
		getApps()[0] ??
		initializeApp({
			credential: cert({
				projectId: env.firebase.projectId,
				clientEmail: env.firebase.clientEmail,
				privateKey: env.firebase.privateKey,
			}),
			projectId: env.firebase.projectId,
		});

	return firebaseApp;
}

export function getFirebaseAuth() {
	firebaseAuth ??= getAuth(getFirebaseApp());

	return firebaseAuth;
}
