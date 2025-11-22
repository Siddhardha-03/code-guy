import React, { useState, useEffect } from 'react';
import { getQuestions } from '../../services/questionService';
import { getQuizzes } from '../../services/quizService';
import { createContest, addContestItems } from '../../services/contestService';
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
    selectedQuizzes: []
  });
  const [problems, setProblems] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProblemsAndQuizzes();
  }, []);

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
        max_participants: formData.max_participants,
        created_by: 1 // TODO: replace with real admin id from auth
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

      navigate('/admin/contests');
    } catch (error) {
      console.error('Error creating contest:', error);
    }
  };

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

        <div>
          <label className="block mb-2 font-semibold">Add Problems with Optional Quizzes</label>
          <div className="border rounded p-4 max-h-96 overflow-y-auto space-y-3">
            {problems.length === 0 ? (
              <p className="text-gray-500">No problems available</p>
            ) : (
              problems.map(problem => (
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
          <div className="border rounded p-4 max-h-64 overflow-y-auto space-y-3">
            {quizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes available</p>
            ) : (
              quizzes.map(quiz => (
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