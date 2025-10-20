import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskInput } from './components/TaskInput';
import { MicroGoalsList } from './components/MicroGoalsList';
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
  const { breakdown, confirm } = useTasks();

  const handleTaskSubmit = async (tasksText: string, startingTime?: string) => {
    try {
      const result = await breakdown.mutateAsync({
        tasks_text: tasksText,
        starting_time: startingTime
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
      await confirm.mutateAsync({
        task_id: breakdownResult.task_id,
        micro_goals: goals,
      });
      alert('Tasks saved successfully!');
      setBreakdownResult(null);
    } catch (error) {
      console.error('Error confirming tasks:', error);
      alert('Failed to save tasks. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Task Breakdown Assistant
          </h1>
          <p className="text-lg text-gray-600">
            Stop procrastinating. Break down your tasks into actionable micro-goals.
          </p>
        </header>

        <div className="space-y-8">
          {!breakdownResult ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <TaskInput onSubmit={handleTaskSubmit} isLoading={breakdown.isPending} />
            </div>
          ) : (
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
