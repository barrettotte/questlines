import type { Questline, QuestlineInfo } from '@/types';

export interface IQuestlineService {
  getQuestlines(): Promise<QuestlineInfo[]>;
  getQuestline(id: string): Promise<Questline>;
  createQuestline(questline: Omit<Questline, 'id' | 'created' | 'updated'> & { id?: string | null}): Promise<Questline>;
  updateQuestline(id: string, questline: Questline): Promise<Questline>;
  deleteQuestline(id: string): Promise<void>;
  exportQuestline(id: string, format: string): void;
};
