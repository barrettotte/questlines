import axios from "axios";
import type { Questline, QuestlineInfo } from "../../types"
import type { IQuestlineService } from "./questlineService.types";

const API_BASE = '/api'

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

export class QuestlineHttpService implements IQuestlineService {
    
    async getQuestlines(): Promise<QuestlineInfo[]> {
        const resp = await apiClient.get<QuestlineInfo[]>('/questlines');
        return resp.data;
    }

    async getQuestline(id: string): Promise<Questline> {
        const resp = await apiClient.get<Questline>(`/questlines/${id}`);
        return resp.data;
    }

    async createQuestline(questline: Omit<Questline, 'id' | 'created' | 'updated'> & { id?: string | null }): Promise<Questline> {
        const resp = await apiClient.post<Questline>('/questlines', questline);
        return resp.data;
    }

    async updateQuestline(id: string, questline: Questline): Promise<Questline> {
        const resp = await apiClient.put<Questline>(`/questlines/${id}`, questline);
        return resp.data;
    }

    async deleteQuestline(id: string): Promise<void> {
        await apiClient.delete(`/questlines/${id}`);
    }

    exportQuestline(id: string, format: string): void {
        window.location.href = `${API_BASE}/questlines/${id}/export?format=${format}`;
    }
};
