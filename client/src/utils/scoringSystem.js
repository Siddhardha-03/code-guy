/**
 * Scoring System for Code Submissions
 * Points based on difficulty level
 */

export const DIFFICULTY_SCORES = {
  'Easy': 10,
  'Medium': 25,
  'Hard': 50,
  'Expert': 100
};

export const STREAK_THRESHOLDS = {
  bronze: 3,      // 3 days
  silver: 7,      // 7 days (1 week)
  gold: 30,       // 30 days (1 month)
  platinum: 100   // 100 days
};

/**
 * Calculate points for a question based on difficulty
 * @param {string} difficulty - Question difficulty level
 * @returns {number} - Points earned
 */
export const calculatePoints = (difficulty) => {
  const points = DIFFICULTY_SCORES[difficulty] || DIFFICULTY_SCORES['Easy'];
  return points;
};

/**
 * Get streak badge based on consecutive days
 * @param {number} streak - Number of consecutive days
 * @returns {Object} - Badge info with color and label
 */
export const getStreakBadge = (streak) => {
  if (streak >= STREAK_THRESHOLDS.platinum) {
    return {
      level: 'platinum',
      label: 'Platinum Streak',
      color: 'from-cyan-400 to-blue-600',
      icon: '🏅',
      borderColor: 'border-cyan-500'
    };
  }
  if (streak >= STREAK_THRESHOLDS.gold) {
    return {
      level: 'gold',
      label: 'Gold Streak',
      color: 'from-yellow-400 to-yellow-600',
      icon: '🥇',
      borderColor: 'border-yellow-500'
    };
  }
  if (streak >= STREAK_THRESHOLDS.silver) {
    return {
      level: 'silver',
      label: 'Silver Streak',
      color: 'from-gray-300 to-gray-500',
      icon: '🥈',
      borderColor: 'border-gray-400'
    };
  }
  if (streak >= STREAK_THRESHOLDS.bronze) {
    return {
      level: 'bronze',
      label: 'Bronze Streak',
      color: 'from-orange-300 to-orange-600',
      icon: '🥉',
      borderColor: 'border-orange-500'
    };
  }
  return {
    level: 'none',
    label: 'Build a streak',
    color: 'from-gray-300 to-gray-500',
    icon: '🔥',
    borderColor: 'border-gray-400'
  };
};

/**
 * Get multiplier based on streak
 * @param {number} streak - Number of consecutive days
 * @returns {number} - Points multiplier (1.0 - 2.0)
 */
export const getStreakMultiplier = (streak) => {
  if (streak >= STREAK_THRESHOLDS.platinum) return 2.0;
  if (streak >= STREAK_THRESHOLDS.gold) return 1.75;
  if (streak >= STREAK_THRESHOLDS.silver) return 1.5;
  if (streak >= STREAK_THRESHOLDS.bronze) return 1.25;
  return 1.0;
};

/**
 * Calculate bonus points based on streak
 * @param {number} basePoints - Base points from difficulty
 * @param {number} streak - Number of consecutive days
 * @returns {number} - Total points with bonus
 */
export const calculatePointsWithStreakBonus = (basePoints, streak) => {
  const multiplier = getStreakMultiplier(streak);
  return Math.floor(basePoints * multiplier);
};
