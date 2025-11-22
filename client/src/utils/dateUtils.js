/**
 * Utility functions for handling MySQL datetime format with timezone consistency
 * Handles Singapore backend deployed in different timezone than frontend
 */

/**
 * Parse MySQL datetime string as UTC
 * Converts "2025-11-22 15:54:00" to proper Date object treating it as UTC
 * @param {string} mysqlDateTime - MySQL datetime string (YYYY-MM-DD HH:MM:SS)
 * @returns {Date} Date object parsed as UTC
 */
export const parseMySQLDateTimeAsUTC = (mysqlDateTime) => {
  if (!mysqlDateTime) return null;
  return new Date(mysqlDateTime.replace(' ', 'T') + 'Z');
};

/**
 * Format MySQL datetime for display in user's local timezone
 * @param {string} mysqlDateTime - MySQL datetime string
 * @returns {string} Formatted date string in local timezone
 */
export const formatMySQLDateTime = (mysqlDateTime) => {
  if (!mysqlDateTime) return 'N/A';
  const utcDate = parseMySQLDateTimeAsUTC(mysqlDateTime);
  return utcDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Calculate time remaining until a MySQL datetime
 * @param {string} mysqlDateTime - MySQL datetime string
 * @returns {string|null} Formatted time remaining (e.g., "2h 30m") or null if past
 */
export const calculateTimeRemaining = (mysqlDateTime) => {
  if (!mysqlDateTime) return null;
  const endTimeUTC = parseMySQLDateTimeAsUTC(mysqlDateTime).getTime();
  const diff = endTimeUTC - Date.now();
  
  if (diff <= 0) return null;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

/**
 * Check if a contest is currently active based on start and end times
 * @param {string} startTime - MySQL datetime string for start
 * @param {string} endTime - MySQL datetime string for end
 * @returns {Object} Status object with timing information
 */
export const getContestStatus = (startTime, endTime) => {
  const now = new Date();
  const start = parseMySQLDateTimeAsUTC(startTime);
  const end = parseMySQLDateTimeAsUTC(endTime);
  
  if (now < start) {
    return { status: 'upcoming', notStarted: true, ended: false };
  }
  
  if (now > end) {
    return { status: 'ended', notStarted: false, ended: true };
  }
  
  return { status: 'active', notStarted: false, ended: false };
};