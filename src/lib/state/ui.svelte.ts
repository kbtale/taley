import { getContext, setContext } from 'svelte';
import type { ViewMode, Universe, AppNode, AppEdge, AppEvent } from './types.js';

const UI_STATE_KEY = Symbol('UI_STATE');

export class UIState {
    currentView = $state<ViewMode>('genesis');
    universe = $state<Universe | null>(null);
    events = $state<AppEvent[]>([]);
    nodes = $state<AppNode[]>([]);
    edges = $state<AppEdge[]>([]);
    selectedNode = $state<AppNode | null>(null);

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
        this.nodes.push(node);
    }

    addEdge(edge: AppEdge) {
        this.edges.push(edge);
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
