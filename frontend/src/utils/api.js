import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const printersAPI = {
  getAll: () => api.get('/printers'),
  getDashboardLive: () => api.get('/printers/dashboard-live'),
  refreshDashboardLive: () => api.post('/printers/dashboard-live/refresh'),
  getStatusLogs: (pmno) => api.get(`/printers/status-logs/${encodeURIComponent(pmno)}`),
  getOne: (pmno) => api.get(`/printers/${pmno}`),
  create: (data) => api.post('/printers', data),
  update: (id, data) => api.put(`/printers/${id}`, data),
  delete: (id) => api.delete(`/printers/${id}`),
};

export const vlanAPI = {
  getAll: () => api.get('/vlan'),
  getByIp: (ip) => api.get(`/vlan/by-ip/${ip}`),
  create: (data) => api.post('/vlan', data),
  update: (id, data) => api.put(`/vlan/${id}`, data),
  delete: (id) => api.delete(`/vlan/${id}`),
};

export const sparePartsAPI = {
  getAll: () => api.get('/spare-parts'),
  getUsageLog: () => api.get('/spare-parts/usage-log'),
  create: (data) => api.post('/spare-parts', data),
  update: (id, data) => api.put(`/spare-parts/${id}`, data),
  delete: (id) => api.delete(`/spare-parts/${id}`),
  use: (data) => api.post('/spare-parts/use', data),
};

export const hpPrintersAPI = {
  getAll: () => api.get('/hp-printers'),
  create: (data) => api.post('/hp-printers', data),
  update: (id, data) => api.put(`/hp-printers/${id}`, data),
  delete: (id) => api.delete(`/hp-printers/${id}`),
};

export const cartridgesAPI = {
  getAll: () => api.get('/cartridges'),
  getUsageLog: () => api.get('/cartridges/usage-log'),
  create: (data) => api.post('/cartridges', data),
  update: (id, data) => api.put(`/cartridges/${id}`, data),
  delete: (id) => api.delete(`/cartridges/${id}`),
  use: (data) => api.post('/cartridges/use', data),
};

export const recipesAPI = {
  getAll: () => api.get('/recipes'),
  create: (data) => api.post('/recipes', data),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  delete: (id) => api.delete(`/recipes/${id}`),
};

export const issuesAPI = {
  getAll: () => api.get('/issues'),
  create: (data) => api.post('/issues', data),
  update: (id, data) => api.put(`/issues/${id}`, data),
  resolve: (id) => api.put(`/issues/${id}/resolve`),
  delete: (id) => api.delete(`/issues/${id}`),
};

export const healthAPI = {
  getAll: () => api.get('/health-checkup'),
  getActivityLog: () => api.get('/health-checkup/activity-log'),
  create: (data) => api.post('/health-checkup', data),
};

export const pmPastedAPI = {
  getAll: () => api.get('/pm-pasted'),
  create: (data) => api.post('/pm-pasted', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getDueOverdue: () => api.get('/dashboard/due-overdue'),
};

export default api;
