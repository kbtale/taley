export function buildUniverseId(name: string, seedPremise: string): string {
	const slug = slugify(name) || 'generated-universe';
	const hash = hashString(`${name}|${seedPremise}`);
	return `universe:${slug}-${hash}`;
}

export function buildNodeId(prefix: string, name: string, index: number): string {
	const slug = slugify(name) || 'entity';
	const hash = hashString(`${prefix}|${name}|${index}`);
	return `node:${prefix}-${slug}-${hash}`;
}

export function buildUnknownNodeId(name: string, normalizedName: string): string {
	const slug = slugify(normalizedName) || slugify(name) || 'entity';
	const hash = hashString(normalizedName || name);
	return `node:unknown-${slug}-${hash}`;
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

function hashString(value: string): string {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(36);
}