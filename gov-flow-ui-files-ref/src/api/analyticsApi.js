import { base44 } from '@/api/base44Client';
import { nodeRequest, useNodeBackend } from '@/api/nodeBackendClient';

/**
 * Analytics and reporting domain API.
 * These map to Base44 functions today but will be implemented
 * on your own backend later.
 */

export async function getLeaderboardData(params) {
  if (useNodeBackend) {
    return nodeRequest('/analytics/leaderboard', { method: 'POST', body: params || {} });
  }
  const response = await base44.functions.invoke('getLeaderboardData', params);
  return response?.data || response;
}

export async function getLeaderboardFilterOptions() {
  if (useNodeBackend) {
    return nodeRequest('/analytics/leaderboard-filters');
  }
  // Fallback for base44 mode when dedicated filter endpoint is unavailable.
  return { sectors: [], departments: [] };
}

export async function analyzeTeamPerformance(params) {
  if (useNodeBackend) {
    return nodeRequest('/analytics/analyze-team-performance', {
      method: 'POST',
      body: params || {},
    });
  }
  const response = await base44.functions.invoke('analyzeTeamPerformance', params);
  return response?.data || response;
}

