import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSheets, getUserSheetProgress } from '../services/sheetsService';

const Sheets = ({ user }) => {
  const [sheets, setSheets] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sheetsData = await getSheets();
      setSheets(Array.isArray(sheetsData) ? sheetsData : []);

      if (user) {
        const progressData = await getUserSheetProgress();
        setUserProgress(progressData.progress || []);
      }
    } catch (err) {
      setError('Failed to load sheets. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSheets = sheets.filter(sheet => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'featured') return sheet.is_featured;
    return sheet.category === activeFilter;
  });

  const activeSheets = userProgress.filter(p => !p.completed_at);
  const completedSheets = userProgress.filter(p => p.completed_at);

  const getProgressPercentage = (progressItem) => {
    if (!progressItem.total_problems) return 0;
    return Math.round((progressItem.solved_problems / progressItem.total_problems) * 100);
  };

  const getSheetStatus = (sheetId) => {
    const progress = userProgress.find(p => p.sheet_id === sheetId);
    if (!progress) return 'not-started';
    if (progress.completed_at) return 'completed';
    return 'in-progress';
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'beginner':
        return '🎯';
      case 'interview':
        return '🏢';
      case 'topic':
        return '📚';
      case 'company':
        return '💼';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Sheets</h1>
          <p className="text-gray-600">Complete curated problem sets to master specific topics and patterns</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📚 All Sheets
            </button>
            <button
              onClick={() => setActiveFilter('featured')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === 'featured'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔥 Featured
            </button>
            <button
              onClick={() => setActiveFilter('beginner')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === 'beginner'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎯 Beginner
            </button>
            <button
              onClick={() => setActiveFilter('interview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === 'interview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏢 Interview
            </button>
            <button
              onClick={() => setActiveFilter('topic')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === 'topic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📖 Topic
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Your Active Sheets */}
        {user && activeSheets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Active Sheets ({activeSheets.length})</h2>
            <div className="space-y-3">
              {activeSheets.map((progress) => {
                const percentage = getProgressPercentage(progress);
                return (
                  <Link
                    key={progress.id}
                    to={`/practice/sheets/${progress.sheet_id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{progress.sheet_title}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            {progress.solved_problems}/{progress.total_problems} completed
                          </span>
                          <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-blue-600">{percentage}%</span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-4">
                        Continue
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* All Sheets */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {activeFilter === 'all' ? 'All Sheets' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Sheets`} ({filteredSheets.length})
          </h2>
          {filteredSheets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No sheets found</h3>
              <p className="text-gray-500">Try a different filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSheets.map((sheet) => {
                const status = getSheetStatus(sheet.id);
                const progress = userProgress.find(p => p.sheet_id === sheet.id);
                const percentage = progress ? getProgressPercentage(progress) : 0;

                return (
                  <div key={sheet.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCategoryIcon(sheet.category)}</span>
                          {sheet.is_featured && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              🔥 Featured
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(sheet.difficulty_level)}`}>
                          {sheet.difficulty_level || 'mixed'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2">{sheet.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{sheet.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>📝 {sheet.total_problems} problems</span>
                        {sheet.estimated_hours && <span>⏱️ ~{sheet.estimated_hours}h</span>}
                        {sheet.users_started > 0 && <span>👥 {sheet.users_started} started</span>}
                      </div>

                      {status === 'in-progress' && progress && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Your Progress</span>
                            <span className="font-medium text-blue-600">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <Link
                        to={`/practice/sheets/${sheet.id}`}
                        className={`block text-center px-4 py-2 rounded-lg font-medium transition-colors ${
                          status === 'completed'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : status === 'in-progress'
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {status === 'completed' ? '✓ Completed' : status === 'in-progress' ? 'Continue' : 'Start Sheet'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sheets;
