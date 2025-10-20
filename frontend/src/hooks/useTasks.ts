import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import type { TaskInput, TaskConfirm } from '../types';

export const useTasks = () => {
  const queryClient = useQueryClient();

  // Break down tasks
  const breakdownMutation = useMutation({
    mutationFn: (taskInput: TaskInput) => tasksApi.breakdown(taskInput),
    onSuccess: () => {
      // Invalidate tasks query to refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Confirm tasks
  const confirmMutation = useMutation({
    mutationFn: (taskConfirm: TaskConfirm) => tasksApi.confirm(taskConfirm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Get all tasks
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(false),
  });

  // Delete task
  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    breakdown: breakdownMutation,
    confirm: confirmMutation,
    tasks: tasksQuery,
    delete: deleteMutation,
  };
};
