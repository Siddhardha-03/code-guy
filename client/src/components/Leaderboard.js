import React, { useState, useEffect, useCallback } from 'react';
import { getLeaderboard, getRecentActivity } from '../services/adminService';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching leaderboard data for tab:', activeTab);
      const data = await getLeaderboard(activeTab, 15);
      console.log('Received leaderboard data:', data);
      setLeaderboardData(data || {});
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(`Failed to load leaderboard data: ${err.toString()}`);
      setLeaderboardData({});
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchRecentActivity = useCallback(async () => {
    try {
      console.log('Fetching recent activity...');
      const data = await getRecentActivity(15);
      console.log('Received recent activity:', data);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      console.error('Failed to load recent activity:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRankBadge = (rank) => {
    const baseClasses = 'inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm';
    switch (rank) {
      case 1: return <div className={`${baseClasses} bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg`}>1</div>;
      case 2: return <div className={`${baseClasses} bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg`}>2</div>;
      case 3: return <div className={`${baseClasses} bg-gradient-to-br from-orange-300 to-orange-600 shadow-lg`}>3</div>;
      default: return <div className={`${baseClasses} bg-gradient-to-br from-blue-400 to-blue-600`}>{rank}</div>;
    }
  };

  const renderQuizLeaderboard = () => {
    if (!leaderboardData.quiz || leaderboardData.quiz.length === 0) {
      return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No quiz data available</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-transparent border-b-2 border-blue-300 dark:border-blue-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Avg Score</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Quizzes</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Best Score</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Attempts</th>
            </tr>
          </thead>
          <tbody className="bg-transparent dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboardData.quiz.map((user, index) => (
              <tr key={user.id} className={`hover:bg-blue-900 dark:hover:bg-blue-900/30 transition ${index < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-400' : 'border-l-4 border-transparent'}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {getRankBadge(index + 1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-800 dark:text-green-200">
                    {user.avg_score}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user.quizzes_completed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-800 dark:text-purple-200">
                    {user.highest_score}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {user.total_attempts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCodingLeaderboard = () => {
    if (!leaderboardData.coding || leaderboardData.coding.length === 0) {
      return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No coding data available</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-transparent border-b-2 border-green-300 dark:border-green-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Points</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Solved</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Attempted</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Success Rate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Submissions</th>
            </tr>
          </thead>
          <tbody className="bg-transparent dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboardData.coding.map((user, index) => (
              <tr key={user.id} className={`hover:bg-green-900 dark:hover:bg-green-900/30 transition ${index < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-400' : 'border-l-4 border-transparent'}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {getRankBadge(index + 1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-800 dark:text-purple-200">
                    🏆 {user.total_points}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 text-blue-800 dark:text-blue-200">
                    {user.problems_solved}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user.problems_attempted}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                    user.success_rate >= 70 ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-800 dark:text-green-200' : 
                    user.success_rate >= 50 ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-800 dark:text-yellow-200' : 
                    'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 text-red-800 dark:text-red-200'
                  }`}>
                    {user.success_rate}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {user.total_submissions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOverallStats = () => {
    if (!leaderboardData.stats) return null;

    const statCards = [
      { value: leaderboardData.stats.total_active_users, label: 'Active Users', borderColor: 'border-l-4 border-blue-500 dark:border-blue-400', textColor: 'text-blue-700 dark:text-blue-300' },
      { value: leaderboardData.stats.total_quizzes, label: 'Total Quizzes', borderColor: 'border-l-4 border-green-500 dark:border-green-400', textColor: 'text-green-700 dark:text-green-300' },
      { value: leaderboardData.stats.total_questions, label: 'Coding Questions', borderColor: 'border-l-4 border-purple-500 dark:border-purple-400', textColor: 'text-purple-700 dark:text-purple-300' },
      { value: leaderboardData.stats.total_submissions, label: 'Total Submissions', borderColor: 'border-l-4 border-orange-500 dark:border-orange-400', textColor: 'text-orange-700 dark:text-orange-300' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`bg-transparent dark:bg-transparent p-6 rounded-lg shadow-md hover:shadow-lg transition ${stat.borderColor} border-t border-r border-b border-gray-200 dark:border-gray-700`}>
            <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
            <div className={`text-sm font-semibold ${stat.textColor} mt-2`}>{stat.label}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecentActivity = () => {
    if (recentActivity.length === 0) {
      return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No recent activity</div>;
    }

    return (
      <div className="space-y-3">
        {recentActivity.map((activity, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border-l-4 hover:shadow-md transition" style={{borderLeftColor: activity.activity_type === 'quiz' ? '#0e639c' : '#4ec9b0'}}>
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${
                activity.activity_type === 'quiz' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-green-400 to-emerald-400'
              }`}></div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {activity.user_name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {activity.activity_type === 'quiz' 
                    ? `Completed "${activity.quiz_title}" with score ${activity.score}`
                    : `${activity.passed ? 'Solved' : 'Attempted'} "${activity.question_title}"`
                  }
                </div>
              </div>
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
              {formatDate(activity.submitted_at)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-gray-600 border-t-4 border-t-blue-500 dark:border-t-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-4 rounded-lg font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Leaderboard</h1>
        <button
          onClick={fetchLeaderboardData}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition"
        >
          Refresh
        </button>
      </div>

      {activeTab === 'overall' && renderOverallStats()}

      <div className="bg-transparent dark:bg-transparent shadow-lg rounded-xl border-2 border-blue-200 dark:border-blue-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {['overall', 'quiz', 'coding'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition ${
                  activeTab === tab
                    ? 'border-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab === 'overall' ? 'Overall' : tab === 'quiz' ? 'Quiz Champions' : 'Coding Masters'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overall' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">Quiz Champions</h3>
                {renderQuizLeaderboard()}
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">Coding Masters</h3>
                {renderCodingLeaderboard()}
              </div>
            </div>
          )}
          {activeTab === 'quiz' && renderQuizLeaderboard()}
          {activeTab === 'coding' && renderCodingLeaderboard()}
        </div>
      </div>

      <div className="bg-transparent dark:bg-transparent shadow-lg rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">Recent Activity</h3>
        {renderRecentActivity()}
      </div>
    </div>
  );
};

export default Leaderboard;
