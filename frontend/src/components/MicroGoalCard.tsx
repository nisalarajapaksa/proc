import { useState } from 'react';
import type { MicroGoal } from '../types';
import { formatMinutes } from '../utils/time';

interface MicroGoalCardProps {
  goal: MicroGoal;
  onUpdate: (updatedGoal: MicroGoal) => void;
  onDelete: () => void;
  isEditable: boolean;
}

export const MicroGoalCard: React.FC<MicroGoalCardProps> = ({
  goal,
  onUpdate,
  onDelete,
  isEditable,
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    // timeString is in HH:MM:SS format, convert to HH:MM for display
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  // Special rendering for break periods
  if (goal.is_break) {
    const isLongBreak = goal.break_type === 'long';
    return (
      <div className={`border-2 border-dashed rounded-lg p-4 transition-shadow ${
        isLongBreak
          ? 'bg-purple-50 border-purple-300'
          : 'bg-cyan-50 border-cyan-300'
      }`}>
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
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isLongBreak
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-cyan-100 text-cyan-800'
                }`}>
                  {formatMinutes(goal.estimated_minutes)}
                </span>
                {goal.starting_time && goal.end_time && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isLongBreak
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-cyan-100 text-cyan-800'
                  }`}>
                    {formatTime(goal.starting_time)} - {formatTime(goal.end_time)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular task rendering
  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
      goal.exceeds_end_time ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-800">{goal.title}</h3>
            {goal.exceeds_end_time && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-200 text-orange-800">
                Overflow
              </span>
            )}
          </div>
          {goal.description && (
            <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {formatMinutes(goal.estimated_minutes)}
            </span>
            {goal.starting_time && goal.end_time && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                goal.exceeds_end_time ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
              }`}>
                {formatTime(goal.starting_time)} - {formatTime(goal.end_time)}
              </span>
            )}
          </div>
        </div>
        {isEditable && (
          <div className="flex gap-2 ml-4">
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
  );
};
