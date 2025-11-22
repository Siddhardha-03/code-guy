import axios from 'axios';
import { API_URL } from '../config/apiConfig';

// Set up axios with token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Create a new coding question
 * @param {Object} questionData - Question data
 * @returns {Promise} - Promise with created question data
 */
export const createQuestion = async (questionData) => {
  try {
    const response = await axios.post(`${API_URL}/questions`, questionData, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create question';
  }
};

/**
 * Update a coding question
 * @param {number} id - Question ID
 * @param {Object} questionData - Question data to update
 * @returns {Promise} - Promise with success message
 */
export const updateQuestion = async (id, questionData) => {
  try {
    console.log('AdminService: Updating question', id, 'with data:', questionData);
    const response = await axios.put(`${API_URL}/questions/${id}`, questionData, {
      headers: getAuthHeader()
    });
    console.log('AdminService: Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('AdminService: Update error:', error);
    console.error('AdminService: Error response:', error.response?.data);
    console.error('AdminService: Error status:', error.response?.status);
    throw error.response?.data?.message || error.message || 'Failed to update question';
  }
};

/**
 * Delete a coding question
 * @param {number} id - Question ID
 * @returns {Promise} - Promise with success message
 */
export const deleteQuestion = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/questions/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete question';
  }
};

/**
 * Add test cases to a question
 * @param {number} questionId - Question ID
 * @param {Object} testCasesData - Test cases data
 * @returns {Promise} - Promise with success message
 */
export const addTestCases = async (questionId, testCasesData) => {
  try {
    const response = await axios.post(`${API_URL}/questions/${questionId}/test-cases`, testCasesData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add test cases';
  }
};

/**
 * Get all test cases for a question (including hidden ones)
 * @param {number} questionId - Question ID
 * @returns {Promise} - Promise with test cases data
 */
export const getAllTestCases = async (questionId) => {
  try {
    const response = await axios.get(`${API_URL}/questions/${questionId}/all-test-cases`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch test cases';
  }
};

/**
 * Create a new quiz
 * @param {Object} quizData - Quiz data
 * @returns {Promise} - Promise with created quiz data
 */
export const createQuiz = async (quizData) => {
  try {
    const response = await axios.post(`${API_URL}/quizzes`, quizData, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create quiz';
  }
};

/**
 * Update a quiz
 * @param {number} id - Quiz ID
 * @param {Object} quizData - Quiz data to update
 * @returns {Promise} - Promise with success message
 */
export const updateQuiz = async (id, quizData) => {
  try {
    const response = await axios.put(`${API_URL}/quizzes/${id}`, quizData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update quiz';
  }
};

/**
 * Delete a quiz
 * @param {number} id - Quiz ID
 * @returns {Promise} - Promise with success message
 */
export const deleteQuiz = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/quizzes/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete quiz';
  }
};

/**
 * Add questions to a quiz
 * @param {number} quizId - Quiz ID
 * @param {Object} questionsData - Questions data
 * @returns {Promise} - Promise with success message
 */
export const addQuizQuestions = async (quizId, questionsData) => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/questions`, questionsData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add questions';
  }
};

/**
 * Get submissions for a specific question (admin only)
 * @param {number} questionId - Question ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise} - Promise with submissions data
 */
export const getQuestionSubmissions = async (questionId, params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/submissions/question/${questionId}`, {
      headers: getAuthHeader(),
      params
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch submissions';
  }
};

/**
 * Get all users (admin only)
 * @returns {Promise} - Promise with users data
 */
export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

/**
 * Get platform statistics (admin only)
 * @returns {Promise} - Promise with statistics data
 */
export const getPlatformStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/stats`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch statistics';
  }
};

/**
 * Create a new user (admin only)
 * @param {Object} userData - User data (name, email, password, role)
 * @returns {Promise} - Promise with created user data
 */
export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/users`, userData, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create user';
  }
};

/**
 * Update user role (admin only)
 * @param {number} userId - User ID
 * @param {string} role - New role (student/admin)
 * @returns {Promise} - Promise with success message
 */
export const updateUserRole = async (userId, role) => {
  try {
    const response = await axios.put(`${API_URL}/admin/users/${userId}/role`, { role }, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user role';
  }
};

/**
 * Delete a user (admin only)
 * @param {number} userId - User ID
 * @returns {Promise} - Promise with success message
 */
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/users/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete user';
  }
};

