import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { updateProfile } from '../services/authService';
import { getUserStats, getUserSubmissions } from '../services/questionService';
import { getUserQuizStats, getUserQuizSubmissions } from '../services/quizService';
import { calculateStreak } from '../utils/streakUtils';
import { getStreakBadge } from '../utils/scoringSystem';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    solvedProblems: 0,
    completedQuizzes: 0,
    totalScore: 0,
    streak: 0,
    streakInfo: null
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUserStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both submission and quiz stats in parallel
      const [submissionStats, quizStats, submissionData] = await Promise.all([
        getUserStats().catch(() => ({ total: 0, passed: 0, averageScore: 0 })),
        getUserQuizStats().catch(() => ({ total: 0, averageScore: 0 })),
        getUserSubmissions({ limit: 1000 }).catch(() => ({ submissions: [] }))
      ]);

      // Calculate streak from submission data
      const streakData = calculateStreak(submissionData.submissions || []);
      const streakBadge = getStreakBadge(streakData.currentStreak);

      setStats({
        solvedProblems: submissionStats.passed || 0,
        completedQuizzes: quizStats.total || 0,
        totalScore: submissionStats.totalPoints || 0,
        streak: streakData.currentStreak || 0,
        streakInfo: { data: streakData, badge: streakBadge }
      });
    } catch (err) {
      console.error('Error fetching user stats:', err);
      // Set default values on error
      setStats({
        solvedProblems: 0,
        completedQuizzes: 0,
        totalScore: 0,
        streak: 0,
        streakInfo: null
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      // Fetch recent submissions and quiz submissions
      const [submissions, quizSubmissions] = await Promise.all([
        getUserSubmissions({ limit: 5 }).catch(() => ({ submissions: [] })),
        getUserQuizSubmissions().catch(() => ({ submissions: [] }))
      ]);

      // Combine and format the activities
      const activities = [];
      
      // Add coding submissions
      if (submissions.submissions) {
        submissions.submissions.forEach(submission => {
          activities.push({
            id: submission.question_id,
            type: 'problem',
            title: submission.question_title || submission.title || `Problem ${submission.question_id}`,
            date: submission.submitted_at,
            status: submission.passed ? 'solved' : 'attempted'
          });
        });
      }

      // Add quiz submissions
      if (quizSubmissions.submissions) {
        quizSubmissions.submissions.forEach(submission => {
          activities.push({
            id: submission.quiz_id,
            type: 'quiz',
            title: submission.quiz_title || submission.title || `Quiz ${submission.quiz_id}`,
            date: submission.submitted_at,
            status: 'completed',
            score: submission.score,
            totalQuestions: submission.total_questions
          });
        });
      }

      // Sort by date (most recent first) and take top 5
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(activities.slice(0, 5));
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      setRecentActivity([]);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchRecentActivity();
    }
  }, [user, fetchUserStats, fetchRecentActivity]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      await updateProfile(profileForm);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.toString());
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!user) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded" role="alert">
        <span className="block sm:inline">Please log in to view your dashboard.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent dark:from-blue-300 dark:to-cyan-300">Dashboard</h1>
        <p className="text-muted mt-1">Welcome back, {user?.name || 'User'}! Track your progress and achievements.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats cards with premium styling */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-l-4 border-blue-500 dark:border-blue-400 hover:shadow-lg transition-all animate-shine">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide mb-1">Problems Solved</div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">{stats.solvedProblems}</div>
            </div>
            <svg className="w-10 h-10 text-blue-200 dark:text-blue-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">Keep practicing to improve!</div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-l-4 border-emerald-500 dark:border-emerald-400 hover:shadow-lg transition-all animate-shine">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide mb-1">Quizzes Completed</div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">{stats.completedQuizzes}</div>
            </div>
            <svg className="w-10 h-10 text-emerald-200 dark:text-emerald-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75-3.54-4.04 5.25h5.79z"/>
            </svg>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">Challenge yourself with more quizzes</div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-l-4 border-purple-500 dark:border-purple-400 hover:shadow-lg transition-all animate-shine">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide mb-1">Coding Points</div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{stats.totalScore}</div>
            </div>
            <svg className="w-10 h-10 text-purple-200 dark:text-purple-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">Average score across all activities</div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-l-4 border-orange-500 dark:border-orange-400 hover:shadow-lg transition-all animate-shine">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide mb-1">Day Streak</div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">{stats.streak}</div>
              {stats.streakInfo?.badge && (
                <div className="text-xs mt-2 flex items-center gap-2">
                  <span className="text-lg">{stats.streakInfo.badge.icon}</span>
                  <span className="font-semibold" style={{ color: stats.streakInfo.badge.color }}>
                    {stats.streakInfo.badge.label}
                  </span>
                </div>
              )}
            </div>
            <svg className="w-10 h-10 text-orange-200 dark:text-orange-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1v22m11-11H1"/>
            </svg>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            {stats.streak > 0 ? "Keep the momentum going! 🔥" : "Start solving to build your streak!"}
          </div>
          {stats.streakInfo?.data?.maxStreak > 0 && stats.streakInfo.data.maxStreak !== stats.streak && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Personal best: {stats.streakInfo.data.maxStreak} days 🎯
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-2 border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-4">Recent Activity</h2>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Link 
                          to={activity.type === 'problem' ? `/practice/${activity.id}` : `/quizzes/${activity.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-lg transition-colors"
                        >
                          {activity.title}
                        </Link>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.292 13.293a8 8 0 11-11.586 0"/>
                          </svg>
                          {formatDate(activity.date)}
                          <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {activity.type === 'problem' ? 'Coding' : 'Quiz'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {activity.status === 'solved' && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
                            ✓ Solved
                          </span>
                        )}
                        {activity.status === 'attempted' && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                            ○ Attempted
                          </span>
                        )}
                        {activity.status === 'completed' && (
                          <div className="flex flex-col items-end gap-2">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
                              ✓ Completed
                            </span>
                            {typeof activity.score === 'number' && typeof activity.totalQuestions === 'number' && (
                              <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                                {activity.score}/{activity.totalQuestions}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No recent activity. Start solving problems or taking quizzes!</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3">
              <Link 
                to="/practice"
                className="flex-1 text-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}
              >
                Practice Problems
              </Link>
              <Link 
                to="/quizzes"
                className="flex-1 text-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}
              >
                Take Quizzes
              </Link>
            </div>
          </div>
        </div>
        
        {/* Profile section */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border-2 border-purple-200 dark:border-purple-800">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4">Profile</h2>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 dark:bg-green-900 dark:bg-opacity-30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          <form onSubmit={handleProfileSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all"
                id="name"
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all"
                id="email"
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <button
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={updating}
              style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)' }}
            >
              {updating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;