import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getContest, getContestParticipants } from '../../services/contestService';

const ContestLeaderboard = () => {
  const { contestId } = useParams();
  const [contest, setContest] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
    const interval = setInterval(fetchLeaderboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [contestId]);

  const fetchLeaderboardData = async () => {
    try {
      const [contestRes, participantsRes] = await Promise.all([
        getContest(contestId),
        getContestParticipants(contestId)
      ]);
      setContest(contestRes?.data || contestRes || null);
      setParticipants(participantsRes?.data || participantsRes || []);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!contest) {
    return <div className="p-4">Contest not found</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{contest.title} - Leaderboard</h2>
        <p className="text-gray-600">
          {new Date(contest.start_time).toLocaleString()} to {new Date(contest.end_time).toLocaleString()}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Score</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Time Taken</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Last Submission</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {participants.map((participant, index) => (
              <tr key={participant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm">{index + 1}</td>
                <td className="px-6 py-4 text-sm">{participant.name}</td>
                <td className="px-6 py-4 text-sm">{participant.score}</td>
                <td className="px-6 py-4 text-sm">
                  {Math.floor(participant.total_time_seconds / 60)} minutes
                </td>
                <td className="px-6 py-4 text-sm">
                  {participant.last_submission_at 
                    ? new Date(participant.last_submission_at).toLocaleString()
                    : 'N/A'
                  }
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    participant.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : participant.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {participant.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContestLeaderboard;