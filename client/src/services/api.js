import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// --- Classes ---
export const getClasses = () => api.get('/classes');
export const createClass = (name) => api.post('/classes', { name });
export const updateClass = (id, name) => api.put(`/classes/${id}`, { name });
export const deleteClass = (id) => api.delete(`/classes/${id}`);

// --- Students ---
export const getStudentsByClass = (classId) => api.get(`/students/class/${classId}`);
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// --- Upload ---
export const uploadResult = (studentId, file, onProgress) => {
  const formData = new FormData();
  formData.append('result', file);
  return api.post(`/upload/${studentId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded / e.total) * 100))
      : undefined,
  });
};
export const deleteResult = (studentId) => api.delete(`/upload/${studentId}`);

// --- Email ---
export const getEmailStatus = (classId) => api.get(`/email/status/${classId}`);
export const queueAll = (classId) => api.post(`/email/queue/${classId}`);
export const queuePartial = (classId, limit) =>
  api.post(`/email/queue-partial/${classId}`, { limit });
export const processQueue = () => api.post('/email/process');
export const retryFailed = (classId) => api.post(`/email/retry/${classId}`);
export const resetClassEmails = (classId) => api.post(`/email/reset-class/${classId}`);
export const getEmailPreview = (studentId) => api.get(`/email/preview/${studentId}`);
export const getDailyLog = () => api.get('/email/daily-log');

// --- Settings ---
export const getEmailTemplate = () => api.get('/settings/template');
export const updateEmailTemplate = (template) => api.put('/settings/template', { template });
