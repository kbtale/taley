export type ViewMode = 'genesis' | 'architect' | 'mutation';

export interface Universe {
    id: string;
    name: string;
    premise: string;
    constraints: string[];
}

export type EventType = 'node_added' | 'mutation' | 'discovery';

export interface AppEvent {
    id: string;
    type: EventType;
    name: string;
    message: string;
    timestamp: number;
}

export type NodeCategory =
    | 'Character'
    | 'Location'
    | 'Artifact'
    | 'Event'
    | 'Collective'
    | 'Concept'
    | 'Phenomenon'
    | 'Unknown';

export interface AppNode {
    id: string;
    name: string;
    category: NodeCategory;
    description: string;
    position: { x: number; y: number };
    payload?: Record<string, unknown>;
}

export interface AppEdge {
	id: string;
	source: string;
	target: string;
	label?: string;
    // visual_nature?: 'Positive' | 'Negative' | 'Hierarchical' | 'Neutral' | 'Belonging';
    // relational_context?: string;
}

export type MutationState = 'idle' | 'calculating' | 'reviewing';

export interface PendingMutation {
	id: string;
	description: string;
	affectedNodes: string[]; // Node IDs
    createdNodes?: AppNode[];
    updatedNodes?: {
        id: string;
        name?: string;
        description?: string;
        payload?: Record<string, unknown>;
    }[];
    createdEdges?: AppEdge[];
	diffs: {
		nodeId: string;
		nodeName: string;
		field: string;
		oldValue: string;
		newValue: string;
	}[];
}
