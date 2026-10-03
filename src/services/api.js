import axios from 'axios';
import tokenService from './tokenService';

// ---------------------------------------------------------------------------
// Base client.
// `withCredentials: true` lets the browser send/receive the httpOnly refresh
// token cookie your .NET Core API should set on login (see README for the
// expected backend contract). The refresh token itself is never exposed to
// JavaScript — only the API and the browser cookie jar ever see it.
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://localhost:7000/api',
  withCredentials: true,
});

// Attach the current access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -- 401 handling with a single in-flight refresh -----------------------
// If several requests fail with 401 at once (e.g. a component fires off
// three API calls in parallel right as the token expires), we don't want to
// hit /auth/refresh three times. The first 401 triggers a refresh; every
// other 401 that arrives while that refresh is in flight just waits for it
// and then retries with the new token.
let isRefreshing = false;
let pendingRequests = [];

function resolvePendingRequests(newToken) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh');

    if (response?.status === 401 && !config._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh resolves.
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            config._retry = true;
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(config));
          });
        });
      }

      config._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        tokenService.setAccessToken(data.accessToken);
        resolvePendingRequests(data.accessToken);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(config);
      } catch (refreshError) {
        tokenService.clearAccessToken();
        resolvePendingRequests(null);
        // Let the rest of the app (App.js) know the session is dead so it
        // can drop back to the login screen.
        window.dispatchEvent(new Event('auth:sessionExpired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
