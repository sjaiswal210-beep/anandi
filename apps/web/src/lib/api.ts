import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Hardcoded for single-project setup (Anandi Park)
const WORKSPACE_ID = 'cmsai8kh50001rapl8ioxehxe';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Workspace-Id': WORKSPACE_ID,
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Always set workspace ID
  config.headers['X-Workspace-Id'] = WORKSPACE_ID;

  // Try to get token from localStorage if available
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('realtyos-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      }
    } catch {
      // No auth stored, continue without token
    }
  }

  return config;
});

// Response interceptor - handle errors silently
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    // Don't redirect on 401/403 — just return empty
    return Promise.reject(error);
  },
);

export default api;
