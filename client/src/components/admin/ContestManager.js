import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContests, exportContestResults, exportContestCode, deleteContest } from '../../services/contestService';

const ContestManager = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const response = await getContests();
      // service returns full axios-like payload or data; handle both
      const contestsData = response?.data || response || [];
      
      // Update contest status based on current time
      const now = new Date();
      const updatedContests = contestsData.map(contest => {
        const startTime = new Date(contest.start_time);
        const endTime = new Date(contest.end_time);
        
        let status;
        if (now < startTime) {
          status = 'upcoming';
        } else if (now >= startTime && now <= endTime) {
          status = 'active';
        } else {
          status = 'ended';
        }
        
        return { ...contest, status };
      });
      
      setContests(updatedContests);
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContest = () => {
    navigate('/admin/contests/create');
  };

  const handleViewLeaderboard = (contestId) => {
    navigate(`/admin/contests/${contestId}/leaderboard`);
  };

  const handleExportResults = async (contestId) => {
    try {
      const response = await exportContestResults(contestId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contest-${contestId}-results.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting results:', error);
    }
  };

  const handleExportCode = async (contestId) => {
    try {
      const response = await exportContestCode(contestId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contest-${contestId}-code.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting code:', error);
    }
  };

  const handleDeleteClick = (contestId) => {
    setDeleteConfirm(contestId);
  };

  const handleConfirmDelete = async (contestId) => {
    try {
      await deleteContest(contestId);
      setContests(contests.filter(contest => contest.id !== contestId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting contest:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Contest Management ({contests.length})
        </h2>
        <button
          onClick={handleCreateContest}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New Contest
        </button>
      </div>

      {contests.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Contests Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first contest</p>
          <button
            onClick={handleCreateContest}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
          >
            Create Contest
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {contests.map((contest) => (
            <div
              key={contest.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-transparent hover:border-gradient-to-r hover:from-red-500 hover:to-pink-500 transition-all relative overflow-hidden"
              style={{
                borderImage: 'linear-gradient(to right, rgb(239, 68, 68), rgb(236, 72, 153)) 1',
                borderImageSlice: 1
              }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {contest.title}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${
                      contest.status === 'active' 
                        ? 'border-green-500 text-green-600 dark:text-green-400 bg-transparent' 
                        : contest.status === 'upcoming'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent'
                        : 'border-gray-500 text-gray-600 dark:text-gray-400 bg-transparent'
                    }`}>
                      {contest.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    {contest.description}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{contest.contest_type}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Time</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {new Date(contest.start_time).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End Time</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {new Date(contest.end_time).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {Math.round((new Date(contest.end_time) - new Date(contest.start_time)) / (1000 * 60 * 60))}h
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleViewLeaderboard(contest.id)}
                    className="px-4 py-2 bg-transparent border-2 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500 hover:dark:bg-green-400 hover:text-white font-semibold transition-all text-sm whitespace-nowrap"
                  >
                    📊 Leaderboard
                  </button>
                  <button
                    onClick={() => handleExportResults(contest.id)}
                    className="px-4 py-2 bg-transparent border-2 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500 hover:dark:bg-purple-400 hover:text-white font-semibold transition-all text-sm whitespace-nowrap"
                  >
                    📥 Export Results
                  </button>
                  <button
                    onClick={() => handleExportCode(contest.id)}
                    className="px-4 py-2 bg-transparent border-2 border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-500 hover:dark:bg-orange-400 hover:text-white font-semibold transition-all text-sm whitespace-nowrap"
                  >
                    💾 Export Code
                  </button>
                  <button
                    onClick={() => handleDeleteClick(contest.id)}
                    className="px-4 py-2 bg-transparent border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500 hover:dark:bg-red-400 hover:text-white font-semibold transition-all text-sm whitespace-nowrap"
                  >
                    🗑️ Delete
                  </button>
                  {deleteConfirm === contest.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full border-2 border-red-500 dark:border-red-400">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Delete</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                          Are you sure you want to delete "<span className="font-semibold">{contest.title}</span>"? 
                          All contest data, submissions, and results will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleConfirmDelete(contest.id)}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 px-4 py-3 bg-transparent border-2 border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-500 hover:dark:bg-gray-400 hover:text-white font-semibold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContestManager;