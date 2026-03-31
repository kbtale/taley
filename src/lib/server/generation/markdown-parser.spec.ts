import { describe, expect, it } from 'vitest';
import { extractMarkdownSection, extractSectionArrayTuples, extractSectionJson } from './markdown-parser';

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

	it('parses array tuple lines from a generic code block', () => {
		const markdown = `## Concepts\n\n\`\`\`\n[\"Veil Logic\",\"A belief system\",[\"belief\",\"mist\"]]\n[\"Sky Oath\",\"A social pact\",[\"oath\",\"air\"]]\n\`\`\``;
		const tuples = extractSectionArrayTuples(markdown, 'Concepts') as Array<[string, string, string[]]>;
		expect(tuples[0]?.[0]).toBe('Veil Logic');
		expect(tuples[1]?.[2]).toEqual(['oath', 'air']);
	});

	it('parses parenthesized tuple lines from a generic code block', () => {
		const markdown = `## Events\n\n\`\`\`\n(\"The Great Drift\",\"A major migration event\",[\"migration\",\"storm\"])\n\`\`\``;
		const tuples = extractSectionArrayTuples(markdown, 'Events') as Array<[string, string, string[]]>;
		expect(tuples[0]?.[0]).toBe('The Great Drift');
		expect(tuples[0]?.[2]).toEqual(['migration', 'storm']);
	});

	it('throws tuple syntax error for malformed tuple line', () => {
		const markdown = `## Events\n\n\`\`\`\nThe Great Drift | migration event\n\`\`\``;
		expect(() => extractSectionArrayTuples(markdown, 'Events')).toThrow(
			'Section Events has invalid tuple on line 1.'
		);
	});
});
