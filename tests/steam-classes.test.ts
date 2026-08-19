import { describe, expect, test } from 'bun:test';

import {
	copyNativeTabClassName,
	createNativeTabActiveController,
	getNativePresenceClass,
} from '../frontend/steam-class-logic';

function createClassList(...initialClasses: string[]) {
	const classes = new Set(initialClasses);
	return {
		classes,
		classList: {
			add: (classToken: string) => classes.add(classToken),
			contains: (classToken: string) => classes.has(classToken),
			remove: (classToken: string) => classes.delete(classToken),
		},
	};
}

describe('Steam class mapping logic', () => {
	test('maps unsupported visual states onto native presence classes', () => {
		expect(getNativePresenceClass({ kind: 'group' })).toBe('online');
		expect(getNativePresenceClass({ kind: 'friend', presence: 'unknown' })).toBe('offline');
		expect(getNativePresenceClass({ kind: 'friend', presence: 'watchingbroadcast' })).toBe(
			'watchingbroadcast',
		);
	});

	test('copies a native tab class list without the known state classes', () => {
		expect(copyNativeTabClassName(' friendTab  socialListTab activeTab TabSearchActive themeTab socialListTab ')).toBe(
			'friendTab socialListTab themeTab',
		);
	});

	test('keeps theme tokens that merely contain a search-like substring', () => {
		expect(copyNativeTabClassName('friendTab socialListTab xSearchy_ab12')).toBe(
			'friendTab socialListTab xSearchy_ab12',
		);
	});

	test('returns no copied classes when the sibling is absent or contains only state classes', () => {
		expect(copyNativeTabClassName(undefined)).toBeUndefined();
		expect(copyNativeTabClassName(null)).toBeUndefined();
		expect(copyNativeTabClassName('   ')).toBeUndefined();
		expect(copyNativeTabClassName('activeTab TabSearchActive')).toBeUndefined();
	});

	test('suppresses and restores the native active state across Steam rerenders', () => {
		let nativeTab = createClassList('friendTab', 'activeTab');
		const controller = createNativeTabActiveController(() => nativeTab.classList);

		controller.suppress();
		expect(nativeTab.classes.has('activeTab')).toBeFalse();

		nativeTab = createClassList('friendTab', 'activeTab');
		controller.suppress();
		expect(nativeTab.classes.has('activeTab')).toBeFalse();

		controller.restore();
		expect(nativeTab.classes.has('activeTab')).toBeTrue();
	});

	test('does not create an active state that was never suppressed', () => {
		const nativeTab = createClassList('friendTab');
		const controller = createNativeTabActiveController(() => nativeTab.classList);

		controller.suppress();
		controller.restore();

		expect(nativeTab.classes.has('activeTab')).toBeFalse();
	});
});
