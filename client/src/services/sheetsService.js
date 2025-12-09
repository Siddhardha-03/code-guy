import axios from 'axios';
import { API_URL } from '../config/apiConfig';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get all sheets with optional filters
 */
export const getSheets = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/sheets`, {
      params,
      headers: getAuthHeader()
    });
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch sheets';
  }
};

/**
 * Get featured sheets for homepage
 */
export const getFeaturedSheets = async (limit = 3) => {
  try {
    const response = await axios.get(`${API_URL}/sheets/featured`, {
      params: { limit },
      headers: getAuthHeader()
    });
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch featured sheets';
  }
};

/**
 * Get sheet details with problems
 */
export const getSheet = async (sheetId) => {
  try {
    const response = await axios.get(`${API_URL}/sheets/${sheetId}`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch sheet details';
  }
};

/**
 * Get user's sheet progress
 */
export const getUserSheetProgress = async () => {
  try {
    const response = await axios.get(`${API_URL}/sheets/user/progress`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch user progress';
  }
};

/**
 * Start a sheet (track user progress)
 */
export const startSheet = async (sheetId) => {
  try {
    const response = await axios.post(`${API_URL}/sheets/${sheetId}/start`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to start sheet';
  }
};

/**
 * Create a new sheet (admin only)
 */
export const createSheet = async (sheetData) => {
  try {
    const response = await axios.post(`${API_URL}/sheets`, sheetData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create sheet';
  }
};

/**
 * Update a sheet (admin only)
 */
export const updateSheet = async (sheetId, sheetData) => {
  try {
    const response = await axios.put(`${API_URL}/sheets/${sheetId}`, sheetData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update sheet';
  }
};

/**
 * Delete a sheet (admin only)
 */
export const deleteSheet = async (sheetId) => {
  try {
    const response = await axios.delete(`${API_URL}/sheets/${sheetId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete sheet';
  }
};
