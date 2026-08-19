import { describe, expect, test } from 'bun:test';

import { FRIENDS_WINDOW_STYLES, THEMED_FALLBACK_STYLES } from '../frontend/styles';

function getRuleBody(selector: string): string {
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = FRIENDS_WINDOW_STYLES.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
	expect(match).toBeDefined();
	return match?.[1] ?? '';
}

describe('Steam style integration', () => {
	test('leaves themed search and conversation colors to native theme rules', () => {
		expect(FRIENDS_WINDOW_STYLES).toContain(
			'html:not(.rcp-themed) .rcp-toolbar .rcp-search.friendSearchInput',
		);
		expect(FRIENDS_WINDOW_STYLES).not.toContain(
			'html.rcp-themed .rcp-toolbar .rcp-search.friendSearchInput',
		);
		expect(getRuleBody('.rcp-name')).not.toContain('color:');
	});

	test('keeps the themed search fallback at theme-overridable specificity', () => {
		expect(THEMED_FALLBACK_STYLES).toContain('.rcp-search.friendSearchInput {');
		expect(THEMED_FALLBACK_STYLES).toContain('.rcp-search.friendSearchInput:focus {');
		expect(THEMED_FALLBACK_STYLES).toContain('background-color: rgba(0, 0, 0, 0.25);');
		expect(THEMED_FALLBACK_STYLES).toContain('color: inherit;');
		// Anything above two classes would outrank Steam's own field selector.
		expect(THEMED_FALLBACK_STYLES).not.toContain('html');
		expect(THEMED_FALLBACK_STYLES).not.toContain('.rcp-toolbar');
	});

	test('resets native unread width so themed margins remain inside the list', () => {
		expect(getRuleBody('.friendGroup .rcp-row')).toContain('width: auto;');
		expect(getRuleBody('.rcp-row-wrapper.unreadFriend > .rcp-row')).toContain('flex: 1 1 auto;');
	});

	test('leaves all presence-state visuals to native Steam classes', () => {
		expect(FRIENDS_WINDOW_STYLES).not.toContain('watchingbroadcast');
		expect(FRIENDS_WINDOW_STYLES).not.toContain('rcp-presence-unknown');
		expect(FRIENDS_WINDOW_STYLES).not.toContain('rcp-group');
	});

	test('defines avatar border widths at base and native high-DPI scales', () => {
		expect(getRuleBody('.rcp-avatar')).toContain('border-width: 1px;');
		expect(FRIENDS_WINDOW_STYLES).toMatch(
			/@media only screen and \(min-resolution: 1\.5dppx\) and \(max-resolution: 2dppx\) \{[\s\S]*?\.rcp-avatar \{[\s\S]*?border-width: 0\.5px;/,
		);
	});

	test('matches the native Steam avatar filter transition', () => {
		expect(getRuleBody('.rcp-avatar,\n.rcp-avatar-fallback')).toContain(
			'transition: filter 0.24s ease-in-out;',
		);
	});

	test('exposes away text theme hooks without surrendering copy geometry', () => {
		expect(getRuleBody('.friend.awayOrSnooze .rcp-copy')).toContain('opacity: 0.5;');
		const awayCopyRule = getRuleBody(
			'.friendlistListContainer .friend.awayOrSnooze .rcp-copy.labelHolder',
		);
		expect(awayCopyRule).toContain('transform: none !important;');
		expect(awayCopyRule).toContain('width: auto !important;');
		expect(getRuleBody('.rcp-native-persona-text')).toContain('-webkit-mask: none !important;');
		expect(getRuleBody('.rcp-name.rcp-native-persona-text')).toContain('font-size: 14px !important;');
		expect(getRuleBody('.rcp-snippet.rcp-native-persona-text')).toContain('font-size: 12px !important;');
	});

	test('dims offline fallback avatars like native Steam rows', () => {
		expect(getRuleBody('.friend.offline .rcp-avatar-fallback')).toContain(
			'filter: brightness(60%) saturate(50%);',
		);
		expect(
			getRuleBody(
				'.friend.offline:hover .rcp-avatar-fallback,\n' +
					'.friend.offline.Friend_ContextMenuActive .rcp-avatar-fallback',
			),
		).toContain('filter: brightness(100%) saturate(100%);');
		expect(FRIENDS_WINDOW_STYLES).toMatch(/\.rcp-avatar-fallback\s*\{[^}]*color: inherit;/);
	});

	test('does not partially suppress the native active tab through CSS', () => {
		expect(FRIENDS_WINDOW_STYLES).not.toContain('.friendTab.activeTab:not(.rcp-tab-button)');
	});
});
