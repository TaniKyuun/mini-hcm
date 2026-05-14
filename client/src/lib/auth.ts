import type { User } from 'firebase/auth';
import { createContext, useContext } from 'react';

export type AuthContextValue = {
	user: User | null;
	authReady: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
	user: null,
	authReady: false,
});

export function useAuth(): AuthContextValue {
	return useContext(AuthContext);
}
