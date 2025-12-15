/**
 * Utility functions for calculating and managing user streaks
 * A streak is the number of consecutive days with at least one submission
 */

/**
 * Calculate current streak from submission dates
 * @param {Array} submissions - Array of submission objects with submitted_at/submission_date
 * @returns {Object} - Streak info including current streak, max streak, and last submission date
 */
export const calculateStreak = (submissions = []) => {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    return {
      currentStreak: 0,
      maxStreak: 0,
      lastSubmissionDate: null,
      streakDates: []
    };
  }

  // Extract unique dates from submissions (ignore time, only care about date)
  const dates = submissions
    .map(s => {
      const submittedDate = s.submitted_at || s.submission_date || s.created_at;
      if (!submittedDate) return null;
      
      // Parse the date and get just the date part (YYYY-MM-DD)
      const date = new Date(submittedDate);
      if (isNaN(date.getTime())) return null;
      
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    })
    .filter(Boolean);

  // Remove duplicates and sort in descending order
  const uniqueDates = [...new Set(dates)].sort().reverse();

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      maxStreak: 0,
      lastSubmissionDate: null,
      streakDates: []
    };
  }

  // Calculate streaks by checking consecutive days
  let currentStreak = 0;
  let maxStreak = 0;
  let currentStreakDates = [];
  let lastDate = null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDates.length; i++) {
    const currentDateString = uniqueDates[i];
    const currentDate = new Date(currentDateString);

    if (lastDate === null) {
      // First iteration
      // Check if last submission is today or yesterday (to handle timezone)
      const daysDiff = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        currentStreak = 1;
        currentStreakDates = [currentDateString];
      } else {
        // Break in streak
        currentStreak = 0;
      }
    } else {
      // Check if this date is exactly 1 day before the last date
      const daysDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        currentStreak++;
        currentStreakDates.push(currentDateString);
      } else {
        // Streak broken
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        currentStreak = 1;
        currentStreakDates = [currentDateString];
      }
    }

    lastDate = currentDate;
  }

  // Check final streak
  if (currentStreak > maxStreak) {
    maxStreak = currentStreak;
  }

  // Verify current streak is still active (last submission was today or yesterday)
  if (uniqueDates.length > 0) {
    const lastSubmissionDate = new Date(uniqueDates[0]);
    const daysSinceLastSubmission = Math.floor((today - lastSubmissionDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastSubmission > 1) {
      currentStreak = 0;
      currentStreakDates = [];
    }
  }

  return {
    currentStreak: Math.max(currentStreak, 0),
    maxStreak: Math.max(maxStreak, 0),
    lastSubmissionDate: uniqueDates.length > 0 ? uniqueDates[0] : null,
    streakDates: currentStreakDates,
    allUniqueSubmissionDates: uniqueDates
  };
};

/**
 * Check if user has already solved a question
 * @param {number} questionId - Question ID
 * @param {Array} submissions - Array of submission objects
 * @returns {boolean} - True if user has a successful submission
 */
export const hasUserSolvedQuestion = (questionId, submissions = []) => {
  return submissions.some(
    s => s.question_id === questionId && s.passed === true
  );
};

/**
 * Get first successful submission date for a question
 * @param {number} questionId - Question ID
 * @param {Array} submissions - Array of submission objects
 * @returns {string|null} - Date of first successful submission or null
 */
export const getFirstSuccessfulSubmissionDate = (questionId, submissions = []) => {
  const successful = submissions.filter(
    s => s.question_id === questionId && s.passed === true
  );

  if (successful.length === 0) return null;

  // Sort by date ascending to get the first one
  successful.sort((a, b) => {
    const dateA = new Date(a.submitted_at || a.submission_date);
    const dateB = new Date(b.submitted_at || b.submission_date);
    return dateA - dateB;
  });

  return successful[0].submitted_at || successful[0].submission_date;
};

/**
 * Count unique questions solved (first successful submission only)
 * @param {Array} submissions - Array of submission objects
 * @returns {number} - Number of unique questions solved
 */
export const countUniqueSolvedQuestions = (submissions = []) => {
  const solvedQuestions = new Set();
  
  // For each unique question, track if it has been solved
  const questionMap = {};
  
  submissions
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
    .forEach(submission => {
      const qId = submission.question_id;
      
      // Only count the first successful submission per question
      if (!questionMap[qId]) {
        questionMap[qId] = submission;
        if (submission.passed) {
          solvedQuestions.add(qId);
        }
      }
    });

  return solvedQuestions.size;
};

/**
 * Format streak info for display
 * @param {number} streak - Current streak number
 * @returns {string} - Formatted streak message
 */
export const formatStreakMessage = (streak) => {
  if (streak === 0) {
    return 'Start a new streak today!';
  }
  if (streak === 1) {
    return 'You are on a 1 day streak! 🔥';
  }
  if (streak < 7) {
    return `You are on a ${streak} day streak! 🔥`;
  }
  if (streak < 30) {
    return `Incredible! ${streak} days streak! 🔥🔥`;
  }
  if (streak < 100) {
    return `Amazing! ${streak} days streak! 🔥🔥🔥`;
  }
  return `LEGENDARY! ${streak} days streak! 🔥🔥🔥🔥`;
};
