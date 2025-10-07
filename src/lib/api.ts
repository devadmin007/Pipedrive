import axios from 'axios';

const API_URL = 'http://89.116.34.232:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const data:any = JSON.parse(localStorage.getItem('auth-storage') || '');
    console.log('Auth Data:', data);
    if (data?.state?.token) {
      config.headers['Authorization'] = `Bearer ${data.state.token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;