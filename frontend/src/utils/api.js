import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

const buildPlantParams = (plants) => {
  const cleanPlants = Array.isArray(plants)
    ? plants.map((p) => String(p || '').trim()).filter(Boolean)
    : [];
  if (cleanPlants.length === 0) {
    return {};
  }
  return { params: { plants: cleanPlants.join(',') } };
};

// Auth API
export const authAPI = {
  sendRegistrationOtp: (email) => api.post('/auth/send-registration-otp', { email }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, confirmPassword, fullName, otp, supportType = 'technical') =>
    api.post('/auth/register', { email, password, confirmPassword, fullName, otp, supportType }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword, confirmPassword) =>
    api.post('/auth/reset-password', { email, otp, newPassword, confirmPassword }),
  getCurrentUser: (token) =>
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  changePassword: (currentPassword, newPassword, confirmPassword, token) =>
    api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Admin API
export const adminAPI = {
  getAllUsers: (token) =>
    api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),
  getPendingApprovals: (token) =>
    api.get('/admin/pending-approvals', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),
  approveUser: (userId, role, token) =>
    api.post(`/admin/approve-user/${userId}`, { role }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  rejectUser: (userId, reason, token) =>
    api.post(`/admin/reject-user/${userId}`, { reason }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  changeUserRole: (userId, role, token) =>
    api.post(`/admin/change-user-role/${userId}`, { role }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  deleteUser: (userId, token) =>
    api.delete(`/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getAllActiveUsers: (token) =>
    api.get('/admin/all-users', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),
};

export const applicationSupportAPI = {
  getDashboard: () => api.get('/application-support/dashboard'),
  getDashboardHistory: (hours) => api.get('/application-support/dashboard/history', { params: { hours } }),
  getInventory: () => api.get('/application-support/inventory'),
  createTerminal: (data) => api.post('/application-support/terminals', data),
  createServer: (data) => api.post('/application-support/servers', data),
  refresh: () => api.post('/application-support/refresh'),
  deployTerminal: (data) => api.post('/application-support/terminal-management/deploy', data),
  getTerminalHistory: () => api.get('/application-support/terminal-management/history'),
  getTerminalFailedDevices: () => api.get('/application-support/terminal-management/failed-devices'),
  rollbackTerminal: (data) => api.post('/application-support/terminal-management/rollback', data),
};

export const printersAPI = {
  getAll: (plants) => api.get('/printers', buildPlantParams(plants)),
  getDashboardLive: (plants) => api.get('/printers/dashboard-live', buildPlantParams(plants)),
  refreshDashboardLive: () => api.post('/printers/dashboard-live/refresh'),
  getStatusLogs: (pmno) => api.get(`/printers/status-logs/${encodeURIComponent(pmno)}`),
  getLocationLogs: (pmno) => api.get(`/printers/location-logs/${encodeURIComponent(pmno)}`),
  getLiveWebData: (pmno) => api.get(`/printers/${encodeURIComponent(pmno)}/live-web`),
  getOne: (pmno) => api.get(`/printers/${pmno}`),
  create: (data) => api.post('/printers', data),
  update: (id, data) => api.put(`/printers/${id}`, data),
  delete: (id) => api.delete(`/printers/${id}`),
};

export const backupPrintersAPI = {
  getAll: (plants) => api.get('/backup-printers', buildPlantParams(plants)),
  getMatches: (pmno) => api.get(`/backup-printers/match-for-issue/${encodeURIComponent(pmno)}`),
  create: (data) => api.post('/backup-printers', data),
  update: (id, data) => api.put(`/backup-printers/${id}`, data),
  delete: (id) => api.delete(`/backup-printers/${id}`),
};

export const sparePartsAPI = {
  getAll: (plants) => api.get('/spare-parts', buildPlantParams(plants)),
  getUsageLog: () => api.get('/spare-parts/usage-log'),
  getRequirements: () => api.get('/spare-parts/requirements'),
  create: (data) => api.post('/spare-parts', data),
  update: (id, data) => api.put(`/spare-parts/${id}`, data),
  delete: (id) => api.delete(`/spare-parts/${id}`),
  use: (data) => api.post('/spare-parts/use', data),
};

export const hpPrintersAPI = {
  getAll: (plants) => api.get('/hp-printers', buildPlantParams(plants)),
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

export const printerPushAPI = {
  push: (data) => api.post('/push-to-printer', data),
};

export const issuesAPI = {
  getAll: (plants) => api.get('/issues', buildPlantParams(plants)),
  create: (data) => api.post('/issues', data),
  update: (id, data) => api.put(`/issues/${id}`, data),
  resolve: (id, data) => api.put(`/issues/${id}/resolve`, data),
  downgrade: (id, data) => api.put(`/issues/${id}/downgrade`, data),
  upgrade: (id, data) => api.put(`/issues/${id}/upgrade`, data),
  assign: (id, data) => api.put(`/issues/${id}/assign`, data),
  getHistory: (id) => api.get(`/issues/${id}/history`),
  getUsers: () => api.get('/issues/users/list'),
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
  getStats: (plants) => api.get('/dashboard/stats', buildPlantParams(plants)),
  getDueOverdue: (plants) => api.get('/dashboard/due-overdue', buildPlantParams(plants)),
};

export const iLearnAPI = {
  getAll: (category, search) => api.get('/i-learn', { params: { category, search } }),
  getById: (id) => api.get(`/i-learn/${id}`),
  create: (data) => api.post('/i-learn', data),
  update: (id, data) => api.put(`/i-learn/${id}`, data),
  delete: (id) => api.delete(`/i-learn/${id}`),
  addStep: (id, data) => api.post(`/i-learn/${id}/steps`, data),
  updateStep: (id, stepId, data) => api.put(`/i-learn/${id}/steps/${stepId}`, data),
  deleteStep: (id, stepId) => api.delete(`/i-learn/${id}/steps/${stepId}`),
  getCategories: () => api.get('/i-learn/categories/list'),
};

export default api;
