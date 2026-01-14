/** @internal */
export function transformChannel(channel: string, userId: number): string {
	return `${channel}_${userId}`;
}
