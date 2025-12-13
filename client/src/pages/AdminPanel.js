import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { getUsers, getPlatformStats, deleteQuestion, deleteQuiz } from '../services/adminService';
import { getQuestions } from '../services/questionService';
import { getQuizzes } from '../services/quizService';
import QuestionForm from '../components/QuestionForm';
import QuizForm from '../components/QuizForm';
import Leaderboard from '../components/Leaderboard';
import ContestManager from '../components/admin/ContestManager';
import CreateContest from '../components/admin/CreateContest';
import ContestLeaderboard from '../components/admin/ContestLeaderboard';
import BulkQuestionUpload from '../components/admin/BulkQuestionUpload';
import SheetsManager from '../components/admin/SheetsManager';
import VideoLinkModal from '../components/admin/VideoLinkModal';
import TestCasesModal from '../components/admin/TestCasesModal';

const AdminPanel = ({ user }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname.split('/').pop();
    if (path === 'admin') {
      setActiveTab('dashboard');
    } else if (path === 'users') {
      setActiveTab('users');
    } else if (path === 'questions') {
      setActiveTab('questions');
    } else if (path === 'quizzes') {
      setActiveTab('quizzes');
    } else if (path === 'sheets') {
      setActiveTab('sheets');
    } else if (path === 'leaderboard') {
      setActiveTab('leaderboard');
    }
  }, [location]);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-300 dark:to-cyan-300 bg-clip-text text-transparent mb-8">Admin Panel</h1>
      
      <div className="card border-2 border-premium-glow overflow-hidden shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex bg-gradient-to-r from-transparent to-transparent dark:from-gray-900/20 dark:to-gray-900/20">
            <Link
              to="/admin"
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all ${activeTab === 'dashboard' ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all ${activeTab === 'users' ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </Link>
            <Link
              to="/admin/questions"
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all ${activeTab === 'questions' ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onClick={() => setActiveTab('questions')}
            >
              Questions
            </Link>
            <Link
              to="/admin/contests"
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all ${activeTab === 'contests' ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onClick={() => setActiveTab('contests')}
            >
              Contests
            </Link>
            <Link
              to="/admin/quizzes"
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all ${activeTab === 'quizzes' ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onClick={() => setActiveTab('quizzes')}
            >
              Quizzes
            </Link>
            <Link
              to="/admin/sheets"
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all ${activeTab === 'sheets' ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onClick={() => setActiveTab('sheets')}
            >
              Sheets
            </Link>
            <Link
              to="/admin/leaderboard"
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-all ${activeTab === 'leaderboard' ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              Leaderboard
            </Link>
          </nav>
        </div>
        
        <div className="p-8 bg-gray-50 dark:bg-transparent">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="questions" element={<QuestionsManagement />} />
            <Route path="quizzes" element={<QuizzesManagement />} />
            <Route path="contests" element={<ContestManager />} />
            <Route path="contests/create" element={<CreateContest />} />
            <Route path="contests/:contestId/leaderboard" element={<ContestLeaderboard />} />
            <Route path="sheets" element={<SheetsManager />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getPlatformStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load statistics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger rounded-lg shadow-md">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-muted">No statistics available</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Platform Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card border-l-4 border-l-blue-500 dark:border-l-blue-400 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all">
          <div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-300">{stats.totalUsers}</div>
            <div className="text-gray-600 dark:text-gray-400 font-medium mt-2">Total Users</div>
            <div className="text-sm text-muted mt-1">Registered users</div>
          </div>
        </div>
        
        <div className="card border-l-4 border-l-cyan-500 dark:border-l-cyan-400 hover:shadow-lg dark:hover:shadow-cyan-900/20 transition-all">
          <div>
            <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-300">{stats.totalQuestions}</div>
            <div className="text-gray-600 dark:text-gray-400 font-medium mt-2">Coding Questions</div>
            <div className="text-sm text-muted mt-1">Available questions</div>
          </div>
        </div>
        
        <div className="card border-l-4 border-l-purple-500 dark:border-l-purple-400 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
          <div>
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-300">{stats.totalQuizzes}</div>
            <div className="text-gray-600 dark:text-gray-400 font-medium mt-2">Quizzes</div>
            <div className="text-sm text-muted mt-1">Created quizzes</div>
          </div>
        </div>
        
        <div className="card border-l-4 border-l-green-500 dark:border-l-green-400 hover:shadow-lg dark:hover:shadow-green-900/20 transition-all">
          <div>
            <div className="text-4xl font-bold text-green-600 dark:text-green-300">{stats.totalSubmissions}</div>
            <div className="text-gray-600 dark:text-gray-400 font-medium mt-2">Total Submissions</div>
            <div className="text-sm text-muted mt-1">All time submissions</div>
          </div>
        </div>
        
        <div className="card border-l-4 border-l-orange-500 dark:border-l-orange-400 hover:shadow-lg dark:hover:shadow-orange-900/20 transition-all">
          <div>
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-300">{stats.recentSubmissions?.length || 0}</div>
            <div className="text-gray-600 dark:text-gray-400 font-medium mt-2">Recent Submissions</div>
            <div className="text-sm text-muted mt-1">Last submissions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data.users);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger rounded-lg shadow-md">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👥</div>
        <div className="text-muted text-lg">No users found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Users Management ({users.length})</h2>
        <button className="btn btn-primary">Add User</button>
      </div>
      
      <div className="card overflow-hidden border-2 border-premium-glow shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700/50 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Created At
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user, index) => (
                <tr key={user.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mr-4 transition-colors">Edit</button>
                    <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const QuestionsManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showTestCasesModal, setShowTestCasesModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions({ page: 1, limit: 10000 });
      setQuestions(data.questions || []);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Questions fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(id);
        setQuestions(questions.filter(q => q.id !== id));
      } catch (err) {
        setError('Failed to delete question. Please try again.');
      }
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!questions.length) {
      setError('No questions to delete.');
      return;
    }

    const firstConfirm = window.confirm(
      `⚠️ WARNING: This will permanently delete all ${questions.length} questions. This action cannot be undone. Are you sure?`
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm('Please confirm again by clicking OK. This is irreversible.');
    if (!secondConfirm) return;

    setLoading(true);
    setError('');
    try {
      await Promise.all(questions.map(q => deleteQuestion(q.id)));
      setQuestions([]);
      setError('All questions deleted successfully.');
      setTimeout(() => setError(''), 3000); // Clear message after 3 seconds
    } catch (err) {
      setError('Failed to delete all questions. Some questions may have been deleted.');
      await fetchQuestions(); // Refresh the list to show current state
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingQuestion(null);
    fetchQuestions();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingQuestion(null);
  };

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(question => {
    // Search filter (title, tags, ID)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      question.title.toLowerCase().includes(searchLower) ||
      question.id.toString().includes(searchQuery) ||
      (question.tags && Array.isArray(question.tags) && 
        question.tags.some(tag => tag.toLowerCase().includes(searchLower)));

    // Difficulty filter
    const matchesDifficulty = difficultyFilter === 'all' || 
      question.difficulty === difficultyFilter;

    // Type filter
    const matchesType = typeFilter === 'all' || 
      question.question_type === typeFilter;

    return matchesSearch && matchesDifficulty && matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Questions Management ({filteredQuestions.length}/{questions.length})
        </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowBulkUpload(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition shadow-md"
            >
              Bulk Upload
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition shadow-md"
            >
              Add Question
            </button>
            <button 
              onClick={handleDeleteAllQuestions}
              disabled={!questions.length}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-orange-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete all questions permanently"
            >
              Delete All
            </button>
          </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 card p-6 border-2 border-blue-200 dark:border-blue-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Questions
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title, ID, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="Array">Array</option>
              <option value="String">String</option>
              <option value="Linked List">Linked List</option>
              <option value="Binary Tree">Binary Tree</option>
              <option value="Binary Search Tree">Binary Search Tree</option>
              <option value="Graph">Graph</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
              <option value="Greedy">Greedy</option>
              <option value="Backtracking">Backtracking</option>
              <option value="Heap">Heap</option>
              <option value="Trie">Trie</option>
              <option value="Hash Table">Hash Table</option>
              <option value="Stack">Stack</option>
              <option value="Queue">Queue</option>
              <option value="Math">Math</option>
              <option value="Bit Manipulation">Bit Manipulation</option>
              <option value="Design">Design</option>
              <option value="Sorting">Sorting</option>
              <option value="Searching">Searching</option>
              <option value="Recursion">Recursion</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || difficultyFilter !== 'all' || typeFilter !== 'all') && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</span>
            {searchQuery && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-2">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900 dark:hover:text-blue-100">
                  ×
                </button>
              </span>
            )}
            {difficultyFilter !== 'all' && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm flex items-center gap-2">
                Difficulty: {difficultyFilter}
                <button onClick={() => setDifficultyFilter('all')} className="hover:text-green-900 dark:hover:text-green-100">
                  ×
                </button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center gap-2">
                Type: {typeFilter}
                <button onClick={() => setTypeFilter('all')} className="hover:text-purple-900 dark:hover:text-purple-100">
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('all');
                setTypeFilter('all');
              }}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Results Count */}
        {filteredQuestions.length === 0 && questions.length > 0 && (
          <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
            No questions match your filters. Try adjusting your search criteria.
          </div>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger rounded-lg shadow-md mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="card overflow-hidden border-2 border-green-200 dark:border-green-700 shadow-lg rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-transparent dark:to-transparent border-b-2 border-green-300 dark:border-green-600">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Difficulty
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tags
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {questions.length === 0 ? 'No questions available.' : 'No questions match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => (
                <tr key={question.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{question.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {question.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-transparent border-2
                      ${question.difficulty === 'Easy' ? 'border-green-500 dark:border-green-400 text-green-600 dark:text-green-400' : 
                        question.difficulty === 'Medium' ? 'border-yellow-500 dark:border-yellow-400 text-yellow-600 dark:text-yellow-400' : 
                        question.difficulty === 'Hard' ? 'border-red-500 dark:border-red-400 text-red-600 dark:text-red-400' : 'border-gray-500 dark:border-gray-400 text-gray-600 dark:text-gray-400'}`}
                    >
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {question.tags && Array.isArray(question.tags) && question.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 text-xs rounded-full bg-transparent text-blue-600 dark:text-blue-400 font-bold border-2 border-blue-500 dark:border-blue-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleEditQuestion(question)}
                        className="px-3 py-1 rounded-lg bg-transparent border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:dark:bg-blue-400 hover:text-white dark:hover:text-white font-semibold transition-all"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedQuestion(question);
                          setShowVideoModal(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-transparent border-2 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:dark:bg-purple-400 hover:text-white dark:hover:text-white font-semibold transition-all"
                      >
                        Video Link
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedQuestion(question);
                          setShowTestCasesModal(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-transparent border-2 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-500 hover:dark:bg-green-400 hover:text-white dark:hover:text-white font-semibold transition-all"
                      >
                        Test Cases
                      </button>
                      <button 
                        className="px-3 py-1 rounded-lg bg-transparent border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-500 hover:dark:bg-red-400 hover:text-white dark:hover:text-white font-semibold transition-all"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {showForm && (
        <QuestionForm
          question={editingQuestion}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}
      
        {showBulkUpload && (
          <BulkQuestionUpload
            onClose={() => setShowBulkUpload(false)}
            onSuccess={() => {
              setShowBulkUpload(false);
              fetchQuestions();
            }}
          />
        )}

        {showVideoModal && selectedQuestion && (
          <VideoLinkModal
            question={selectedQuestion}
            onClose={() => {
              setShowVideoModal(false);
              setSelectedQuestion(null);
            }}
            onSuccess={() => {
              fetchQuestions();
            }}
          />
        )}

        {showTestCasesModal && selectedQuestion && (
          <TestCasesModal
            question={selectedQuestion}
            onClose={() => {
              setShowTestCasesModal(false);
              setSelectedQuestion(null);
            }}
            onSuccess={() => {
              fetchQuestions();
            }}
          />
        )}
    </div>
  );
};

const QuizzesManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await getQuizzes();
      setQuizzes(data.quizzes || []);
    } catch (err) {
      setError('Failed to load quizzes. Please try again.');
      console.error('Quizzes fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await deleteQuiz(id);
        setQuizzes(quizzes.filter(q => q.id !== id));
      } catch (err) {
        setError('Failed to delete quiz. Please try again.');
      }
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setShowForm(true);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingQuiz(null);
    fetchQuizzes();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingQuiz(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Quizzes Management ({quizzes.length})</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          Add Quiz
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger rounded-lg shadow-md mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="card overflow-hidden border-2 border-premium-glow shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700/50 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Difficulty
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Questions
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{quiz.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {quiz.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${quiz.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                        quiz.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}
                    >
                      {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {quiz.questionCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditQuiz(quiz)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mr-4 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {showForm && (
        <QuizForm
          quiz={editingQuiz}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default AdminPanel;