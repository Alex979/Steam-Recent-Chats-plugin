// Use an explicit state list so similarly named theme classes survive the copy.
const NATIVE_TAB_STATE_CLASSES = new Set(['activeTab', 'TabSearchActive', 'SearchActive']);

export function copyNativeTabClassName(className: string | null | undefined): string | undefined {
	if (!className) return undefined;

	const baseClasses = [...new Set(className.split(/\s+/))].filter(
		(classToken) => classToken && !NATIVE_TAB_STATE_CLASSES.has(classToken),
	);
	return baseClasses.length > 0 ? baseClasses.join(' ') : undefined;
}
