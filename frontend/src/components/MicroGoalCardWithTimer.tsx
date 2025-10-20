import { useState } from 'react';
import type { MicroGoal } from '../types';
import { formatMinutes } from '../utils/time';
import { PomodoroTimer } from './PomodoroTimer';

interface MicroGoalCardWithTimerProps {
  goal: MicroGoal;
  onUpdate: (updatedGoal: MicroGoal) => void;
  onDelete: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onTimeUpdate: (seconds: number) => void;
  onTimerComplete: () => void;
  isEditable: boolean;
  hasActiveTask: boolean;
}

export const MicroGoalCardWithTimer: React.FC<MicroGoalCardWithTimerProps> = ({
  goal,
  onUpdate,
  onDelete,
  onStart,
  onPause,
  onResume,
  onComplete,
  onTimeUpdate,
  onTimerComplete,
  isEditable,
  hasActiveTask,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState(goal);

  const handleSave = () => {
    onUpdate(editedGoal);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGoal(goal);
    setIsEditing(false);
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  // Editing mode
  if (isEditing) {
    return (
      <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-sm">
        <input
          type="text"
          value={editedGoal.title}
          onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
          className="w-full text-lg font-semibold mb-2 px-2 py-1 border border-gray-300 rounded"
          placeholder="Task title"
        />
        <textarea
          value={editedGoal.description || ''}
          onChange={(e) => setEditedGoal({ ...editedGoal, description: e.target.value })}
          className="w-full text-sm text-gray-600 mb-2 px-2 py-1 border border-gray-300 rounded resize-none"
          rows={2}
          placeholder="Description (optional)"
        />
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium">Time:</label>
          <input
            type="number"
            value={editedGoal.estimated_minutes}
            onChange={(e) =>
              setEditedGoal({ ...editedGoal, estimated_minutes: parseInt(e.target.value) || 0 })
            }
            className="w-20 px-2 py-1 border border-gray-300 rounded"
            min="5"
            max="480"
          />
          <span className="text-sm text-gray-500">minutes</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Special rendering for break periods
  if (goal.is_break) {
    const isLongBreak = goal.break_type === 'long';
    return (
      <div className={`border-2 border-dashed rounded-lg p-4 transition-shadow ${
        isLongBreak
          ? 'bg-purple-50 border-purple-300'
          : 'bg-cyan-50 border-cyan-300'
      } ${goal.completed ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${isLongBreak ? 'animate-pulse' : ''}`}>
              {isLongBreak ? '🌴' : '☕'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-semibold ${
                  isLongBreak ? 'text-purple-900' : 'text-cyan-900'
                }`}>
                  {goal.title}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isLongBreak
                    ? 'bg-purple-200 text-purple-800'
                    : 'bg-cyan-200 text-cyan-800'
                }`}>
                  Break Time
                </span>
              </div>
              {goal.description && (
                <p className={`text-sm mt-1 ${
                  isLongBreak ? 'text-purple-700' : 'text-cyan-700'
                }`}>
                  {goal.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed task styling
  const isCompleted = goal.completed;
  const isActiveTask = goal.is_active;
  const isDimmed = hasActiveTask && !isActiveTask && !isCompleted;

  // Regular task rendering
  return (
    <div className={`rounded-lg p-4 shadow-sm transition-all duration-300 ${
      isCompleted
        ? 'bg-gray-100 border-2 border-gray-300 opacity-75'
        : isActiveTask
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-lg ring-2 ring-blue-300'
        : goal.exceeds_end_time
        ? 'bg-orange-50 border border-orange-300'
        : 'bg-white border border-gray-200'
    } ${isDimmed ? 'opacity-40' : ''}`}>
      <div className="flex gap-4">
        {/* Timer Section - Shows when active */}
        {isActiveTask && !isCompleted && (
          <div className="flex-shrink-0">
            <PomodoroTimer
              estimatedMinutes={goal.estimated_minutes}
              timeSpentSeconds={goal.time_spent_seconds || 0}
              isActive={goal.is_active || false}
              isPaused={goal.is_paused || false}
              onTimeUpdate={onTimeUpdate}
              onTimerComplete={onTimerComplete}
            />
          </div>
        )}

        {/* Task Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-lg font-semibold ${
                  isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'
                }`}>
                  {goal.title}
                </h3>
                {goal.exceeds_end_time && !isCompleted && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-200 text-orange-800">
                    Overflow
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800">
                    ✓ Completed
                  </span>
                )}
              </div>
              {goal.description && (
                <p className={`text-sm mb-2 ${
                  isCompleted ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {goal.description}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isCompleted ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'
                }`}>
                  ⏱️ {formatMinutes(goal.estimated_minutes)}
                </span>
                {(goal.starting_time || goal.end_time) && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isCompleted
                      ? 'bg-gray-200 text-gray-600'
                      : goal.exceeds_end_time
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    🕐 {formatTime(goal.starting_time) || '--:--'} - {formatTime(goal.end_time) || '--:--'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 mt-3">
            {!isCompleted && !isActiveTask && !hasActiveTask && (
              <button
                onClick={onStart}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <span>▶</span> Start
              </button>
            )}

            {isActiveTask && !goal.is_paused && (
              <>
                <button
                  onClick={onPause}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <span>⏸</span> Pause
                </button>
                <button
                  onClick={onComplete}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <span>✓</span> Complete
                </button>
              </>
            )}

            {isActiveTask && goal.is_paused && (
              <>
                <button
                  onClick={onResume}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <span>▶</span> Resume
                </button>
                <button
                  onClick={onComplete}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <span>✓</span> Complete
                </button>
              </>
            )}

            {isEditable && !isActiveTask && !isCompleted && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
