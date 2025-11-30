/**
 * Utility functions for time formatting
 */

/**
 * Converts 24-hour time format (HH:MM) to 12-hour format with AM/PM
 * @param time - Time string in HH:MM format
 * @returns Formatted time string with AM/PM
 */
export const formatTimeToAMPM = (time: string): string => {
  if (!time) return "";

  const timeParts = time.split(":");
  if (timeParts.length < 2 || !timeParts[0] || !timeParts[1]) return time;

  const hours = timeParts[0];
  const minutes = timeParts[1];
  const hour24 = parseInt(hours, 10);

  if (isNaN(hour24)) return time;

  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? "PM" : "AM";

  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Converts 12-hour time format with AM/PM to 24-hour format (HH:MM)
 * @param time - Time string with AM/PM
 * @returns Time string in HH:MM format
 */
export const formatTimeFrom12To24 = (time: string): string => {
  if (!time) return "";

  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = time.match(timeRegex);

  if (!match) return time;

  const [, hours, minutes, ampm] = match;
  let hour24 = parseInt(hours, 10);

  if (ampm.toUpperCase() === "PM" && hour24 !== 12) {
    hour24 += 12;
  } else if (ampm.toUpperCase() === "AM" && hour24 === 12) {
    hour24 = 0;
  }

  return `${hour24.toString().padStart(2, "0")}:${minutes}`;
};
