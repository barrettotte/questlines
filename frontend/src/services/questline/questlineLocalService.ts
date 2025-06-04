import { v4 as uuidv4 } from 'uuid';

import type { Questline, QuestlineInfo, Quest } from '@/types';
import type { IQuestlineService } from './questlineService.types';

const QUESTLINES_LOCAL_KEY = 'questlines-app_questlines';
const LAST_ACTIVE_QUESTLINE_ID_KEY = "lastActiveQuestlineId";

const demoQuestline: Questline = {
  id: 'demo-questline-id',
  name: 'Demo: Electrical Engineering',
  created: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // yesterday
  updated: new Date().toISOString(),
  quests: [
    {
      id: "ee-y1-calculus1",
      title: "Calculus I",
      description: "Limits, derivatives, and basic integration. Foundational for all engineering.",
      position: { "x": -400.6320809385154, "y": -190.9028662255333 },
      color: "#4A90E2",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y1-physics1",
      title: "Physics I (Mechanics)",
      description: "Classical mechanics: kinematics, Newton's laws, work, energy, momentum.",
      position: { "x": -72.35336048816002, "y": -131.48327335842652 },
      color: "#4A90E2",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y1-chem1",
      title: "General Chemistry I",
      description: "Atomic structure, bonding, stoichiometry, states of matter, basic thermodynamics.",
      position: { "x": -397.0051929426205, "y": -33.21799961451953 },
      color: "#7ED321",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y1-intro-eng",
      title: "Intro to Engineering & CS",
      description: "Overview of engineering disciplines, problem-solving, basic programming (e.g., Python or MATLAB).",
      position: { "x": -400.83737518454166, "y": 110.29271028092143 },
      color: "#F5A623",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y1-calculus2",
      title: "Calculus II",
      description: "Advanced integration, sequences, series, parametric equations.",
      position: { "x": -66.63032926228557, "y": -252.5074519222524 },
      color: "#4A90E2",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y1-physics2",
      title: "Physics II (E&M)",
      description: "Electricity, magnetism, basic circuits, optics. Crucial for EE.",
      position: { "x": 263.3201027130844, "y": -35.582141149903464 },
      color: "#4A90E2",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y2-calculus3",
      title: "Calculus III (Multivariable)",
      description: "Vectors, partial derivatives, multiple integrals, vector calculus.",
      position: { "x": 263.4029405564604, "y": -173.93190796875888 },
      color: "#4A90E2",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y2-diff-eq",
      title: "Differential Equations",
      description: "Solving ordinary differential equations. Essential for circuit analysis and systems.",
      position: { "x": 284.57259397097454, "y": -299.1719932828131 },
      color: "#4A90E2",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y2-circuits1",
      title: "Electric Circuits I",
      description: "DC and AC circuit analysis, RLC circuits, phasors, Thévenin/Norton equivalents.",
      position: { "x": 622.4786621858788, "y": -119.72070970925579 },
      color: "#D0021B",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y2-digital-logic",
      title: "Digital Logic Design",
      description: "Boolean algebra, logic gates, combinational and sequential circuits, FPGAs/CPLDs basics.",
      position: { "x": 57.88936233364463, "y": 125.76215663135531 },
      color: "#BD10E0",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y3-electronics1",
      title: "Electronics I (Devices)",
      description: "Diodes, transistors (BJT, MOSFET), amplifiers, op-amps.",
      position: { "x": 910.4541008409794, "y": -119.2529463667855 },
      color: "#D0021B",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y3-signals-systems",
      title: "Signals & Systems",
      description: "Continuous and discrete-time signals, Fourier series/transform, Laplace/Z transforms, LTI systems.",
      position: { "x": 627.7891993497909, "y": -254.5533318029011 },
      color: "#F5A623",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y3-em-fields",
      title: "Electromagnetic Fields",
      description: "Maxwell's equations, wave propagation, transmission lines, antennas.",
      position: { "x": 621.9036575135997, "y": 10.301295508985433 },
      color: "#4A90E2",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y3-microprocessors",
      title: "Microprocessors & Embedded Systems",
      description: "Microcontroller architecture, assembly/C programming, interfacing.",
      position: { "x": 621.0845571710751, "y": 148.13865062665175 },
      color: "#BD10E0",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y4-control-systems",
      title: "Control Systems",
      description: "Feedback control, system stability, root locus, Bode plots, controller design.",
      position: { "x": 914.9157851113473, "y": -255.4925454629154 },
      color: "#F5A623",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y4-ee-elective1",
      title: "EE Elective 1 - Power Systems",
      description: "",
      position: { "x": 1300.1058089828518, "y": -61.318898893788415 },
      color: "#ffffff",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y4-ee-elective2",
      title: "EE Elective 2 - VLSI Design",
      description: "",
      position: { "x": 1286.7749870296082, "y": 106.6560374003702 },
      color: "#ffffff",
      completed: false,
      objectives: []
    },
    {
      id: "ee-y4-capstone",
      title: "Senior Capstone Design Project",
      description: "A culminating design project applying EE principles.",
      position: { "x": 1304.4279460350563, "y": -208.86658878116324 },
      color: "#D0021B",
      completed: false,
      objectives: [
        {
          id: "d16cc462-d933-42c0-b333-44252e6ff3fc",
          text: "Define project scope and requirements",
          completed: false,
          sortIndex: 0
        },
        {
          id: "823c4ffb-1888-4728-b0f7-ac3be3653b0e",
          text: "Design and simulate solution",
          completed: false,
          sortIndex: 1
        },
        {
          id: "fa3785d5-8b9c-43c8-b420-1775831a5f3b",
          text: "Build and test prototype",
          completed: false,
          sortIndex: 2
        },
        {
          id: "7e57ae94-b355-4ffc-95d4-51612daf0943",
          text: "Write final report and present",
          completed: false,
          sortIndex: 3
        }
      ]
    },
    {
      id: "ee-y4-graduation",
      title: "Done",
      description: "",
      position: { x: 1746.258994900493, y: -58.8389146248464 },
      color: "#FFD700",
      completed: false,
      objectives: []
    }
  ],
  dependencies: [
    { from: "ee-y1-calculus1", to: "ee-y1-calculus2" },
    { from: "ee-y1-physics1", to: "ee-y1-physics2" },
    { from: "ee-y1-calculus1", to: "ee-y1-physics1" },
    { from: "ee-y1-intro-eng", to: "ee-y2-digital-logic" },
    { from: "ee-y1-calculus2", to: "ee-y2-calculus3" },
    { from: "ee-y1-calculus2", to: "ee-y2-diff-eq" },
    { from: "ee-y1-physics2", to: "ee-y2-circuits1" },
    { from: "ee-y2-diff-eq", to: "ee-y2-circuits1" },
    { from: "ee-y2-circuits1", to: "ee-y3-electronics1" },
    { from: "ee-y2-diff-eq", to: "ee-y3-signals-systems" },
    { from: "ee-y2-calculus3", to: "ee-y3-signals-systems" },
    { from: "ee-y1-physics2", to: "ee-y3-em-fields" },
    { from: "ee-y2-calculus3", to: "ee-y3-em-fields" },
    { from: "ee-y2-digital-logic", to: "ee-y3-microprocessors" },
    { from: "ee-y3-signals-systems", to: "ee-y4-control-systems" },
    { from: "ee-y3-electronics1", to: "ee-y4-ee-elective1" },
    { from: "ee-y3-microprocessors", to: "ee-y4-ee-elective2" },
    { from: "ee-y3-electronics1", to: "ee-y4-capstone" },
    { from: "ee-y3-microprocessors", to: "ee-y4-capstone" },
    { from: "ee-y4-control-systems", to: "ee-y4-capstone" },
    { from: "ee-y4-capstone", to: "ee-y4-graduation" },
    { from: "ee-y4-ee-elective1", to: "ee-y4-graduation" },
    { from: "ee-y4-ee-elective2", to: "ee-y4-graduation" },
    { from: "ee-y1-chem1", to: "ee-y1-physics2" }
  ],
};

export class QuestlineLocalService implements IQuestlineService {

  constructor() {
    this.initDemoData();
  }

  private initDemoData(): void {
    const existingQuestlines = localStorage.getItem(QUESTLINES_LOCAL_KEY);

    if (!existingQuestlines || JSON.parse(existingQuestlines).length === 0) {
      const questline = this.questlineFrom(JSON.parse(JSON.stringify(demoQuestline)));      
      this.saveQuestlinesToStorage([questline]);

      if (questline.id) {
        localStorage.setItem(LAST_ACTIVE_QUESTLINE_ID_KEY, questline.id);
      }
    }
  }

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
