export enum AppView {
  CAREER_PLAN = 'CAREER_PLAN',
  RESUME_TOOLS = 'RESUME_TOOLS',
  CHAT_COACH = 'CHAT_COACH',
}

export interface UserProfile {
  name: string;
  major: string;
  skills: string;
  interests: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface CareerPlan {
  role: string;
  content: string;
}

export interface ResumeCritique {
  score: number;
  content: string;
}

export interface RevisionResult {
  content: string;
}