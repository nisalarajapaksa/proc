export interface ExecutionEvent {
  id?: number;
  action: 'start' | 'pause' | 'resume' | 'complete';
  timestamp: string;  // ISO datetime string
  time_spent_at_event: number;
  notes?: string;
}

export interface ExecutionSummary {
  planned_duration_minutes: number;
  actual_duration_seconds: number;
  actual_duration_minutes: number;
  variance_minutes: number;
  total_pauses: number;
  total_sessions: number;
  started_at?: string;  // ISO datetime string
  completed_at?: string;  // ISO datetime string
  events: ExecutionEvent[];
}

export interface MicroGoal {
  id?: number;
  title: string;
  description?: string;
  estimated_minutes: number;
  order: number;
  completed: boolean;
  starting_time?: string;  // Time in HH:MM:SS format
  end_time?: string;       // Time in HH:MM:SS format
  exceeds_end_time?: boolean;  // Flag if this task goes beyond desired end time
  is_break?: boolean;  // Flag if this is a Pomodoro break
  break_type?: 'short' | 'long';  // Type of break

  // Pomodoro timer state
  is_active?: boolean;
  is_paused?: boolean;
  actual_start_time?: string;  // ISO datetime string
  actual_end_time?: string;    // ISO datetime string
  time_spent_seconds?: number;

  // Execution tracking
  execution_history?: Array<{action: string; timestamp: string}>;
  execution_events?: ExecutionEvent[];
}

export interface TaskInput {
  tasks_text: string;
  starting_time?: string;  // Time in HH:MM:SS format
  end_time?: string;       // Time in HH:MM:SS format
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
