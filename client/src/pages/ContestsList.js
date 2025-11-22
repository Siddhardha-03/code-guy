import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableContests, registerForContest } from '../services/contestService';
import { formatMySQLDateTime, calculateTimeRemaining, getContestStatus } from '../utils/dateUtils';
import Toast from '../components/Toast';

const ContestStatus = ({ contest }) => {
  const { status } = getContestStatus(contest.start_time, contest.end_time);
  
  if (status === 'upcoming') {
    return (
      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
        Upcoming
      </span>
    );
  }
  
  if (status === 'ended') {
    return (
      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
        Ended
      </span>
    );
  }
  
  return (
    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
      Live
    </span>
  );
};

const ContestsList = ({ user }) => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState({});
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, live, ended

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadContests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      const data = await getAvailableContests();
      setContests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load contests:', error);
      // If unauthorized, redirect to login
      if (error && error.status === 401) {
        showToast('Session expired. Redirecting to login...', 'warning');
        setTimeout(() => navigate('/login'), 800);
        return;
      }

      // Show detailed error message when available
      const message = (error && error.message) ? error.message : 'Failed to load contests';
      showToast(message, 'error');
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (contestId) => {
    try {
      setRegistering(prev => ({ ...prev, [contestId]: true }));
      await registerForContest(contestId);
      showToast('Successfully registered for contest!', 'success');
      // Redirect to contest attempt
      setTimeout(() => navigate(`/contests/${contestId}`), 1000);
    } catch (error) {
      console.error('Failed to register:', error);
      if (error && error.status === 401) {
        showToast('Session expired. Redirecting to login...', 'warning');
        setTimeout(() => navigate('/login'), 800);
        return;
      }

      const message = (error && error.message) ? error.message : 'Failed to register for contest';
      showToast(message, 'error');
      setRegistering(prev => ({ ...prev, [contestId]: false }));
    }
  };

  const handleAttempt = (contestId) => {
    navigate(`/contests/${contestId}`);
  };

  const filterContests = () => {
    const now = new Date();
    
    return contests.filter(contest => {
      const start = new Date(contest.start_time);
      const end = new Date(contest.end_time);
      
      switch (filter) {
        case 'upcoming':
          return now < start;
        case 'live':
          return now >= start && now <= end;
        case 'ended':
          return now > end;
        default:
          return true;
      }
    });
  };

  const filteredContests = filterContests();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading contests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Contests</h1>
          <p className="text-gray-600">Participate in coding contests and improve your skills</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-blue-50 bg-opacity-30 rounded-lg border border-blue-200 p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['all', 'upcoming', 'live', 'ended'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'all' && ` (${contests.length})`}
                {f === 'upcoming' && ` (${contests.filter(c => new Date() < new Date(c.start_time)).length})`}
                {f === 'live' && ` (${contests.filter(c => new Date() >= new Date(c.start_time) && new Date() <= new Date(c.end_time)).length})`}
                {f === 'ended' && ` (${contests.filter(c => new Date() > new Date(c.end_time)).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Contests Grid */}
        {filteredContests.length === 0 ? (
          <div className="bg-blue-50 bg-opacity-30 rounded-lg border border-blue-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No contests found</h3>
            <p className="text-gray-600">There are no contests in this category right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests.map(contest => {
              const now = new Date();
              const start = new Date(contest.start_time);
              const end = new Date(contest.end_time);
              const isUpcoming = now < start;
              const isLive = now >= start && now <= end;
              const timeLeft = isLive ? calculateTimeRemaining(contest.end_time) : null;
              
              return (
                <div key={contest.id} className="bg-blue-50 bg-opacity-30 rounded-lg border border-blue-200 hover:border-blue-400 transition-all overflow-hidden">
                  {/* Header */}
                  <div className={`p-4 ${isLive ? 'bg-green-100 bg-opacity-40' : isUpcoming ? 'bg-yellow-100 bg-opacity-40' : 'bg-gray-100 bg-opacity-40'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">{contest.title}</h3>
                      <ContestStatus contest={contest} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{contest.description}</p>

                    {/* Contest Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Starts: {formatMySQLDateTime(contest.start_time)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Ends: {formatMySQLDateTime(contest.end_time)}</span>
                      </div>

                      {timeLeft && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                          </svg>
                          <span>Time left: {timeLeft}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span>Type: {contest.contest_type}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t">
                      {isUpcoming ? (
                        <button
                          onClick={() => handleRegister(contest.id)}
                          disabled={registering[contest.id]}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {registering[contest.id] ? 'Registering...' : 'Register for Contest'}
                        </button>
                      ) : isLive ? (
                        <button
                          onClick={() => handleAttempt(contest.id)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Enter Contest
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAttempt(contest.id)}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                          View Results
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestsList;
