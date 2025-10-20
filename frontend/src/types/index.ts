export interface MicroGoal {
  id?: number;
  title: string;
  description?: string;
  estimated_minutes: number;
  order: number;
  completed: boolean;
}

export interface TaskInput {
  tasks_text: string;
}

export interface TaskBreakdownResponse {
  task_id: number;
  micro_goals: MicroGoal[];
  total_estimated_minutes: number;
}

export interface TaskResponse {
  id: number;
  user_input: string;
  created_at: string;
  confirmed: boolean;
  micro_goals: MicroGoal[];
}

export interface TaskConfirm {
  task_id: number;
  micro_goals: MicroGoal[];
}
