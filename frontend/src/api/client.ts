// ============================================
// PARKO — API Client
// Axios instance with auth interceptors
// ============================================
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const newData = data.data || data;
        localStorage.setItem('accessToken', newData.accessToken);
        localStorage.setItem('refreshToken', newData.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${newData.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    // Log error to a hidden div for debugging
    const errDiv = document.getElementById('debug-error-log') || document.createElement('div');
    errDiv.id = 'debug-error-log';
    errDiv.style.display = 'none';
    errDiv.innerText = JSON.stringify({
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    document.body.appendChild(errDiv);
    
    return Promise.reject(error);
  },
);

export default api;
