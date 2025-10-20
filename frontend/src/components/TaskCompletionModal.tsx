interface TaskCompletionModalProps {
  isOpen: boolean;
  taskTitle: string;
  onContinue: () => void;
  onComplete: () => void;
  onClose: () => void;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  taskTitle,
  onContinue,
  onComplete,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 z-10">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Time's Up!
          </h2>
          <p className="text-gray-600">
            "{taskTitle}"
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onComplete}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            ✓ Mark as Complete
          </button>

          <button
            onClick={onContinue}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            → Continue Working
          </button>

          <button
            onClick={onClose}
            className="w-full border-2 border-gray-300 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
