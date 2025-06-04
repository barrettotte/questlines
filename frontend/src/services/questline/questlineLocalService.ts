import { v4 as uuidv4 } from 'uuid';

import type { Questline, QuestlineInfo, Quest } from '@/types';
import type { IQuestlineService } from './questlineService.types';

const QUESTLINES_LOCAL_KEY = 'questlines-app_questlines';

export class QuestlineLocalService implements IQuestlineService {

  private getQuestlinesFromStorage(): Questline[] {
    return JSON.parse(localStorage.getItem(QUESTLINES_LOCAL_KEY) || '[]') as Questline[];
  }

  private saveQuestlinesToStorage(questlines: Questline[]): void {
    localStorage.setItem(QUESTLINES_LOCAL_KEY, JSON.stringify(questlines));
  }

  private questlineFrom(questline: Questline): Questline {
    const now = new Date().toISOString();
    questline.id = questline.id || uuidv4();
    questline.created = questline.created || now;
    questline.updated = questline.updated || now;
    questline.quests = questline.quests || [];
    questline.dependencies = questline.dependencies || [];

    questline.quests.forEach(q => {
      q.id = q.id || uuidv4();
      q.completed = q.completed || false;
      q.objectives = q.objectives || [];

      q.objectives.forEach((o, idx) => {
        o.id = o.id || uuidv4();
        o.completed = o.completed || false;
        o.sortIndex = o.sortIndex || idx;
      });
    });

    return questline;
  }

  async getQuestlines(): Promise<QuestlineInfo[]> {
    const questlines = this.getQuestlinesFromStorage();
    return questlines.map(ql => ({
      id: ql.id!,
      name: ql.name,
      updated: ql.updated || new Date().toISOString(),
      totalQuests: ql.quests?.length || 0,
      completedQuests: ql.quests?.filter(q => q.completed).length || 0,
    }))
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
  }

  async getQuestline(id: string): Promise<Questline> {
    const questlines = this.getQuestlinesFromStorage();
    const questline = questlines.find(ql => ql.id === id);
    if (!questline) {
      throw new Error(`Questline with id '${id}' not found in localStorage.`);
    }
    return this.questlineFrom(JSON.parse(JSON.stringify(questline)));
  }

  async createQuestline(toCreate: Omit<Questline, 'id' | 'created' | 'updated'> & { id?: string | null }): Promise<Questline> {
    const questlines = this.getQuestlinesFromStorage();
    const partial: Partial<Questline> = { ...toCreate };
    delete partial.id; // create new id

    const newQuestline = this.questlineFrom(toCreate as Questline);
    questlines.push(newQuestline);
    this.saveQuestlinesToStorage(questlines);

    return JSON.parse(JSON.stringify(newQuestline));
  }

  async updateQuestline(id: string, toUpdate: Questline): Promise<Questline> {
    const questlines = this.getQuestlinesFromStorage();
    const idx = questlines.findIndex(ql => ql.id === id);
    if (idx === -1) {
      throw new Error(`Questline with id '${id}' not found for update in localStorage.`);
    }

    const updatedQuestline = this.questlineFrom({
      ...questlines[idx],
      ...toUpdate,
      id: id,
    });
    questlines[idx] = updatedQuestline;
    this.saveQuestlinesToStorage(questlines);

    return JSON.parse(JSON.stringify(updatedQuestline));
  }

  async deleteQuestline(id: string): Promise<void> {
    let questlines = this.getQuestlinesFromStorage();
    questlines = questlines.filter(ql => ql.id !== id);
    this.saveQuestlinesToStorage(questlines);
  }

  exportQuestline(id: string, format: string): void {
    const questlines = this.getQuestlinesFromStorage();
    const questline = questlines.find(ql => ql.id === id);
    if (!questline) {
      throw new Error(`Questline with id '${id}' not found for export in localStorage.`);
    }

    let data: string;
    let mimeType: string;
    let filename = `${(questline.name || 'questline').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;

    if (format === 'json') {
      data = JSON.stringify(questline, null, 2);
      mimeType = 'application/json';
    } else {
      throw new Error(`Unsupported export format '${format}'`);
    }

    const blob = new Blob([data], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    
    link.click();
    document.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
};
