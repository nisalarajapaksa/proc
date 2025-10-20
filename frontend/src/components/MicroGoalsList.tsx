import { useState } from 'react';
import type { MicroGoal } from '../types';
import { MicroGoalCard } from './MicroGoalCard';
import { formatMinutes, calculateTotalMinutes } from '../utils/time';

interface MicroGoalsListProps {
  goals: MicroGoal[];
  onConfirm: (goals: MicroGoal[]) => void;
  isConfirming: boolean;
}

export const MicroGoalsList: React.FC<MicroGoalsListProps> = ({
  goals: initialGoals,
  onConfirm,
  isConfirming,
}) => {
  const [goals, setGoals] = useState<MicroGoal[]>(initialGoals);

  const handleUpdateGoal = (index: number, updatedGoal: MicroGoal) => {
    const newGoals = [...goals];
    newGoals[index] = updatedGoal;
    setGoals(newGoals);
  };

  const handleDeleteGoal = (index: number) => {
    const newGoals = goals.filter((_, i) => i !== index);
    // Re-order remaining goals
    const reorderedGoals = newGoals.map((goal, idx) => ({ ...goal, order: idx }));
    setGoals(reorderedGoals);
  };

  const totalMinutes = calculateTotalMinutes(goals);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Micro-Goals</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Time</p>
            <p className="text-2xl font-bold text-blue-600">{formatMinutes(totalMinutes)}</p>
          </div>
        </div>
        <p className="text-gray-600">
          Review and edit your micro-goals below. When ready, click "Confirm & Save" to save them.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {goals.map((goal, index) => (
          <MicroGoalCard
            key={index}
            goal={goal}
            onUpdate={(updatedGoal) => handleUpdateGoal(index, updatedGoal)}
            onDelete={() => handleDeleteGoal(index)}
            isEditable={true}
          />
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No micro-goals yet. Start by entering your tasks above.
        </div>
      )}

      {goals.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(goals)}
            disabled={isConfirming}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isConfirming ? 'Saving...' : 'Confirm & Save'}
          </button>
          <button
            onClick={() => window.location.reload()}
            disabled={isConfirming}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};
