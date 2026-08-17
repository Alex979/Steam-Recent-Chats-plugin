export type SteamClassMap = Readonly<Record<string, unknown>>;

export interface AvatarClassModule {
	avatar: string;
	avatarFrameImg: string;
	avatarHolder: string;
	avatarStatus: string;
}

export interface PersonaClassModule {
	playerName: string;
	richPresenceContainer: string;
	richPresenceLabel: string;
	statusAndName: string;
}

export interface FriendsClassModule {
	FriendListContainerPanel: string;
	LastMessage: string;
	OfflineContainer: string;
	RecentChatIcon: string;
}

export interface GamepadRecentChatsClassModule {
	RecentChatElement: string;
	RecentChatsList: string;
	Time: string;
	UnreadCount: string;
}

export interface MiniProfilePersonaClassModule {
	miniProfile: string;
	personaName: string;
	personaNameLabel: string;
	playerAvatar: string;
}

function hasStringClasses(module: unknown, keys: readonly string[]): module is SteamClassMap {
	if (!module || typeof module !== 'object') return false;
	return keys.every((key) => typeof (module as SteamClassMap)[key] === 'string' && (module as SteamClassMap)[key] !== '');
}

export function copyNativeTabClassName(className: string | null | undefined): string | undefined {
	if (!className) return undefined;

	const baseClasses = [...new Set(className.split(/\s+/))].filter(
		(classToken) => classToken && classToken !== 'activeTab' && !/search/i.test(classToken),
	);
	return baseClasses.length > 0 ? baseClasses.join(' ') : undefined;
}

export function isAvatarClassModule(module: unknown): module is AvatarClassModule {
	return hasStringClasses(module, ['avatarHolder', 'avatarStatus', 'avatar', 'avatarFrameImg']);
}

export function isPersonaClassModule(module: unknown): module is PersonaClassModule {
	return hasStringClasses(module, ['statusAndName', 'playerName', 'richPresenceContainer', 'richPresenceLabel']);
}

export function isFriendsClassModule(module: unknown): module is FriendsClassModule {
	return hasStringClasses(module, ['LastMessage', 'OfflineContainer', 'FriendListContainerPanel', 'RecentChatIcon']);
}

export function isGamepadRecentChatsClassModule(module: unknown): module is GamepadRecentChatsClassModule {
	return hasStringClasses(module, ['RecentChatsList', 'RecentChatElement', 'UnreadCount', 'Time']);
}

export function isMiniProfilePersonaClassModule(module: unknown): module is MiniProfilePersonaClassModule {
	return hasStringClasses(module, ['miniProfile', 'playerAvatar', 'personaName', 'personaNameLabel']);
}
