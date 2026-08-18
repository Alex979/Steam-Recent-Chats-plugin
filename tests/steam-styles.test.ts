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
	});

	test('defines avatar border widths at base and native high-DPI scales', () => {
		expect(getRuleBody('.rcp-avatar')).toContain('border-width: 1px;');
		expect(FRIENDS_WINDOW_STYLES).toMatch(
			/@media only screen and \(min-resolution: 1\.5dppx\) and \(max-resolution: 2dppx\) \{[\s\S]*?\.rcp-avatar \{[\s\S]*?border-width: 0\.5px;/,
		);
	});

	test('does not partially suppress the native active tab through CSS', () => {
		expect(FRIENDS_WINDOW_STYLES).not.toContain('.friendTab.activeTab:not(.rcp-tab-button)');
	});
});
