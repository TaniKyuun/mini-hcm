import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import { env } from '../config/env.js';

let firebaseApp: App | undefined;
let firebaseAuth: Auth | undefined;
let firebaseDb: Firestore | undefined;

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

export function getFirestoreDb() {
	firebaseDb ??= getFirestore(getFirebaseApp());

	return firebaseDb;
}
