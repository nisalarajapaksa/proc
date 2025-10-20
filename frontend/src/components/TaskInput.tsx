import { useState } from 'react';

interface TaskInputProps {
  onSubmit: (tasksText: string) => void;
  isLoading: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, isLoading }) => {
  const [tasksText, setTasksText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tasksText.trim()) {
      onSubmit(tasksText);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="mb-4">
        <label htmlFor="tasks" className="block text-lg font-semibold mb-2 text-gray-700">
          What are your tasks for today?
        </label>
        <textarea
          id="tasks"
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Enter all your tasks for the day... e.g.,&#10;- Write project report&#10;- Respond to client emails&#10;- Prepare presentation for tomorrow&#10;- Review code pull requests"
          value={tasksText}
          onChange={(e) => setTasksText(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !tasksText.trim()}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Breaking down your tasks...' : 'Break Down My Tasks'}
      </button>
    </form>
  );
};
