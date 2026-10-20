import apiClient from './client';

export async function fetchDashboardData() {
  const response = await apiClient.get('/dashboard');
  return response.data;
}
