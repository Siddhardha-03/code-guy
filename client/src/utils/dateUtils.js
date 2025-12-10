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
  if (mysqlDateTime === null || mysqlDateTime === undefined) return null;

  // Allow passing Date instances or numeric timestamps directly
  if (mysqlDateTime instanceof Date) {
    const d = new Date(mysqlDateTime.getTime());
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof mysqlDateTime === 'number') {
    const d = new Date(mysqlDateTime);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof mysqlDateTime !== 'string') return null;

  // 1) Try native parsing (handles ISO strings with timezone offsets)
  const direct = new Date(mysqlDateTime);
  if (!isNaN(direct.getTime())) return direct;

  // 2) Fallback for MySQL-style "YYYY-MM-DD HH:MM:SS"
  const normalized = new Date(mysqlDateTime.replace(' ', 'T') + 'Z');
  if (!isNaN(normalized.getTime())) return normalized;

  return null;
};

/**
 * Format MySQL datetime for display in user's local timezone
 * @param {string} mysqlDateTime - MySQL datetime string
 * @returns {string} Formatted date string in local timezone
 */
export const formatMySQLDateTime = (mysqlDateTime) => {
  if (!mysqlDateTime) return 'N/A';
  const utcDate = parseMySQLDateTimeAsUTC(mysqlDateTime);
  if (!utcDate) return 'Invalid date';

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
  const parsed = parseMySQLDateTimeAsUTC(mysqlDateTime);
  if (!parsed) return null;

  const diff = parsed.getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
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

  if (!start || !end) {
    return { status: 'invalid', notStarted: false, ended: false };
  }

  if (now < start) {
    return { status: 'upcoming', notStarted: true, ended: false };
  }

  if (now > end) {
    return { status: 'ended', notStarted: false, ended: true };
  }

  return { status: 'active', notStarted: false, ended: false };
};