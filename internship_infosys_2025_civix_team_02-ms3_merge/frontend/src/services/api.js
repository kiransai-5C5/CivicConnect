// // frontend/src/services/api.js
import axios from 'axios';

const API_URL = '/api';




const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error - backend not reachable
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Backend connection error:', error);
      error.response = {
        data: { message: 'Cannot connect to server. Please ensure the backend is running on port 5000.' },
        status: 503
      };
    }
    // No response from server
    if (!error.response) {
      console.error('No response from server:', error);
      error.response = {
        data: { message: 'Server is not responding. Please check if the backend server is running.' },
        status: 503
      };
    }
    // Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.error('Authentication error:', error);
      // Optionally clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const signup = (userData) => api.post('/auth/signup', userData);
export const verifyOTP = (otpData) => api.post('/auth/verify-otp', otpData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const resendOTP = (email) => api.post('/auth/resend-otp', { email });
export const getProfile = () => api.get('/auth/profile');

// Forgot Password APIs
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const verifyResetOTP = (data) => api.post('/auth/verify-reset-otp', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// ---------- PETITIONS ----------
export const createPetition = (petitionData) => api.post('/petitions', petitionData);
export const getPetitions = (filters = {}) => api.get('/petitions', { params: filters });
export const getPetitionById = (id) => api.get(`/petitions/${id}`);
export const editPetition = (id, data) => api.put(`/petitions/${id}`, data);
export const signPetition = (id) => api.post(`/petitions/${id}/sign`);
export const updatePetitionStatus = (id, statusData) => api.patch(`/petitions/${id}/status`, statusData);
export const deletePetition = (id) => api.delete(`/petitions/${id}`);

// Officer – Petitions
export const getOfficerPetitions = (filters = {}) =>
  api.get('/officer/petitions', { params: filters });

export const officerUpdatePetitionStatus = (id, status) =>
  api.patch(`/officer/petitions/${id}/status`, { status });

export const officerSetPetitionResponse = (id, response) =>
  api.patch(`/officer/petitions/${id}/response`, { response });

// ---------- POLLS ----------

export const getPolls = (filters = {}) => api.get('/polls', { params: filters });
export const createPoll = (data) => api.post('/polls', data);
export const votePoll = (pollId, optionId) => api.post(`/polls/${pollId}/vote/${optionId}`);
export const deletePoll = (pollId) => api.delete(`/polls/${pollId}`);

// submit poll feedback  <-- ADD THIS
export const submitPollFeedback = (pollId, data) =>
  api.post(`/polls/${pollId}/feedback`, data);

// Officer – Polls
export const getOfficerPolls = (filters = {}) =>
  api.get('/officer/polls', { params: filters });

export const officerUpdatePollStatus = (id, status) =>
  api.patch(`/officer/polls/${id}/status`, { status });

// Officer Dashboard
export const getOfficerDashboard = () => api.get('/officer/dashboard');

// Unified Reports (auto-detects user role)
export const getReports = (filters = {}) =>
  api.get('/reports', { params: filters });

// Citizen Dashboard
export const getCitizenDashboard = () => api.get('/citizen/dashboard');

// ---------- SETTINGS ----------

// Citizen Settings
export const getCitizenSettings = () => api.get('/citizen/settings');
export const updateCitizenProfile = (data) => api.put('/citizen/settings/profile', data);
export const updateCitizenPassword = (data) => api.put('/citizen/settings/password', data);
export const updateCitizenLocation = (data) => api.put('/citizen/settings/location', data);
export const updateCitizenNotifications = (data) => api.put('/citizen/settings/notifications', data);
export const getCitizenActivity = () => api.get('/citizen/settings/activity');

// Official Settings
export const getOfficialSettings = () => api.get('/official/settings');
export const updateOfficialProfile = (data) => api.put('/official/settings/profile', data);
export const updateOfficialPassword = (data) => api.put('/official/settings/password', data);
export const updateOfficialLocation = (data) => api.put('/official/settings/location', data);
export const updateOfficialPreferences = (data) => api.put('/official/settings/preferences', data);
export const getOfficialLogs = (params = {}) => api.get('/official/settings/logs', { params });

export default api;
