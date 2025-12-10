import axios from 'axios';
import { API_URL } from '../config/apiConfig';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getContests = async () => {
  try {
    const res = await axios.get(`${API_URL}/contests`, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch contests';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const getContest = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/contests/${id}`, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch contest';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const getContestItems = async (contestId) => {
  try {
    const res = await axios.get(`${API_URL}/contests/${contestId}/items`, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch contest items';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const createContest = async (payload) => {
  try {
    const headers = getAuthHeader();
    console.log('[createContest] Request details:', {
      url: `${API_URL}/contests`,
      hasToken: !!headers.Authorization,
      tokenPreview: headers.Authorization?.substring(0, 20) + '...',
      payload
    });
    const res = await axios.post(`${API_URL}/contests`, payload, { headers });
    console.log('[createContest] Success:', res.data);
    return res.data;
  } catch (err) {
    console.error('[createContest] Error:', {
      status: err.response?.status,
      message: err.response?.data?.message,
      data: err.response?.data
    });
    const msg = err.response?.data?.message || err.message || 'Failed to create contest';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const addContestItems = async (contestId, items) => {
  try {
    const res = await axios.post(`${API_URL}/contests/${contestId}/items`, { items }, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to add contest items';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const listContestAccess = async (contestId) => {
  try {
    const res = await axios.get(`${API_URL}/contests/${contestId}/access`, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch contest access list';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const addContestAccess = async (contestId, payload) => {
  try {
    const res = await axios.post(`${API_URL}/contests/${contestId}/access`, payload, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to add contest access';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const removeContestAccess = async (contestId, accessId) => {
  try {
    const res = await axios.delete(`${API_URL}/contests/${contestId}/access/${accessId}`, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to remove contest access';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const getContestParticipants = async (contestId) => {
  try {
    const res = await axios.get(`${API_URL}/contests/${contestId}/participants`, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch participants';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const exportContestResults = async (contestId) => {
  try {
    const res = await axios.get(`${API_URL}/contests/${contestId}/export`, { headers: getAuthHeader(), responseType: 'blob' });
    return res;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to export results';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const exportContestCode = async (contestId) => {
  try {
    const res = await axios.get(`${API_URL}/contests/${contestId}/export/top20-code`, { headers: getAuthHeader(), responseType: 'blob' });
    return res;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to export code';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const finalizeContest = async (contestId) => {
  try {
    const res = await axios.post(`${API_URL}/contests/${contestId}/finalize`, {}, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to finalize contest';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const deleteContest = async (contestId) => {
  try {
    const res = await axios.delete(`${API_URL}/contests/${contestId}`, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to delete contest';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

// Student-specific functions
export const getAvailableContests = async () => {
  try {
    // Get all contests - the backend will filter based on visibility and user role
    const res = await axios.get(`${API_URL}/contests`, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch available contests';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const registerForContest = async (contestId) => {
  try {
    const res = await axios.post(`${API_URL}/contests/${contestId}/register`, {}, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const serverMsg = err.response?.data?.message || err.response?.data?.error;
    const msg = serverMsg || err.message || 'Failed to register for contest';
    const error = new Error(msg);
    error.status = err.response?.status;
    error.serverMessage = serverMsg;
    error.data = err.response?.data;
    throw error;
  }
};

export const submitSolution = async (contestId, contestItemId, submission) => {
  try {
    const res = await axios.post(`${API_URL}/contests/${contestId}/submit`, {
      itemId: contestItemId,
      submission
    }, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to submit solution';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};

export const submitContestCode = async (contestId, contestItemId, code, language) => {
  try {
    const res = await axios.post(`${API_URL}/contests/${contestId}/submit-code`, {
      contestItemId,
      code,
      language
    }, { headers: getAuthHeader() });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to submit code';
    const error = new Error(msg);
    error.status = err.response?.status;
    throw error;
  }
};