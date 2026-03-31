export function extractMarkdownSection(markdown: string, sectionName: string): string {
	const headingPattern = /^##\s+(.+)$/gm;
	const headings = [...markdown.matchAll(headingPattern)].map((match) => ({
		title: (match[1] ?? '').trim(),
		index: match.index ?? 0,
		full: match[0] ?? ''
	}));

	const current = headings.find((heading) => heading.title === sectionName);
	if (!current) {
		throw new Error(`Missing markdown section: ${sectionName}`);
	}

	const start = current.index + current.full.length;
	const next = headings
		.filter((heading) => heading.index > current.index)
		.sort((a, b) => a.index - b.index)[0];
	const end = next ? next.index : markdown.length;
	const section = markdown.slice(start, end).trim();

	if (!section) {
		throw new Error(`Missing markdown section: ${sectionName}`);
	}

	return section;
}

export function extractSectionJson(markdown: string, sectionName: string): unknown {
	const body = extractMarkdownSection(markdown, sectionName);
	const fencePattern = /```json\s*([\s\S]*?)```/gi;
	const matches = [...body.matchAll(fencePattern)];

	if (matches.length === 0) {
		throw new Error(`Section ${sectionName} is missing a json code block`);
	}

	if (matches.length > 1) {
		throw new Error(`Section ${sectionName} must contain exactly one json code block`);
	}

	const jsonText = matches[0]?.[1]?.trim();
	if (!jsonText) {
		throw new Error(`Section ${sectionName} has an empty json code block`);
	}

	try {
		return JSON.parse(jsonText);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid JSON';
		throw new Error(`Section ${sectionName} has invalid json: ${message}`);
	}
}

export function extractSectionCodeBlock(markdown: string, sectionName: string): string {
	const body = extractMarkdownSection(markdown, sectionName);
	const fencePattern = /```(?:[^\n`]*)\n([\s\S]*?)```/g;
	const matches = [...body.matchAll(fencePattern)];

	if (matches.length === 0) {
		throw new Error(`Section ${sectionName} is missing a code block`);
	}

	if (matches.length > 1) {
		throw new Error(`Section ${sectionName} must contain exactly one code block`);
	}

	const codeText = matches[0]?.[1]?.trim();
	if (!codeText) {
		throw new Error(`Section ${sectionName} has an empty code block`);
	}

	return codeText;
}

export function extractSectionArrayTuples(markdown: string, sectionName: string): unknown[] {
	const codeText = extractSectionCodeBlock(markdown, sectionName);
	const lines = codeText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length === 0) {
		throw new Error(`Section ${sectionName} has no tuple lines`);
	}

	return lines.map((line, index) => {
		try {
			return JSON.parse(line);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Invalid array tuple';
			throw new Error(`Section ${sectionName} has invalid tuple on line ${index + 1}: ${message}`);
		}
	});
}
