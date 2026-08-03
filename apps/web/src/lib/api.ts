import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Resolve the API base URL.
// 1. NEXT_PUBLIC_API_URL wins when it is set at build time.
// 2. In the browser, derive it from the current hostname so the same build
//    works on localhost and on the VPS without a rebuild.
// 3. Fall back to localhost for SSR.
function resolveApiUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000/api/v1`;
  }

  return 'http://localhost:4000/api/v1';
}

const API_URL = resolveApiUrl();

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
  // Re-resolve per request: the module may have been evaluated during SSR,
  // where window was unavailable.
  config.baseURL = resolveApiUrl();

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
