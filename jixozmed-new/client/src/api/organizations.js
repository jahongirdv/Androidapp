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

export async function fetchOrganizations() {
  const { data } = await api.get('/organizations');
  return data.organizations || [];
}

export async function createOrganization(payload) {
  const { data } = await api.post('/organizations', payload);
  return data;
}

export async function deleteOrganization(id) {
  const { data } = await api.delete(`/organizations/${id}`);
  return data;
}
