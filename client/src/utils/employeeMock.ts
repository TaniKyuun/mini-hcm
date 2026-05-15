import type { UserProfile } from '@/types/api';

const DEPARTMENTS = ['Sales', 'Eng', 'Ops', 'HR'] as const;
const MANAGERS = ['D. Vega', 'D. Fitzgerald', 'P. Khan', 'M. Jensen'] as const;
const LOCATIONS = [
	'HQ · Floor 1',
	'HQ · Floor 2',
	'HQ · Floor 3',
	'Remote',
] as const;

const DEPT_COLOR: Record<string, string> = {
	Sales: 'bg-blue-500',
	Eng: 'bg-emerald-500',
	Ops: 'bg-amber-500',
	HR: 'bg-zinc-500',
};

function hash(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i += 1) {
		h = (h * 31 + s.charCodeAt(i)) >>> 0;
	}
	return h;
}

export type EmployeeDecoration = {
	dept: string;
	manager: string;
	location: string;
	employment: 'Full-time' | 'Part-time';
	deptColor: string;
};

export function decorateEmployee(profile: UserProfile): EmployeeDecoration {
	const seed = hash(profile.uid || profile.email || profile.name);
	const dept = DEPARTMENTS[seed % DEPARTMENTS.length];
	const manager = MANAGERS[(seed >> 3) % MANAGERS.length];
	const location = LOCATIONS[(seed >> 5) % LOCATIONS.length];
	const employment: 'Full-time' | 'Part-time' =
		(seed >> 9) % 10 < 8 ? 'Full-time' : 'Part-time';
	return {
		dept,
		manager,
		location,
		employment,
		deptColor: DEPT_COLOR[dept] ?? 'bg-zinc-500',
	};
}

export function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '··';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
