import { QuestlineHttpService } from './questlineHttpService';
import { QuestlineLocalService } from './questlineLocalService';
import type { IQuestlineService } from './questlineService.types';

const isBrowserOnlyMode = import.meta.env.VITE_APP_MODE === 'browser_only';

let questlineServiceInstance: IQuestlineService;

if (isBrowserOnlyMode) {
    questlineServiceInstance = new QuestlineLocalService();
} else {
    questlineServiceInstance = new QuestlineHttpService();
}

export const questlineApiService = questlineServiceInstance;
