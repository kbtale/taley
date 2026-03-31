import { getContext, setContext } from 'svelte';
import type { ViewMode, Universe, AppNode, AppEdge, AppEvent, MutationState, PendingMutation } from './types.js';

const UI_STATE_KEY = Symbol('UI_STATE');

export class UIState {
    currentView = $state<ViewMode>('genesis');
    universe = $state<Universe | null>(null);
    events = $state<AppEvent[]>([]);
    nodes = $state<AppNode[]>([]);
    edges = $state<AppEdge[]>([]);
    selectedNode = $state<AppNode | null>(null);

    // Mutation State
    mutationState = $state<MutationState>('idle');
    pendingMutation = $state<PendingMutation | null>(null);

    isCodexOpen = $derived(this.selectedNode !== null);

    setView(view: ViewMode) {
        this.currentView = view;
    }

    selectNode(node: AppNode | null) {
        this.selectedNode = node;
    }

    setUniverse(u: Universe) {
        this.universe = u;
        this.currentView = 'architect';
    }

    addEvent(event: AppEvent) {
        this.events.push(event);
    }

    addNode(node: AppNode) {
        if (this.nodes.some((existing) => existing.id === node.id)) {
            return;
        }
        this.nodes.push(node);
    }

    addEdge(edge: AppEdge) {
        if (this.edges.some((existing) => existing.source === edge.source && existing.target === edge.target)) {
            return;
        }
        this.edges.push(edge);
    }

    // Mutation Actions
    startMutation() {
        this.mutationState = 'calculating';
    }

    stageMutation(mutation: PendingMutation) {
        this.pendingMutation = mutation;
        this.mutationState = 'reviewing';
    }

    commitMutation() {
        if (!this.pendingMutation) return;

        const mutation = this.pendingMutation;

        // Build the event
        const event: AppEvent = {
            id: crypto.randomUUID(),
            type: 'mutation',
            name: 'Update',
            message: mutation.description,
            timestamp: Date.now()
        };
        this.addEvent(event);

        mutation.createdNodes?.forEach((node) => {
            this.addNode(node);
        });

        mutation.updatedNodes?.forEach((updated) => {
            const node = this.nodes.find((candidate) => candidate.id === updated.id);
            if (!node) return;

            if (typeof updated.name === 'string') {
                node.name = updated.name;
            }
            if (typeof updated.description === 'string') {
                node.description = updated.description;
            }
            if (updated.payload && typeof updated.payload === 'object') {
                node.payload = updated.payload;
            }
        });

        mutation.createdEdges?.forEach((edge) => {
            this.addEdge(edge);
        });

        mutation.diffs.forEach((diff) => {
            const node = this.nodes.find((n) => n.id === diff.nodeId);
            if (!node) return;

            if (diff.field === 'name' || diff.field === 'description') {
                node[diff.field] = diff.newValue;
            } else if (node.payload && diff.field.startsWith('payload.')) {
                const key = diff.field.split('.')[1];
                if (key) node.payload[key] = diff.newValue;
            }
        });

        this.mutationState = 'idle';
        this.pendingMutation = null;
    }

    abortMutation() {
        this.mutationState = 'idle';
        this.pendingMutation = null;
    }
}

export function initUIState(): UIState {
    return setContext(UI_STATE_KEY, new UIState());
}

export function getUIState(): UIState {
    const state = getContext<UIState>(UI_STATE_KEY);
    if (!state) {
        throw new Error("UIState not found");
    }
    return state;
}
