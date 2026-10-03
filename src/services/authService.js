import api from './api';

// ---------------------------------------------------------------------------
// Expected .NET Core Web API contract (adjust paths to match your controller):
//
//   POST /api/auth/register  { username, password, displayName }
//        -> 200 { accessToken, expiresIn, user: { id, username, displayName } }
//           + Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
//
//   POST /api/auth/login     { username, password }
//        -> same shape as register
//
//   POST /api/auth/refresh   (no body — reads the httpOnly refresh cookie)
//        -> 200 { accessToken, expiresIn, user }
//        -> 401 if the refresh token is missing/expired/revoked
//
//   POST /api/auth/logout    (reads the httpOnly refresh cookie)
//        -> 204, and clears/revokes the refresh cookie server-side
//
//   GET  /api/auth/me        (requires Authorization: Bearer <accessToken>)
//        -> 200 { id, username, displayName }
//
// Keeping the refresh token in an HttpOnly cookie (rather than returning it
// in the JSON body) means client-side JS never touches it, which is the
// standard mitigation for refresh-token theft via XSS.
// ---------------------------------------------------------------------------

const authService = {
  register: async ({ username, password, displayName }) => {
    const { data } = await api.post('/auth/register', { username, password, displayName });
    return data;
  },

  login: async ({ username, password }) => {
    const { data } = await api.post('/auth/login', { username, password });
    return data;
  },

  refresh: async () => {
    const { data } = await api.post('/auth/refresh', {});
    return data;
  },

  logout: async () => {
    await api.post('/auth/logout', {});
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export default authService;
