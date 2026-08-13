export type FriendsWindowKind = 'desktop' | 'overlay';

export interface FriendsWindowTarget {
	name: string;
	kind: FriendsWindowKind;
	processId: number;
}

const FRIENDS_POPUP_NAME_PATTERN = /^friendslist_uid(\d+)$/;

export function classifyFriendsWindow(name: string | undefined): FriendsWindowTarget | undefined {
	if (!name) return undefined;
	const match = FRIENDS_POPUP_NAME_PATTERN.exec(name);
	if (!match) return undefined;

	const processId = Number(match[1]);
	if (!Number.isSafeInteger(processId)) return undefined;

	return {
		name,
		kind: processId === 0 ? 'desktop' : 'overlay',
		processId,
	};
}
