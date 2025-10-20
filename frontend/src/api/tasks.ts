import { apiClient } from './client';
import type { TaskInput, TaskBreakdownResponse, TaskConfirm, TaskResponse } from '../types';

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
};
