import React, { useState, useEffect } from 'react';
import { getSheets, createSheet, updateSheet, deleteSheet } from '../../services/sheetsService';
import { getQuestions } from '../../services/questionService';

const SheetsManager = () => {
  const [sheets, setSheets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSheet, setEditingSheet] = useState(null);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [questionSearch, setQuestionSearch] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty_level: 'mixed',
    category: 'other',
    estimated_hours: '',
    is_featured: false
  });

  useEffect(() => {
    loadSheets();
    loadQuestions();
  }, []);

  const loadSheets = async () => {
    try {
      const data = await getSheets();
      setSheets(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Failed to load sheets');
      console.error(err);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      console.log('Loading questions...');
      const data = await getQuestions({ limit: 10000 });
      console.log('Questions API response:', data);
      
      // Handle both array and object responses
      let questionsArray = [];
      if (Array.isArray(data)) {
        questionsArray = data;
      } else if (data && typeof data === 'object') {
        // Check for common response structures
        if (data.data && Array.isArray(data.data)) {
          questionsArray = data.data;
        } else if (data.questions && Array.isArray(data.questions)) {
          questionsArray = data.questions;
        }
      }
      
      console.log('Parsed questions array:', questionsArray.length);
      setQuestions(questionsArray);
    } catch (err) {
      console.error('Failed to load questions error:', err);
      // Show user-friendly error
      setError(`Failed to load questions: ${err}`);
      setQuestions([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectProblem = (questionId, e) => {
    if (e.target.checked) {
      setSelectedProblems(prev => [...prev, questionId]);
    } else {
      setSelectedProblems(prev => prev.filter(id => id !== questionId));
    }
    // Clear problems error if user selects at least one
    if (formErrors.problems) {
      setFormErrors(prev => ({
        ...prev,
        problems: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (selectedProblems.length === 0) {
      newErrors.problems = 'Please select at least one problem';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        ...formData,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        problems: selectedProblems.map((qId, index) => ({
          question_id: qId,
          position: index + 1
        }))
      };

      if (editingSheet) {
        await updateSheet(editingSheet.id, payload);
        setSuccessMessage('Sheet updated successfully');
      } else {
        await createSheet(payload);
        setSuccessMessage('Sheet created successfully');
      }

      setTimeout(() => setSuccessMessage(''), 3000);
      resetForm();
      loadSheets();
    } catch (err) {
      setError(err.message || 'Failed to save sheet');
    }
  };

  const handleEdit = (sheet) => {
    setEditingSheet(sheet);
    setFormData({
      title: sheet.title,
      description: sheet.description,
      difficulty_level: sheet.difficulty_level,
      category: sheet.category,
      estimated_hours: sheet.estimated_hours || '',
      is_featured: sheet.is_featured
    });
    setSelectedProblems([]);
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (sheetId) => {
    if (!window.confirm('Are you sure you want to delete this sheet?')) return;

    try {
      await deleteSheet(sheetId);
      setSuccessMessage('Sheet deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadSheets();
    } catch (err) {
      setError('Failed to delete sheet');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty_level: 'mixed',
      category: 'other',
      estimated_hours: '',
      is_featured: false
    });
    setSelectedProblems([]);
    setEditingSheet(null);
    setShowForm(false);
    setFormErrors({});
    setQuestionSearch('');
  };

  // Filter questions based on search term
  const filteredQuestions = questions.filter(q => {
    const searchLower = questionSearch.toLowerCase();
    
    // Parse tags if it's a string
    let tags = [];
    if (Array.isArray(q.tags)) {
      tags = q.tags;
    } else if (typeof q.tags === 'string') {
      try {
        const parsed = JSON.parse(q.tags);
        tags = parsed.tags || parsed;
      } catch (e) {
        tags = [];
      }
    }
    
    return (
      q.title.toLowerCase().includes(searchLower) ||
      q.id.toString().includes(searchLower) ||
      (tags.length > 0 && tags.some(tag => 
        typeof tag === 'string' && tag.toLowerCase().includes(searchLower)
      ))
    );
  });

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Learning Sheets</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Create New Sheet
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">{editingSheet ? 'Edit Sheet' : 'Create New Sheet'}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Array Basics, Interview Prep"
                />
                {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="other">Other</option>
                  <option value="beginner">Beginner</option>
                  <option value="interview">Interview</option>
                  <option value="algorithms">Algorithms</option>
                  <option value="data-structures">Data Structures</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe what this sheet covers and who it's for"
              />
              {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Hours</label>
                <input
                  type="number"
                  name="estimated_hours"
                  value={formData.estimated_hours}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center cursor-pointer h-full">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Problems * ({selectedProblems.length} selected)</label>
              
              {/* Search Box */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search by question ID, title, or tags..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Questions List */}
              <div className={`max-h-96 overflow-y-auto border rounded-lg p-3 space-y-2 ${
                formErrors.problems ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
              }`}>
                {questions.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No questions available. Please add questions first.</p>
                ) : filteredQuestions.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No questions match your search.</p>
                ) : (
                  filteredQuestions.map(question => {
                    // Parse tags properly
                    let tags = [];
                    if (Array.isArray(question.tags)) {
                      tags = question.tags;
                    } else if (typeof question.tags === 'string') {
                      try {
                        const parsed = JSON.parse(question.tags);
                        tags = parsed.tags || parsed;
                      } catch (e) {
                        tags = [];
                      }
                    }

                    return (
                    <label key={question.id} className="flex items-start cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedProblems.includes(question.id)}
                        onChange={(e) => handleSelectProblem(question.id, e)}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5 flex-shrink-0"
                      />
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm text-gray-700 font-medium">
                          Q{question.id} - {question.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${
                            question.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {question.difficulty}
                          </span>
                          {tags && tags.length > 0 && (
                            <>
                              Tags: {tags.slice(0, 2).join(', ')}
                              {tags.length > 2 && ` +${tags.length - 2}`}
                            </>
                          )}
                        </p>
                      </div>
                    </label>
                  );
                  })
                )
              }
              
              </div>
              {formErrors.problems && <p className="mt-1 text-sm text-red-600">{formErrors.problems}</p>}
              
              {/* Quick Select Options */}
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedProblems(questions.map(q => q.id))}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProblems([])}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
                >
                  Clear All
                </button>
                {filteredQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProblems([...new Set([...selectedProblems, ...filteredQuestions.map(q => q.id)])])}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded transition-colors"
                  >
                    Select Filtered
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                {editingSheet ? 'Update Sheet' : 'Create Sheet'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Difficulty</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Problems</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Featured</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sheets.map(sheet => (
              <tr key={sheet.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{sheet.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{sheet.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    sheet.difficulty_level === 'beginner' ? 'bg-green-100 text-green-700' :
                    sheet.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    sheet.difficulty_level === 'advanced' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {sheet.difficulty_level?.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{sheet.total_problems || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {sheet.is_featured ? <span className="text-yellow-600 font-semibold">⭐ Featured</span> : 'No'}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(sheet)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sheet.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {sheets.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No sheets created yet. Create your first sheet!
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetsManager;
