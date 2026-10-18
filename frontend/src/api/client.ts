// ============================================
// ລະບົບ PARKO — API Client (ຕົວເຊື່ອມຕໍ່ລະບົບ API ຫຼັກ)
// ສ້າງ Axios Instance ພ້ອມ Interceptors ສຳລັບການແນບ ແລະ ຕໍ່ອາຍຸ JWT Token ອັດຕະໂນມັດ
// ============================================
import axios from 'axios';

// ນຳໃຊ້ຄ່າ Empty String ເພື່ອໃຫ້ Vite Proxy ເປັນຕົວຈັດການສົ່ງຕໍ່ Request — ຮອງຮັບທຸກໆ IP ແລະ Hostname
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request Interceptor: ແນບ Bearer JWT Access Token ເຂົ້າໃນ Header ຂອງທຸກໆ Request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: ຈັດການຕໍ່ອາຍຸ Token (Token Refresh) ເມື່ອໄດ້ຮັບ HTTP Status 401 Unauthorized
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

    return Promise.reject(error);
  },
);

export default api;
