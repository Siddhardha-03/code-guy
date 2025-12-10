import React, { useState, useEffect } from 'react';
import { getTestCases, addTestCase, updateTestCase, deleteTestCase } from '../../services/adminService';

const TestCasesModal = ({ question, onClose, onSuccess }) => {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const emptyTestCase = {
    input: '',
    expected_output: '',
    hidden: false
  };

  const [newTestCase, setNewTestCase] = useState(emptyTestCase);

  useEffect(() => {
    fetchTestCases();
  }, [question]);

  const fetchTestCases = async () => {
    setLoading(true);
    try {
      const data = await getTestCases(question.id);
      setTestCases(data.testCases || []);
    } catch (err) {
      setError('Failed to load test cases');
      console.error('Test cases fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!newTestCase.input.trim() || !newTestCase.expected_output.trim()) {
      setError('Input and expected output are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await addTestCase(question.id, newTestCase);
      await fetchTestCases();
      setNewTestCase(emptyTestCase);
      setShowAddForm(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to add test case');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTestCase = async (testCaseId, updatedData) => {
    setSaving(true);
    setError('');

    try {
      await updateTestCase(testCaseId, updatedData);
      await fetchTestCases();
      setEditingIndex(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update test case');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm('Are you sure you want to delete this test case?')) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await deleteTestCase(testCaseId);
      await fetchTestCases();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to delete test case');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Manage Test Cases</h3>
              <p className="text-green-100 text-sm">{question?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Add Test Case Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New Test Case
            </button>
          )}

          {/* Add Test Case Form */}
          {showAddForm && (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-green-900 dark:text-green-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Test Case
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input</label>
                  <textarea
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    rows="3"
                    placeholder="Enter test case input..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output</label>
                  <textarea
                    value={newTestCase.expected_output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                    rows="3"
                    placeholder="Enter expected output..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newHidden"
                    checked={newTestCase.hidden}
                    onChange={(e) => setNewTestCase({ ...newTestCase, hidden: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="newHidden" className="text-sm text-gray-700 dark:text-gray-300">
                    Hidden (not visible to students)
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddTestCase}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? 'Adding...' : 'Add Test Case'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTestCase(emptyTestCase);
                  }}
                  className="px-4 py-2 bg-transparent border-2 border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-500 hover:dark:bg-gray-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Test Cases List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : testCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No test cases yet. Add your first test case above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testCases.map((testCase, index) => (
                <div
                  key={testCase.id}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      Test Case {index + 1}
                      {testCase.hidden && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full font-medium">
                          Hidden
                        </span>
                      )}
                    </h4>
                    <div className="flex gap-2">
                      {editingIndex === index ? (
                        <>
                          <button
                            onClick={() => handleUpdateTestCase(testCase.id, testCase)}
                            disabled={saving}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingIndex(null);
                              fetchTestCases();
                            }}
                            className="px-3 py-1 bg-transparent border-2 border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-500 hover:dark:bg-gray-400 hover:text-white transition-all"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTestCase(testCase.id)}
                            disabled={saving}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-sm rounded-lg hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50 transition-all"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input</label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) => handleInputChange(index, 'input', e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output</label>
                        <textarea
                          value={testCase.expected_output}
                          onChange={(e) => handleInputChange(index, 'expected_output', e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`hidden-${index}`}
                          checked={testCase.hidden}
                          onChange={(e) => handleInputChange(index, 'hidden', e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor={`hidden-${index}`} className="text-sm text-gray-700 dark:text-gray-300">
                          Hidden (not visible to students)
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Input:</p>
                        <pre className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-xs font-mono text-gray-900 dark:text-gray-100 overflow-x-auto">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Expected Output:</p>
                        <pre className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-xs font-mono text-gray-900 dark:text-gray-100 overflow-x-auto">
                          {testCase.expected_output}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestCasesModal;
