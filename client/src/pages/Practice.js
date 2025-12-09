import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getQuestions } from '../services/questionService';
import { getUserSubmissions } from '../services/submissionService';

const DEFAULT_TAGS = [
  'array',
  'hash table',
  'string',
  'linked list',
  'tree',
  'graph',
  'dynamic programming',
  'sorting',
  'recursion',
  'binary search',
  'two pointers',
  'sliding window',
  'stack',
  'queue',
  'heap',
  'greedy',
  'backtracking',
  'math',
  'bit manipulation'
];

const Practice = ({ user }) => {
  const [questions, setQuestions] = useState([]);
  const [availableTags, setAvailableTags] = useState(DEFAULT_TAGS);
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    tag: '',
    status: '' // all, solved, unsolved
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10000, // Display all questions
    total: 0
  });
  const [userSubmissions, setUserSubmissions] = useState(new Map());
  const [stats, setStats] = useState({
    total: 0,
    solved: 0,
    attempted: 0
  });

  // Fetch user submissions for progress tracking
  const fetchUserSubmissions = useCallback(async () => {
    if (!user) return;
    
    try {
      const submissions = await getUserSubmissions();
      const submissionMap = new Map();
      let solvedCount = 0;
      let attemptedCount = 0;
      
      submissions.forEach(sub => {
        const questionId = sub.question_id;
        const existing = submissionMap.get(questionId);
        
        if (!existing || sub.submitted_at > existing.submitted_at) {
          submissionMap.set(questionId, sub);
        }
        
        if (sub.passed) solvedCount++;
        attemptedCount++;
      });
      
      setUserSubmissions(submissionMap);
      setStats(prev => ({
        ...prev,
        solved: solvedCount,
        attempted: attemptedCount
      }));
    } catch (err) {
      console.error('Failed to fetch user submissions:', err);
    }
  }, [user]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      };
      
      const data = await getQuestions(params);
      let questionsData = data?.questions || [];
      questionsData.sort((a, b) => {
        const idA = Number(a.id) || 0;
        const idB = Number(b.id) || 0;
        return idA - idB;
      });
      const totalFromServer = data?.total ?? questionsData.length;

      // Filter by submission status if needed
      if (filters.status && user) {
        questionsData = questionsData.filter(q => {
          const submission = userSubmissions.get(q.id);
          if (filters.status === 'solved') {
            return submission && submission.passed;
          } else if (filters.status === 'unsolved') {
            return !submission || !submission.passed;
          }
          return true;
        });
      }
      
      setQuestions(questionsData);
      setPagination(prev => ({
        ...prev,
        total: totalFromServer
      }));
      setStats(prev => ({
        ...prev,
        total: totalFromServer
      }));

      const tagsSet = new Set(DEFAULT_TAGS);
      questionsData.forEach(question => {
        if (Array.isArray(question.tags)) {
          question.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAvailableTags(Array.from(tagsSet).sort());
      setError('');
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Questions fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, searchTerm, userSubmissions, user]);

  useEffect(() => {
    fetchUserSubmissions();
  }, [fetchUserSubmissions]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    const handleProgressUpdate = async () => {
      await fetchUserSubmissions();
      await fetchQuestions();
    };

    const refreshIfNeeded = async () => {
      const needsRefresh = localStorage.getItem('practiceNeedsRefresh');
      if (needsRefresh) {
        await handleProgressUpdate();
        localStorage.removeItem('practiceNeedsRefresh');
      }
    };

    refreshIfNeeded();
    window.addEventListener('practiceProgressUpdated', handleProgressUpdate);

    return () => {
      window.removeEventListener('practiceProgressUpdated', handleProgressUpdate);
    };
  }, [fetchUserSubmissions, fetchQuestions]);

  useEffect(() => {
    let filtered = [...questions].sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idA - idB;
    });

    if (filters.difficulty) {
      filtered = filtered.filter(question => (question.difficulty || '').toLowerCase() === filters.difficulty.toLowerCase());
    }

    if (filters.tag) {
      filtered = filtered.filter(question => Array.isArray(question.tags) && question.tags.map(tag => tag.toLowerCase()).includes(filters.tag.toLowerCase()));
    }

    if (filters.status && user) {
      filtered = filtered.filter(question => {
        const submission = userSubmissions.get(question.id);
        if (filters.status === 'solved') {
          return submission?.passed;
        }
        if (filters.status === 'unsolved') {
          return !submission || !submission.passed;
        }
        return true;
      });
    }

    const trimmedSearch = searchTerm.trim();
    const isNumericSearch = /^\d+$/.test(trimmedSearch);

    if (trimmedSearch) {
      const needle = trimmedSearch.toLowerCase();
      const searchNumber = isNumericSearch ? parseInt(trimmedSearch, 10) : null;

      filtered = filtered.filter((question) => {
        const titleMatch = question.title?.toLowerCase().includes(needle);
        const descriptionText = question.description?.replace(/<[^>]*>/g, '').toLowerCase();
        const descriptionMatch = descriptionText?.includes(needle);
        const tagMatch = Array.isArray(question.tags) && question.tags.some(tag => tag.toLowerCase().includes(needle));
        const idMatch = isNumericSearch && question.id === searchNumber;
        const idContains = question.id != null && question.id.toString().includes(trimmedSearch);
        return titleMatch || descriptionMatch || tagMatch || idMatch || (isNumericSearch && idContains);
      });
    }

    const annotated = filtered.map((question) => ({
      question,
      displayNumber: question.id
    }));

    const solvedCount = annotated.filter(({ question }) => {
      const submission = userSubmissions.get(question.id);
      return submission?.passed;
    }).length;

    const attemptedCount = annotated.filter(({ question }) => {
      const submission = userSubmissions.get(question.id);
      return submission && !submission.passed;
    }).length;

    const totalFiltered = annotated.length;

    setStats(prev => ({
      ...prev,
      total: totalFiltered,
      solved: solvedCount,
      attempted: attemptedCount
    }));

    // Display all questions without pagination
    setDisplayedQuestions(annotated);

  }, [questions, searchTerm, filters, pagination.page, pagination.limit, userSubmissions, user]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      difficulty: '',
      tag: '',
      status: ''
    });
  };

  const getSubmissionStatus = (questionId) => {
    const submission = userSubmissions.get(questionId);
    if (!submission) return 'not-attempted';
    return submission.passed ? 'solved' : 'attempted';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionButtonClass = (status) => {
    if (status === 'solved') {
      return 'status-button status-button--solved';
    }
    if (status === 'attempted') {
      return 'status-button status-button--continue';
    }
    return 'status-button status-button--solve';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice</h1>
          <p className="text-gray-600">Solve coding problems to improve your programming skills</p>
          
          {user && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Total</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Solved</div>
                <div className="text-2xl font-bold text-green-700">{stats.solved}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-sm text-yellow-600 mb-1">Attempted</div>
                <div className="text-2xl font-bold text-yellow-700">{stats.attempted}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Accuracy</div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Difficulty */}
            <select
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            
            {/* Topic */}
            <select
              name="tag"
              value={filters.tag}
              onChange={handleFilterChange}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-[180px]"
            >
              <option value="">All Topics</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>
            
            {/* Status */}
            {user && (
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="">All Status</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
              </select>
            )}
            
            {/* Clear Button */}
            {(searchTerm || filters.difficulty || filters.tag || filters.status) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
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
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Problems Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {user && <th scope="col" className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Problem</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Difficulty</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Topics</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Platforms</th>
                      <th scope="col" className="w-32 px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedQuestions.length > 0 ? (
                      displayedQuestions.map(({ question, displayNumber }) => {
                        const status = getSubmissionStatus(question.id);
                        return (
                          <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                            {/* Status Icon */}
                            {user && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                {status === 'solved' && (
                                  <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                {status === 'attempted' && (
                                  <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full">
                                    <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                                  </div>
                                )}
                                {status === 'not-attempted' && (
                                  <div className="flex items-center justify-center w-6 h-6">
                                    <div className="w-2.5 h-2.5 border-2 border-gray-300 rounded-full"></div>
                                  </div>
                                )}
                              </td>
                            )}
                            
                            {/* Problem Title */}
                            <td className="px-6 py-4">
                              <Link 
                                to={`/practice/${question.id}`} 
                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                              >
                                {question.title}
                              </Link>
                            </td>
                            
                            {/* Difficulty */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                question.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                                question.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                question.difficulty?.toLowerCase() === 'hard' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {question.difficulty}
                              </span>
                            </td>
                            
                            {/* Tags */}
                            <td className="px-6 py-4 hidden md:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {question.tags && Array.isArray(question.tags) && question.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                    {tag}
                                  </span>
                                ))}
                                {question.tags && question.tags.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                                    +{question.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Platform Links */}
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                {question.leetcode_url && (
                                  <a
                                    href={question.leetcode_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors group"
                                    title="LeetCode"
                                  >
                                    <img 
                                      src="https://img.icons8.com/?size=100&id=wDGo581Ea5Nf&format=png&color=000000" 
                                      alt="LeetCode"
                                      className="w-5 h-5"
                                    />
                                  </a>
                                )}
                                {question.geeksforgeeks_url && (
                                  <a
                                    href={question.geeksforgeeks_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group"
                                    title="GeeksforGeeks"
                                  >
                                    <img 
                                      src="https://img.icons8.com/?size=100&id=AbQBhN9v62Ob&format=png&color=000000" 
                                      alt="GeeksforGeeks"
                                      className="w-5 h-5"
                                    />
                                  </a>
                                )}
                                {question.other_platform_url && (
                                  <a
                                    href={question.other_platform_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-2 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-xs font-medium text-blue-700"
                                    title={question.other_platform_name || "Other Platform"}
                                  >
                                    {question.other_platform_name ? (
                                      question.other_platform_name.length > 8 
                                        ? question.other_platform_name.substring(0, 8) + '...'
                                        : question.other_platform_name
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    )}
                                  </a>
                                )}
                                {!question.leetcode_url && !question.geeksforgeeks_url && !question.other_platform_url && (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                            
                            {/* Action Button */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Link 
                                to={`/practice/${question.id}`} 
                                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  status === 'solved' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                  status === 'attempted' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                                  'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                {status === 'solved' ? 'Solved' : status === 'attempted' ? 'Continue' : 'Solve'}
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={user ? 6 : 5} className="px-6 py-12 text-center">
                          <div className="text-gray-400 mb-2">
                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No problems found</h3>
                          <p className="text-gray-500 mb-4">Try adjusting your filters</p>
                          {(searchTerm || filters.difficulty || filters.tag || filters.status) && (
                            <button
                              onClick={clearFilters}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Clear All Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination - Removed as all questions are displayed */}
          </>
        )}
      </div>
    </div>
  );
};

export default Practice;
