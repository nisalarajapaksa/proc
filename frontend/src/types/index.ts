export interface MicroGoal {
  id?: number;
  title: string;
  description?: string;
  estimated_minutes: number;
  order: number;
  completed: boolean;
  starting_time?: string;  // Time in HH:MM:SS format
  end_time?: string;       // Time in HH:MM:SS format
}

export interface TaskInput {
  tasks_text: string;
  starting_time?: string;  // Time in HH:MM:SS format
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
  starting_time?: string;
  micro_goals: MicroGoal[];
}

export interface TaskConfirm {
  task_id: number;
  micro_goals: MicroGoal[];
}
