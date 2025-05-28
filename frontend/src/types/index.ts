export interface Position {
    x: number;
    y: number;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    position: Position;
    color?: string;
}

export interface Dependency {
    from: string;
    to: string;
}

export interface Questline {
    id: string | null;
    name: string;
    quests: Quest[];
    dependencies: Dependency[];
    created?: string;
    updated?: string;
}

export interface QuestlineInfo {
    id: string;
    name: string;
}
