import { describe, expect, it } from 'vitest';
import { extractMarkdownSection, extractSectionJson } from './markdown-parser';

const sample = `## Universe
\n\
\
\
\
\`\`\`json
{"id":"u:1","name":"Skyreach"}
\`\`\`
\n## Locations
\n\`\`\`json
[{"id":"node:l1","name":"Aerie","category":"Location"}]
\`\`\`
`;

describe('markdown parser', () => {
	it('extracts section body', () => {
		const section = extractMarkdownSection(sample, 'Universe');
		expect(section).toContain('```json');
	});

	it('extracts and parses section json', () => {
		const value = extractSectionJson(sample, 'Universe') as { id: string; name: string };
		expect(value.id).toBe('u:1');
		expect(value.name).toBe('Skyreach');
	});

	it('throws when section is missing', () => {
		expect(() => extractSectionJson(sample, 'Events')).toThrow('Missing markdown section: Events');
	});

	it('throws when section has multiple json blocks', () => {
		const bad = `## Universe\n\n\`\`\`json\n{}\n\`\`\`\n\n\`\`\`json\n{}\n\`\`\``;
		expect(() => extractSectionJson(bad, 'Universe')).toThrow(
			'Section Universe must contain exactly one json code block'
		);
	});

	it('throws when json is invalid', () => {
		const bad = `## Universe\n\n\`\`\`json\n{\"id\":\n\`\`\``;
		expect(() => extractSectionJson(bad, 'Universe')).toThrow('Section Universe has invalid json:');
	});
});
