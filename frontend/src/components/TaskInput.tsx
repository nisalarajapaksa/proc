import { useState } from 'react';

interface TaskInputProps {
  onSubmit: (tasksText: string, startingTime?: string, endTime?: string) => void;
  isLoading: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, isLoading }) => {
  const [tasksText, setTasksText] = useState('');
  const [startingTime, setStartingTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeError, setTimeError] = useState('');

  const validateTimes = (start: string, end: string): boolean => {
    if (!start || !end) {
      setTimeError('');
      return true;
    }

    // Compare times directly (HH:MM format)
    if (end <= start) {
      setTimeError('End time must be later than starting time');
      return false;
    }

    setTimeError('');
    return true;
  };

  const handleStartingTimeChange = (value: string) => {
    setStartingTime(value);
    validateTimes(value, endTime);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    validateTimes(startingTime, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tasksText.trim()) {
      return;
    }

    if (!validateTimes(startingTime, endTime)) {
      return;
    }

    // Convert HH:MM to HH:MM:SS format if provided
    const startTimeWithSeconds = startingTime ? `${startingTime}:00` : undefined;
    const endTimeWithSeconds = endTime ? `${endTime}:00` : undefined;
    onSubmit(tasksText, startTimeWithSeconds, endTimeWithSeconds);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="startingTime" className="block text-sm font-semibold mb-2 text-gray-700">
            Starting Time (optional)
          </label>
          <input
            type="time"
            id="startingTime"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
              timeError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            value={startingTime}
            onChange={(e) => handleStartingTimeChange(e.target.value)}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            When you want to start
          </p>
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-semibold mb-2 text-gray-700">
            Desired End Time (optional)
          </label>
          <input
            type="time"
            id="endTime"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
              timeError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
            value={endTime}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            When you want to finish
          </p>
        </div>
      </div>

      {timeError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{timeError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !tasksText.trim() || !!timeError}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Breaking down your tasks...' : 'Break Down My Tasks'}
      </button>
    </form>
  );
};
