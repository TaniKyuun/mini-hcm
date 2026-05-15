export function notifyEmployeeOfEdit(
	userId: string,
	reason: string | null,
): void {
	console.info(`[notify] edit for ${userId}: ${reason ?? '(no reason)'}`);
}
