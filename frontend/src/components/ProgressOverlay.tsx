import React from 'react';
import { MicroGoal } from '../types';

interface ProgressData {
  totalTasks: number;
  completedTasks: number;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  currentTaskTitle?: string;
  onTimeTasksCount: number;
  overdueTasksCount: number;
  upcomingTasksCount: number;
  tips: string[];
}

interface ProgressOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  goals: MicroGoal[];
  progressData: ProgressData;
  isLoadingTips: boolean;
}

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  isOpen,
  onClose,
  goals,
  progressData,
  isLoadingTips
}) => {
  if (!isOpen) return null;

  const completionPercentage = progressData.totalTasks > 0
    ? Math.round((progressData.completedTasks / progressData.totalTasks) * 100)
    : 0;

  const timePercentage = progressData.totalPlannedMinutes > 0
    ? Math.round((progressData.totalActualMinutes / progressData.totalPlannedMinutes) * 100)
    : 0;

  const isAheadOfSchedule = timePercentage < completionPercentage;
  const isBehindSchedule = timePercentage > completionPercentage + 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Progress</h2>
              <p className="text-blue-100 text-sm mt-1">Track your journey and get insights</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Task Status */}
          {progressData.currentTaskTitle && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">▶</span>
                <div>
                  <p className="text-sm text-blue-800 font-semibold">Currently Working On:</p>
                  <p className="text-blue-900">{progressData.currentTaskTitle}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-700">{progressData.completedTasks}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-700">{progressData.upcomingTasksCount}</div>
              <div className="text-sm text-yellow-600">Upcoming</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-700">{progressData.overdueTasksCount}</div>
              <div className="text-sm text-red-600">Overdue</div>
            </div>
          </div>

          {/* Task Completion Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Task Completion</h3>
              <span className="text-2xl font-bold text-blue-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${completionPercentage}%` }}
              >
                {completionPercentage > 10 && (
                  <span className="text-xs text-white font-semibold">
                    {progressData.completedTasks}/{progressData.totalTasks}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Time Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Time Spent vs Planned</h3>
              <span className="text-2xl font-bold text-purple-600">{timePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                  isAheadOfSchedule
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : isBehindSchedule
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600'
                }`}
                style={{ width: `${Math.min(timePercentage, 100)}%` }}
              >
                {timePercentage > 10 && (
                  <span className="text-xs text-white font-semibold">
                    {progressData.totalActualMinutes}m / {progressData.totalPlannedMinutes}m
                  </span>
                )}
              </div>
            </div>
            {isAheadOfSchedule && (
              <p className="text-sm text-green-600 mt-1">You're ahead of schedule! 🎉</p>
            )}
            {isBehindSchedule && (
              <p className="text-sm text-red-600 mt-1">Taking longer than planned - consider adjusting your approach</p>
            )}
          </div>

          {/* AI Tips Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-5">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Personalized Tips for You
            </h3>

            {isLoadingTips ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-purple-600">Analyzing your progress...</span>
              </div>
            ) : progressData.tips.length > 0 ? (
              <div className="space-y-3">
                {progressData.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 hover:shadow-md transition-shadow"
                  >
                    <p className="text-gray-800 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic">No tips available yet. Keep working to get personalized insights!</p>
            )}
          </div>

          {/* Task Breakdown */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">All Tasks</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {goals.filter(g => !g.is_break).map((goal) => (
                <div
                  key={goal.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    goal.completed
                      ? 'bg-gray-50 border-gray-200'
                      : goal.is_active
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      goal.completed ? 'bg-green-500' : goal.is_active ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className={goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                      {goal.title}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {goal.time_spent_seconds ? `${Math.round(goal.time_spent_seconds / 60)}m` : `${goal.estimated_minutes}m planned`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Continue Working
          </button>
        </div>
      </div>
    </div>
  );
};
