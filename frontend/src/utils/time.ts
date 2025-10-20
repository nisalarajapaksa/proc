/**
 * Convert minutes to human-readable format
 * e.g., 90 -> "1h 30m", 45 -> "45m"
 */
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
};

/**
 * Calculate total time for an array of micro-goals
 */
export const calculateTotalMinutes = (goals: Array<{ estimated_minutes: number }>): number => {
  return goals.reduce((total, goal) => total + goal.estimated_minutes, 0);
};
