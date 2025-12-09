import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes } from '../services/quizService';

const Quiz = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const data = await getQuizzes(params);
      setQuizzes(data.quizzes);
      setPagination(prev => ({
        ...prev,
        total: data.total
      }));
    } catch (err) {
      setError('Failed to load quizzes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuizzes();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">Coding Quizzes</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Test your knowledge with our collection of programming quizzes.</p>
      </div>
      
      {/* Filters */}
      <div className="bg-transparent dark:bg-transparent border-2 border-blue-200 dark:border-blue-700 p-6 rounded-xl shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 justify-center">
          <div className="w-full md:w-auto">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by title or description"
                className="w-full md:w-72 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Search
              </button>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="algorithms">Algorithms</option>
              <option value="data-structures">Data Structures</option>
              <option value="web-development">Web Development</option>
            </select>
          </div>
        </form>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Quizzes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-stretch">
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="card overflow-hidden hover:shadow-xl transition-all border-2 border-premium-glow animate-glow">
                  <div className="p-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">{quiz.title}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{quiz.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="font-medium">{quiz.duration || 60} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>\n                        </svg>
                        <span className="font-medium">{quiz.questionCount} Q</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {quiz.category && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                          {quiz.category}
                        </span>
                      )}
                      {quiz.userStatus && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          quiz.userStatus === 'completed' ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' : 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'}`}
                        >
                          {quiz.userStatus === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      )}
                      {typeof quiz.bestScore === 'number' && typeof quiz.questionCount === 'number' && quiz.bestScore > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                          {quiz.bestScore}/{quiz.questionCount}
                        </span>
                      )}
                      {quiz.attemptsCount && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
                          {quiz.attemptsCount} {quiz.attemptsCount > 1 ? 'attempts' : 'attempt'}
                        </span>
                      )}
                    </div>
                    
                    <Link 
                      to={`/quizzes/${quiz.id}`} 
                      className="block w-full text-center px-4 py-3 border border-transparent text-sm font-extrabold rounded-lg shadow-md text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 transition-all"
                    >
                      {quiz.userStatus === 'completed' ? 'Retake Quiz' : quiz.userStatus === 'in_progress' ? 'Continue Quiz' : 'Start Quiz'}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No quizzes found matching your criteria.</p>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {quizzes.length > 0 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded-md border border-blue-200 bg-gray-50 bg-opacity-30 text-gray-700 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  className="px-3 py-1 rounded-md border border-blue-200 bg-gray-50 bg-opacity-30 text-gray-700 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Quiz;