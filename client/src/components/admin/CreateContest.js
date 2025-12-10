import React, { useState, useEffect } from 'react';
import { getQuestions } from '../../services/questionService';
import { getQuizzes } from '../../services/quizService';
import { createContest, addContestItems, addContestAccess } from '../../services/contestService';
import { getUsers } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

const CreateContest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contest_type: 'ICPC',
    visibility: 'public',
    start_time: '',
    end_time: '',
    max_participants: 0,
    selectedProblems: [],
    selectedQuizzes: [],
    inviteEmails: ''
  });
  const [problems, setProblems] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [problemSearch, setProblemSearch] = useState('');
  const [quizSearch, setQuizSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchProblemsAndQuizzes();
  }, []);

  useEffect(() => {
    if (formData.visibility === 'private') {
      fetchUsers(userSearch);
    }
  }, [formData.visibility, userSearch]);

  const fetchProblemsAndQuizzes = async () => {
    try {
      const [problemsData, quizzesData] = await Promise.all([
        getQuestions({ page: 1, limit: 100 }),
        getQuizzes()
      ]);

      setProblems(problemsData?.questions || problemsData || []);
      setQuizzes(quizzesData?.quizzes || quizzesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (term = '') => {
    try {
      const data = await getUsers(term);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProblemSelection = (problemId) => {
    setFormData(prev => {
      const selected = [...prev.selectedProblems];
      const index = selected.indexOf(problemId);
      if (index === -1) {
        selected.push(problemId);
      } else {
        selected.splice(index, 1);
        return {
          ...prev,
          selectedProblems: selected
        };
      }
      return {
        ...prev,
        selectedProblems: selected
      };
    });
  };

  const handleQuizSelection = (quizId) => {
    setFormData(prev => {
      const selected = [...prev.selectedQuizzes];
      const idx = selected.indexOf(quizId);
      if (idx === -1) selected.push(quizId);
      else selected.splice(idx, 1);
      return {
        ...prev,
        selectedQuizzes: selected
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await createContest({
        title: formData.title,
        description: formData.description,
        contest_type: formData.contest_type,
        visibility: formData.visibility,
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_participants: formData.max_participants
      });

      const contestId = created?.id || created?.data?.id;

      // Build items: selected problems followed by selected quizzes
      const items = [];
      let pos = 0;
      for (const id of formData.selectedProblems) {
        items.push({
          item_type: 'coding',
          item_id: id,
          position: pos++,
          points: 100
        });
      }
      for (const qid of formData.selectedQuizzes) {
        items.push({
          item_type: 'quiz',
          item_id: qid,
          position: pos++,
          points: 0
        });
      }

      await addContestItems(contestId, items);

      // If private, add invites by email and selected users
      if (formData.visibility === 'private') {
        const emails = formData.inviteEmails
          .split(/[,\n]/)
          .map(e => e.trim())
          .filter(Boolean);

        const emailPromises = emails.length
          ? emails.map(email => addContestAccess(contestId, { email, role: 'participant' }))
          : [];

        const userPromises = selectedUsers.length
          ? selectedUsers.map(u => addContestAccess(contestId, { email: u.email, role: 'participant' }))
          : [];

        await Promise.all([...emailPromises, ...userPromises]);
      }

      navigate('/admin/contests');
    } catch (error) {
      console.error('Error creating contest:', error);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const term = problemSearch.toLowerCase();
    const tags = Array.isArray(problem.tags) ? problem.tags.join(' ') : '';
    return (
      problem.title?.toLowerCase().includes(term) ||
      problem.difficulty?.toLowerCase().includes(term) ||
      tags.toLowerCase().includes(term)
    );
  });

  const filteredQuizzes = quizzes.filter((quiz) => {
    const term = quizSearch.toLowerCase();
    return quiz.title?.toLowerCase().includes(term) || quiz.category?.toLowerCase().includes(term);
  });

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create New Contest</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Contest Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Contest Type</label>
            <select
              name="contest_type"
              value={formData.contest_type}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="ICPC">ICPC Style</option>
              <option value="Quiz">Quiz</option>
              <option value="Training">Training</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Visibility</label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Start Time</label>
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-2">End Time</label>
            <input
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Max Participants (0 for unlimited)</label>
            <input
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
        </div>

        {formData.visibility === 'private' && (
          <div className="border rounded p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-semibold">Invite Participants (emails)</label>
              <span className="text-sm text-gray-600">Comma or newline separated</span>
            </div>
            <textarea
              name="inviteEmails"
              value={formData.inviteEmails}
              onChange={handleInputChange}
              rows="3"
              placeholder="user1@example.com, user2@example.com"
              className="w-full p-2 border rounded"
            />
            <p className="text-sm text-gray-600 mt-2">
              Only invited users (or you) can view/register in a private contest.
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block font-semibold">Select Users</label>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="p-2 border rounded w-72"
                />
              </div>
              <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2 bg-white dark:bg-gray-900">
                {users.length === 0 ? (
                  <p className="text-sm text-gray-500">No users found</p>
                ) : (
                  users.map((u) => (
                    <label key={u.id} className="flex items-center gap-3 p-2 border rounded hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.some(su => su.id === u.id)}
                        onChange={(e) => {
                          setSelectedUsers(prev => {
                            if (e.target.checked) {
                              return [...prev, u];
                            }
                            return prev.filter(su => su.id !== u.id);
                          });
                        }}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{u.name || '(no name)'}</div>
                        <div className="text-xs text-gray-600">{u.email}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border">
                        {u.role}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-sm text-green-600 mt-2">{selectedUsers.length} user(s) selected</p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block mb-2 font-semibold">Add Problems with Optional Quizzes</label>
          <div className="flex items-center justify-between mb-3 gap-3">
            <input
              type="text"
              placeholder="Search problems by title, difficulty, or tag"
              value={problemSearch}
              onChange={(e) => setProblemSearch(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {filteredProblems.length}/{problems.length} shown
            </span>
          </div>
          <div className="border rounded p-4 max-h-96 overflow-y-auto space-y-3">
            {problems.length === 0 ? (
              <p className="text-gray-500">No problems available</p>
            ) : filteredProblems.length === 0 ? (
              <p className="text-gray-500">No problems match your search</p>
            ) : (
              filteredProblems.map(problem => (
                <div key={problem.id} className="p-3 border rounded bg-white hover:bg-blue-50">
                  <div className="flex items-start gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.selectedProblems.includes(problem.id)}
                      onChange={() => handleProblemSelection(problem.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{problem.title}</div>
                      <div className="text-sm text-gray-600">Difficulty: {problem.difficulty}</div>
                    </div>
                  </div>

                  {/* No per-problem pairing in this simplified UI. */}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Add Quizzes</label>
          <div className="flex items-center justify-between mb-3 gap-3">
            <input
              type="text"
              placeholder="Search quizzes by title or category"
              value={quizSearch}
              onChange={(e) => setQuizSearch(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {filteredQuizzes.length}/{quizzes.length} shown
            </span>
          </div>
          <div className="border rounded p-4 max-h-64 overflow-y-auto space-y-3">
            {quizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes available</p>
            ) : filteredQuizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes match your search</p>
            ) : (
              filteredQuizzes.map(quiz => (
                <div key={quiz.id} className="p-2 border rounded bg-white hover:bg-blue-50 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.selectedQuizzes.includes(quiz.id)}
                    onChange={() => handleQuizSelection(quiz.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{quiz.title}</div>
                    <div className="text-sm text-gray-600">{quiz.questions?.length || 0} questions</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/contests')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Contest
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateContest;