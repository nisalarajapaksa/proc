import { useEffect, useState, useRef } from 'react';

interface PomodoroTimerProps {
  estimatedMinutes: number;
  timeSpentSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  onTimeUpdate: (seconds: number) => void;
  onTimerComplete: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  estimatedMinutes,
  timeSpentSeconds,
  isActive,
  isPaused,
  onTimeUpdate,
  onTimerComplete,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(timeSpentSeconds);
  const intervalRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  const totalSeconds = estimatedMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const isOvertime = elapsedSeconds > totalSeconds;

  useEffect(() => {
    setElapsedSeconds(timeSpentSeconds);
  }, [timeSpentSeconds]);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          const newValue = prev + 1;
          onTimeUpdate(newValue);

          // Check if timer just completed
          if (newValue >= totalSeconds && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onTimerComplete();
          }

          return newValue;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, totalSeconds, onTimeUpdate, onTimerComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.min(100, (elapsedSeconds / totalSeconds) * 100);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular Progress */}
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressPercentage / 100)}`}
            className={`transition-all duration-300 ${
              isOvertime ? 'text-red-500' : 'text-blue-500'
            }`}
            strokeLinecap="round"
          />
        </svg>
        {/* Time display in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${
            isOvertime ? 'text-red-600' : 'text-gray-800'
          }`}>
            {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsedSeconds - totalSeconds : remainingSeconds)}
          </span>
        </div>
      </div>

      {/* Time labels */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {elapsedSeconds > 0 && (
            <span>Elapsed: {formatTime(elapsedSeconds)}</span>
          )}
        </p>
        {isOvertime && (
          <p className="text-xs text-red-600 font-semibold mt-1">
            Overtime!
          </p>
        )}
      </div>
    </div>
  );
};
