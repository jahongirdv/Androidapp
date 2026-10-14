import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jixozmed_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(loginValue, password) {
  const { data } = await api.post('/auth/login', { login: loginValue, password });
  return data;
}

export async function verifySms(loginValue, code) {
  const { data } = await api.post('/auth/verify-sms', { login: loginValue, code });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export function logout() {
  localStorage.removeItem('jixozmed_token');
  localStorage.removeItem('jixozmed_user');
}
