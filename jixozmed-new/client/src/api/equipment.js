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

export async function fetchEquipmentByOrg(organizationId) {
  const { data } = await api.get('/equipment', {
    params: { organization_id: organizationId },
  });
  return data.equipment || [];
}

export async function fetchEquipmentCounts() {
  const { data } = await api.get('/equipment/counts');
  return data.counts || {};
}

export async function createEquipment(payload) {
  const { data } = await api.post('/equipment', payload);
  return data;
}

export async function deleteEquipment(id) {
  const { data } = await api.delete(`/equipment/${id}`);
  return data;
}
