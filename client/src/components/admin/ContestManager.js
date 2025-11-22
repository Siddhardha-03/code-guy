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
      setContests(response?.data || response || []);
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
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contest Management</h2>
        <button
          onClick={handleCreateContest}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Contest
        </button>
      </div>

      <div className="grid gap-4">
        {contests.map((contest) => (
          <div
            key={contest.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{contest.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {contest.description}
                </p>
                <div className="mt-2 space-y-1">
                  <p>Type: {contest.contest_type}</p>
                  <p>Start: {new Date(contest.start_time).toLocaleString()}</p>
                  <p>End: {new Date(contest.end_time).toLocaleString()}</p>
                  <p>Status: {contest.status}</p>
                </div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleViewLeaderboard(contest.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => handleExportResults(contest.id)}
                  className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                >
                  Export Results
                </button>
                <button
                  onClick={() => handleExportCode(contest.id)}
                  className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                >
                  Export Code
                </button>
                <button
                  onClick={() => handleDeleteClick(contest.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
                {deleteConfirm === contest.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4">Confirm Delete</h4>
                      <p>Are you sure you want to delete this contest? This action cannot be undone.</p>
                      <div className="mt-4 space-x-2">
                        <button
                          onClick={() => handleConfirmDelete(contest.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
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
    </div>
  );
};

export default ContestManager;