import { useState, useEffect, useRef } from 'react';
import type { MicroGoal } from '../types';
import { MicroGoalCardWithTimer } from './MicroGoalCardWithTimer';
import { TaskCompletionModal } from './TaskCompletionModal';
import { tasksApi } from '../api/tasks';
import { formatMinutes, calculateTotalMinutes } from '../utils/time';

interface ActiveTasksListProps {
  goals: MicroGoal[];
  taskId: number;
  onGoalsUpdate: (goals: MicroGoal[]) => void;
}

export const ActiveTasksList: React.FC<ActiveTasksListProps> = ({
  goals: initialGoals,
  taskId: _taskId, // Kept for future use
  onGoalsUpdate,
}) => {
  const [goals, setGoals] = useState<MicroGoal[]>(initialGoals);
  const [completionModal, setCompletionModal] = useState<{ isOpen: boolean; goalId?: number; title?: string }>({
    isOpen: false,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  // Create alarm sound effect
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playAlarm = () => {
    // Play system notification sound (browser default)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8bllHAU2jdXzzn0vBSJ1xe/glEILElyx5+ytWBQLRJve8cJwIQUqfs/y24o3CBtpvfDknE4MDlCl4fG5ZRwFNo3V885+LwUidcXv4JRCCxJcseftrVkUC0Sb3vHCcSEFKn/P8tyKNwgbab3w5JxODA5QpeHxuWUcBTaN1fPOfS8FInXF7+CUQgsSXLHn7a1ZFAtEm97xwnEhBSp/z/LcijcIG2m98OScTgwOUKXh8bllHAU2jdXzzn0vBSJ1xe/glEILElyx5+2tWRQLRJve8cJxIQUqf8/y3Io3CBtpvfDknE4MDlCl4fG5ZRwFNo3V885+LwUidcXv4JRCCxJcseftrVkUC0Sb3vHCcSEFKn/P8tyKNwgbab3w5JxODA5QpeHxuWUcBTaN1fPOfS8FInXF7+CUQgsSXLHn7a1ZFAtEm97xwnEhBSp/z/LcijcIG2m98OScTgwOUKXh8bllHAU2jdXzzn0vBSJ1xe/glEILElyx5+2tWRQLRJve8cJxIQUqf8/y3Io3CBtpvfDknE4MDlCl4fG5ZRwFNo3V885+LwUidcXv4JRCCxJcseftrVkUC0Sb3vHCcSEFKn/P8tyKNwgbab3w5JxODA5QpeHxuWUcBTaN1fPOfS8FInXF7+CUQgsSXLHn7a1ZFAtEm97xwnEhBSp/z/LcijcIG2m98OScTgwOUKXh8bllHAU2jdXzzn0vBSJ1xe/glEILElyx5+2tWRQLRJve8cJxIQUqf8/y3Io3CBtpvfDknE4MDlCl4fG5ZRwFNo3V885+LwUidcXv4JRCCxJcseftrVkUC0Sb3vHCcSEFKn/P8tyKNwgbab3w5JxODA5QpeHxuWUcBTaN1fPOfS8FInXF7+CUQgsSXLHn7a1ZFAtEm97xwnEhBSp/z/LcijcIG2m98OScTgwOUKXh8bllHAU2jdXzzn0vBSJ1xe/glEILElyx5+2tWRQLRJve8cJxIQUqf8/y3Io3CBtpvfDknE4MDlCl4fG5ZRwFNo3V885+LwUidcXv4JRCCxJcseftrVkUC0Sb3vHCcSEFKn/P8tyKNwgbab3w5JxODA5QpeHxuWUcBTaN1fPOfS8FInXF7+CUQgsSXLHn7a1ZFAtEm97xwnEhBSp/z/Lcij');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const handleUpdateGoal = (index: number, updatedGoal: MicroGoal) => {
    const newGoals = [...goals];
    newGoals[index] = updatedGoal;
    setGoals(newGoals);
    onGoalsUpdate(newGoals);
  };

  const handleDeleteGoal = (index: number) => {
    const newGoals = goals.filter((_, i) => i !== index);
    const reorderedGoals = newGoals.map((goal, idx) => ({ ...goal, order: idx }));
    setGoals(reorderedGoals);
    onGoalsUpdate(reorderedGoals);
  };

  const handleStart = async (goalId: number, index: number) => {
    try {
      const updated = await tasksApi.startMicroGoal(goalId);
      const newGoals = goals.map((g, i) =>
        i === index ? updated : { ...g, is_active: false }
      );
      setGoals(newGoals);
      onGoalsUpdate(newGoals);
    } catch (error) {
      console.error('Failed to start task:', error);
      alert('Failed to start task');
    }
  };

  const handlePause = async (goalId: number, index: number) => {
    try {
      const updated = await tasksApi.pauseMicroGoal(goalId);
      const newGoals = goals.map((g, i) => i === index ? updated : g);
      setGoals(newGoals);
      onGoalsUpdate(newGoals);
    } catch (error) {
      console.error('Failed to pause task:', error);
      alert('Failed to pause task');
    }
  };

  const handleResume = async (goalId: number, index: number) => {
    try {
      const updated = await tasksApi.resumeMicroGoal(goalId);
      const newGoals = goals.map((g, i) =>
        i === index ? updated : { ...g, is_active: false }
      );
      setGoals(newGoals);
      onGoalsUpdate(newGoals);
    } catch (error) {
      console.error('Failed to resume task:', error);
      alert('Failed to resume task');
    }
  };

  const handleComplete = async (goalId: number, index: number) => {
    try {
      const updated = await tasksApi.completeMicroGoal(goalId);
      const newGoals = goals.map((g, i) => i === index ? updated : g);
      setGoals(newGoals);
      onGoalsUpdate(newGoals);
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task');
    }
  };

  const handleTimeUpdate = async (goalId: number, timeSpentSeconds: number) => {
    try {
      await tasksApi.updateTimeSpent(goalId, timeSpentSeconds);
    } catch (error) {
      console.error('Failed to update time:', error);
    }
  };

  const handleTimerComplete = (goalId: number, title: string) => {
    playAlarm();
    setCompletionModal({ isOpen: true, goalId, title });
  };

  const handleModalContinue = () => {
    setCompletionModal({ isOpen: false });
  };

  const handleModalComplete = async () => {
    if (completionModal.goalId) {
      const index = goals.findIndex(g => g.id === completionModal.goalId);
      if (index !== -1) {
        await handleComplete(completionModal.goalId, index);
      }
    }
    setCompletionModal({ isOpen: false });
  };

  const totalMinutes = calculateTotalMinutes(goals);
  const hasActiveTask = goals.some(g => g.is_active);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Daily Tasks</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Time</p>
            <p className="text-2xl font-bold text-blue-600">{formatMinutes(totalMinutes)}</p>
          </div>
        </div>
        <p className="text-gray-600">
          Click "Start" on a task to begin your Pomodoro session. Focus on one task at a time!
        </p>
      </div>

      {/* Dimming overlay for inactive tasks */}
      <div className="space-y-3 mb-6">
        {goals.map((goal, index) => {
          // Only show separator if this is the first task that exceeds end time
          // AND there was at least one task before it that didn't exceed
          const isFirstOverflow = goal.exceeds_end_time &&
            index > 0 &&
            !goals[index - 1].exceeds_end_time;

          return (
            <div key={goal.id || index}>
              {isFirstOverflow && (
                <div className="mb-4 mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-orange-400"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-2 text-sm font-semibold text-orange-700 rounded-full border-2 border-orange-400 shadow-sm">
                        ⚠️ Tasks Beyond Your Desired End Time
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-600 mt-2">
                    These tasks extend beyond your planned schedule
                  </p>
                </div>
              )}
              <MicroGoalCardWithTimer
                goal={goal}
                onUpdate={(updatedGoal) => handleUpdateGoal(index, updatedGoal)}
                onDelete={() => handleDeleteGoal(index)}
                onStart={() => handleStart(goal.id!, index)}
                onPause={() => handlePause(goal.id!, index)}
                onResume={() => handleResume(goal.id!, index)}
                onComplete={() => handleComplete(goal.id!, index)}
                onTimeUpdate={(seconds) => handleTimeUpdate(goal.id!, seconds)}
                onTimerComplete={() => handleTimerComplete(goal.id!, goal.title)}
                isEditable={false}
                hasActiveTask={hasActiveTask}
              />
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks yet. Create your daily plan above!
        </div>
      )}

      {/* Completion Modal */}
      <TaskCompletionModal
        isOpen={completionModal.isOpen}
        taskTitle={completionModal.title || ''}
        onContinue={handleModalContinue}
        onComplete={handleModalComplete}
        onClose={() => setCompletionModal({ isOpen: false })}
      />
    </div>
  );
};
