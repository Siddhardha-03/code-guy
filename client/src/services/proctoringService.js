import axios from 'axios';
import { API_URL } from '../config/apiConfig';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const logViolation = async ({
  assessmentId,
  assessmentType,
  violationType,
  meta = {},
}) => {
  if (!assessmentId || !assessmentType || !violationType) {
    throw new Error('assessmentId, assessmentType, and violationType are required');
  }

  const payload = {
    assessmentId,
    assessmentType,
    violationType,
    meta,
  };

  const res = await axios.post(`${API_URL}/proctoring/violations`, payload, {
    headers: getAuthHeader(),
  });
  return res.data?.data || res.data;
};

export const fetchViolations = async (params = {}) => {
  const res = await axios.get(`${API_URL}/proctoring/violations`, {
    params,
    headers: getAuthHeader(),
  });
  return res.data?.data || res.data;
};
