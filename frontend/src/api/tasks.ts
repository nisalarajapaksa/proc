import { apiClient } from './client';
import type { TaskInput, TaskBreakdownResponse, TaskConfirm, TaskResponse, MicroGoal, ExecutionSummary } from '../types';

export const tasksApi = {
  /**
   * Send raw task text to be broken down by LLM
   */
  breakdown: async (taskInput: TaskInput): Promise<TaskBreakdownResponse> => {
    const response = await apiClient.post<TaskBreakdownResponse>('/tasks/breakdown', taskInput);
    return response.data;
  },

  /**
   * Confirm and save edited micro-goals
   */
  confirm: async (taskConfirm: TaskConfirm): Promise<TaskResponse> => {
    const response = await apiClient.post<TaskResponse>('/tasks/confirm', taskConfirm);
    return response.data;
  },

  /**
   * Get all tasks
   */
  getAll: async (confirmedOnly = false): Promise<TaskResponse[]> => {
    const response = await apiClient.get<TaskResponse[]>('/tasks/', {
      params: { confirmed_only: confirmedOnly }
    });
    return response.data;
  },

  /**
   * Get a specific task
   */
  getById: async (taskId: number): Promise<TaskResponse> => {
    const response = await apiClient.get<TaskResponse>(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Delete a task
   */
  delete: async (taskId: number): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  // Pomodoro Timer Controls

  /**
   * Start a micro-goal timer
   */
  startMicroGoal: async (goalId: number): Promise<MicroGoal> => {
    const response = await apiClient.post<MicroGoal>(`/tasks/micro-goals/${goalId}/start`);
    return response.data;
  },

  /**
   * Pause a micro-goal timer
   */
  pauseMicroGoal: async (goalId: number): Promise<MicroGoal> => {
    const response = await apiClient.post<MicroGoal>(`/tasks/micro-goals/${goalId}/pause`);
    return response.data;
  },

  /**
   * Resume a paused micro-goal timer
   */
  resumeMicroGoal: async (goalId: number): Promise<MicroGoal> => {
    const response = await apiClient.post<MicroGoal>(`/tasks/micro-goals/${goalId}/resume`);
    return response.data;
  },

  /**
   * Complete a micro-goal
   */
  completeMicroGoal: async (goalId: number): Promise<MicroGoal> => {
    const response = await apiClient.post<MicroGoal>(`/tasks/micro-goals/${goalId}/complete`);
    return response.data;
  },

  /**
   * Update time spent on a micro-goal
   */
  updateTimeSpent: async (goalId: number, timeSpentSeconds: number): Promise<MicroGoal> => {
    const response = await apiClient.patch<MicroGoal>(`/tasks/micro-goals/${goalId}/time`, null, {
      params: { time_spent_seconds: timeSpentSeconds }
    });
    return response.data;
  },

  /**
   * Get execution summary for a micro-goal (plan vs actual)
   */
  getExecutionSummary: async (goalId: number): Promise<ExecutionSummary> => {
    const response = await apiClient.get<ExecutionSummary>(`/tasks/micro-goals/${goalId}/execution-summary`);
    return response.data;
  },
};
