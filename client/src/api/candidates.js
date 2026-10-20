import apiClient from './client';

export async function fetchCandidates(params = {}) {
  const response = await apiClient.get('/candidates', { params });
  return response.data;
}

export async function fetchCandidateById(id) {
  const response = await apiClient.get(`/candidates/${id}`);
  return response.data;
}

export async function createCandidate(data) {
  const response = await apiClient.post('/candidates', data);
  return response.data;
}

export async function updateCandidate(id, data) {
  const response = await apiClient.put(`/candidates/${id}`, data);
  return response.data;
}

export async function deleteCandidate(id) {
  const response = await apiClient.delete(`/candidates/${id}`);
  return response.data;
}

export async function updateCandidateStage(id, stage) {
  const response = await apiClient.patch(`/candidates/${id}/stage`, { stage });
  return response.data;
}

export async function addCandidateNote(id, content) {
  const response = await apiClient.post(`/candidates/${id}/notes`, { content });
  return response.data;
}

export async function deleteCandidateNote(noteId) {
  const response = await apiClient.delete(`/notes/${noteId}`);
  return response.data;
}
