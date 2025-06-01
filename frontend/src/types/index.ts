export interface Position {
  x: number;
  y: number;
}

export interface Objective {
  id: string;
  text: string | null;
  completed: boolean;
  sortIndex: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  position: Position;
  color?: string;
  objectives?: Objective[];
  completed: boolean;
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

export interface ExposedQuestBoard {
  addNewQuestAtViewportCenter: () => void;
}
