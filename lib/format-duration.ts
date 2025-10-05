/**
 * Formats a duration in minutes to a human-readable string.
 * For durations >= 60 minutes, displays in hours and minutes.
 * For durations < 60 minutes, displays in minutes only.
 *
 * @param minutes - The duration in minutes
 * @returns A formatted string (e.g., "45mins", "1hr 30mins", "2hrs 5mins")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min${minutes !== 1 ? "s" : ""}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const hoursText = `${hours}hr${hours !== 1 ? "s" : ""}`;

  if (remainingMinutes === 0) {
    return hoursText;
  }

  const minutesText = `${remainingMinutes}min${
    remainingMinutes !== 1 ? "s" : ""
  }`;
  return `${hoursText} ${minutesText}`;
}