/**
 * Get leaderboard data (admin only)
 * @param {string} type - Leaderboard type (overall, quiz, coding)
 * @param {number} limit - Number of entries to fetch
 * @returns {Promise} - Promise with leaderboard data
 */
export const getLeaderboard = async (type = 'overall', limit = 10) => {
  try {
    console.log('Admin service: fetching leaderboard', { type, limit });
    const response = await axios.get(`${API_URL}/admin/leaderboard`, {
      headers: getAuthHeader(),
      params: { type, limit }
    });
    console.log('Admin service: leaderboard response', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Admin service: leaderboard error', error.response?.data || error.message);
    throw error.response?.data?.message || error.message || 'Failed to fetch leaderboard';
  }
};

/**
 * Get recent activity for leaderboard (admin only)
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise} - Promise with recent activity data
 */
export const getRecentActivity = async (limit = 20) => {
  try {
    console.log('Admin service: fetching recent activity', { limit });
    const response = await axios.get(`${API_URL}/admin/leaderboard/recent-activity`, {
      headers: getAuthHeader(),
      params: { limit }
    });
    console.log('Admin service: recent activity response', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Admin service: recent activity error', error.response?.data || error.message);
    throw error.response?.data?.message || error.message || 'Failed to fetch recent activity';
  }
};

  /**
   * Bulk upload questions from Excel file
   * @param {File} file - Excel file to upload
   * @returns {Promise} - Promise with upload results
   */
  export const uploadBulkQuestions = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/admin/questions/bulk-upload`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      const errorData = {
        message: error.response?.data?.message || 'Failed to upload file',
        data: error.response?.data?.data || null
      };
      throw errorData;
    }
  };

  /**
   * Download question template Excel file
   * @returns {Promise} - Promise that triggers file download
   */
  export const downloadQuestionTemplate = async () => {
    try {
      // Create template data
      const templateData = [
        {
          title: 'Two Sum',
          function_name: 'twoSum',
          description: '<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers that add up to <code>target</code>.</p>',
          difficulty: 'Easy',
          question_type: 'array',
          tags: 'array, hash table',
          languages: 'javascript, python, java, cpp',
          parameter_schema: '{"params":[{"name":"nums","type":"int[]"},{"name":"target","type":"int"}],"returnType":"int[]"}',
          examples: '[]',
          leetcode_url: 'https://leetcode.com/problems/two-sum/',
          geeksforgeeks_url: '',
          other_platform_url: '',
          other_platform_name: '',
          testcase_1_input: '[2,7,11,15]\n9',
          testcase_1_output: '[0,1]',
          testcase_1_hidden: 'false',
          testcase_2_input: '[3,2,4]\n6',
          testcase_2_output: '[1,2]',
          testcase_2_hidden: 'false',
          testcase_3_input: '[3,3]\n6',
          testcase_3_output: '[0,1]',
          testcase_3_hidden: 'true'
        },
        {
          title: 'Reverse String',
          function_name: 'reverseString',
          description: '<p>Write a function that reverses a string. The input string is given as an array of characters.</p>',
          difficulty: 'Easy',
          question_type: 'string',
          tags: 'string, two pointers',
          languages: 'javascript, python, java, cpp',
          parameter_schema: '{"params":[{"name":"s","type":"String[]"}],"returnType":"void"}',
          examples: '[]',
          leetcode_url: 'https://leetcode.com/problems/reverse-string/',
          geeksforgeeks_url: 'https://www.geeksforgeeks.org/reverse-a-string/',
          other_platform_url: 'https://a2zdsa.pages.dev/strings_part_1',
          other_platform_name: 'A2Z DSA',
          testcase_1_input: '["h","e","l","l","o"]',
          testcase_1_output: '["o","l","l","e","h"]',
          testcase_1_hidden: 'false',
          testcase_2_input: '["H","a","n","n","a","h"]',
          testcase_2_output: '["h","a","n","n","a","H"]',
          testcase_2_hidden: 'false'
        }
      ];

      // Create CSV content
      const headers = Object.keys(templateData[0]);
      const csvContent = [
        headers.join(','),
        ...templateData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma or newline
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
    
      link.setAttribute('href', url);
      link.setAttribute('download', 'questions_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    
      return Promise.resolve();
    } catch (error) {
      throw new Error('Failed to generate template file');
    }
  };