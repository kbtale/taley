import { nodeSchema } from '../src/lib/schemas/node';
import { edgeSchema } from '../src/lib/schemas/edge';

const validBioNode = {
	id: 'node-1',
	name: 'Commander Shepard',
	category: 'Biological Entity',
	payload: {
		identity: { name: 'Shepard', age: 32, species: 'Human', gender: 'Male' },
		appearance: { description: 'Scarred', clothing: 'N7 Armor', modifications: 'Cybernetic eyes' },
		psychology: {
			mbti: 'ENTJ',
			enneagram: '8w7',
			big5: { openness: 80, conscientiousness: 90, extraversion: 70, agreeableness: 50, neuroticism: 30 },
			moral_alignment: 'Paragon'
		},
		biography: 'First human Spectre.',
		dynamic_attributes: ['Leader', 'Soldier']
	}
};

const validGenericNode = {
	id: 'node-2',
	name: 'The Citadel',
	category: 'Location',
	payload: {
		description: 'Massive space station.',
		dynamic_attributes: ['Station', 'Hub']
	}
};

const validEdge = {
	source: 'node-1',
	target: 'node-2',
	visual_nature: 'Positive',
	relational_context: 'Shepard is at the Citadel.'
};

try {
	console.log('Testing Biological Node...');
	nodeSchema.parse(validBioNode);
	console.log('Biological Node valid.');

	console.log('Testing Generic Node...');
	nodeSchema.parse(validGenericNode);
	console.log('Generic Node valid.');

	console.log('Testing Edge...');
	edgeSchema.parse(validEdge);
	console.log('Edge valid.');

	console.log('Testing Invalid Payload (Bio in Location)...');
	try {
		nodeSchema.parse({ ...validGenericNode, payload: validBioNode.payload });
		console.error('Failed! Should have rejected Bio payload in Location.');
	} catch {
		console.log('Success: Correctly rejected mismatched payload.');
	}

} catch (error) {
	console.error('Schema validation failed:', error);
	process.exit(1);
}
