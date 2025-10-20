import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskInput } from './components/TaskInput';
import { MicroGoalsList } from './components/MicroGoalsList';
import { ActiveTasksList } from './components/ActiveTasksList';
import { useTasks } from './hooks/useTasks';
import type { TaskBreakdownResponse, MicroGoal } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function TaskBreakdownApp() {
  const [breakdownResult, setBreakdownResult] = useState<TaskBreakdownResponse | null>(null);
  const [confirmedTask, setConfirmedTask] = useState<{ taskId: number; goals: MicroGoal[] } | null>(null);
  const { breakdown, confirm } = useTasks();

  const handleTaskSubmit = async (tasksText: string, startingTime?: string, endTime?: string) => {
    try {
      const result = await breakdown.mutateAsync({
        tasks_text: tasksText,
        starting_time: startingTime,
        end_time: endTime
      });
      setBreakdownResult(result);
    } catch (error) {
      console.error('Error breaking down tasks:', error);
      alert('Failed to break down tasks. Please check your API connection and try again.');
    }
  };

  const handleConfirm = async (goals: MicroGoal[]) => {
    if (!breakdownResult) return;

    try {
      const result = await confirm.mutateAsync({
        task_id: breakdownResult.task_id,
        micro_goals: goals,
      });
      setConfirmedTask({ taskId: breakdownResult.task_id, goals: result.micro_goals });
      setBreakdownResult(null);
    } catch (error) {
      console.error('Error confirming tasks:', error);
      alert('Failed to save tasks. Please try again.');
    }
  };

  const handleGoalsUpdate = (updatedGoals: MicroGoal[]) => {
    if (confirmedTask) {
      setConfirmedTask({ ...confirmedTask, goals: updatedGoals });
    }
  };

  const handleStartOver = () => {
    setConfirmedTask(null);
    setBreakdownResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Pomodoro Task Manager
          </h1>
          <p className="text-lg text-gray-600">
            Break down tasks, start your Pomodoro timer, and stay focused!
          </p>
        </header>

        <div className="space-y-8">
          {/* Active Task View - After confirmation */}
          {confirmedTask && (
            <div>
              <div className="bg-white rounded-xl shadow-lg p-8 mb-4">
                <ActiveTasksList
                  goals={confirmedTask.goals}
                  taskId={confirmedTask.taskId}
                  onGoalsUpdate={handleGoalsUpdate}
                />
              </div>
              <div className="text-center">
                <button
                  onClick={handleStartOver}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Start New Task List
                </button>
              </div>
            </div>
          )}

          {/* Task Input View - Initial state */}
          {!confirmedTask && !breakdownResult && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <TaskInput onSubmit={handleTaskSubmit} isLoading={breakdown.isPending} />
            </div>
          )}

          {/* Preview/Edit View - After breakdown, before confirmation */}
          {!confirmedTask && breakdownResult && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <MicroGoalsList
                goals={breakdownResult.micro_goals}
                onConfirm={handleConfirm}
                isConfirming={confirm.isPending}
              />
            </div>
          )}
        </div>

        {breakdown.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Error</p>
            <p>Failed to break down tasks. Please check your backend connection.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskBreakdownApp />
    </QueryClientProvider>
  );
}

export default App;
