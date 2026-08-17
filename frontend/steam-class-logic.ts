export function copyNativeTabClassName(className: string | null | undefined): string | undefined {
	if (!className) return undefined;

	const baseClasses = [...new Set(className.split(/\s+/))].filter(
		(classToken) => classToken && classToken !== 'activeTab' && !/search/i.test(classToken),
	);
	return baseClasses.length > 0 ? baseClasses.join(' ') : undefined;
}
