import type { ConversationPresence } from './chat-adapter';

// Use an explicit state list so similarly named theme classes survive the copy.
const NATIVE_TAB_STATE_CLASSES = new Set(['activeTab', 'TabSearchActive', 'SearchActive']);

interface SteamClassList {
	add(classToken: string): void;
	contains(classToken: string): boolean;
	remove(classToken: string): void;
}

export interface NativeTabActiveController {
	restore(): void;
	suppress(): void;
}

type ConversationPresenceSource =
	| { kind: 'friend'; presence: ConversationPresence }
	| { kind: 'group' };

export function getNativePresenceClass(
	conversation: ConversationPresenceSource,
): Exclude<ConversationPresence, 'unknown'> {
	if (conversation.kind === 'group') return 'online';
	return conversation.presence === 'unknown' ? 'offline' : conversation.presence;
}

export function copyNativeTabClassName(className: string | null | undefined): string | undefined {
	if (!className) return undefined;

	const baseClasses = [...new Set(className.split(/\s+/))].filter(
		(classToken) => classToken && !NATIVE_TAB_STATE_CLASSES.has(classToken),
	);
	return baseClasses.length > 0 ? baseClasses.join(' ') : undefined;
}

export function createNativeTabActiveController(
	getClassList: () => SteamClassList | undefined,
): NativeTabActiveController {
	let shouldRestore = false;

	return {
		restore() {
			const classList = getClassList();
			if (!classList || !shouldRestore) return;
			classList.add('activeTab');
			shouldRestore = false;
		},
		suppress() {
			const classList = getClassList();
			if (!classList) return;
			shouldRestore ||= classList.contains('activeTab');
			classList.remove('activeTab');
		},
	};
}
