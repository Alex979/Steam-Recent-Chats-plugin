import { findClassModule } from '@steambrew/client';

import { isAvatarClassModule, isFriendsClassModule, isPersonaClassModule } from './steam-class-logic';

const LOG_PREFIX = '[Recent Chats]';

type ModuleName = 'avatar' | 'persona' | 'friends';

export interface SteamClasses {
	avatar?: {
		avatarHolder: string;
		avatar: string;
	};
	persona?: {
		statusAndName: string;
		playerName: string;
		richPresenceContainer: string;
		richPresenceLabel: string;
	};
	friends?: {
		LastMessage: string;
	};
}

let cachedClasses: SteamClasses | undefined;
const warnedModules = new Set<ModuleName>();

function warnMissingModule(moduleName: ModuleName, error?: unknown): void {
	if (warnedModules.has(moduleName)) return;
	warnedModules.add(moduleName);
	console.warn(LOG_PREFIX, `Could not resolve Steam's ${moduleName} class module; fallback styles will be used.`, error);
}

function findModule(moduleName: ModuleName, filter: (module: unknown) => boolean): Record<string, string> | undefined {
	try {
		const module = findClassModule(filter);
		if (module) return module;
		warnMissingModule(moduleName);
	} catch (error) {
		warnMissingModule(moduleName, error);
	}
	return undefined;
}

export function resolveSteamClasses(): SteamClasses {
	if (cachedClasses) return cachedClasses;

	const avatarModule = findModule('avatar', isAvatarClassModule);
	const personaModule = findModule('persona', isPersonaClassModule);
	const friendsModule = findModule('friends', isFriendsClassModule);

	cachedClasses = {
		avatar: avatarModule
			? {
					avatarHolder: avatarModule.avatarHolder,
					avatar: avatarModule.avatar,
				}
			: undefined,
		persona: personaModule
			? {
					statusAndName: personaModule.statusAndName,
					playerName: personaModule.playerName,
					richPresenceContainer: personaModule.richPresenceContainer,
					richPresenceLabel: personaModule.richPresenceLabel,
				}
			: undefined,
		friends: friendsModule ? { LastMessage: friendsModule.LastMessage } : undefined,
	};
	return cachedClasses;
}
