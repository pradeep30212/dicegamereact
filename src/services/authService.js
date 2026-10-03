import api from './api';

// ---------------------------------------------------------------------------
// Actual .NET Core Web API response shape (as returned today):
//
//   POST /api/auth/login   { username, password }
//   POST /api/auth/register { username, email, password, displayName }
//        -> 200 {
//             success: true,
//             message: "Login successful",
//             token: "<jwt>",
//             user: { id, email, username, displayName, createdAt }
//           }
//        -> 200 { success: false, message: "..." } on a rejected login
//           (wrong password etc. — this API reports that as 200/success:false
//           rather than a 401, so we check `success` explicitly below)
//
//   POST /api/auth/refresh   (reads the httpOnly refresh cookie)
//        -> same shape as login; 401 if the refresh token is missing/expired
//
//   POST /api/auth/logout    (reads the httpOnly refresh cookie)
//        -> 204
//
// normalizeAuthResponse() below maps { token, user } to { accessToken, user }
// so the rest of the app (authSlice.js) only ever deals with one shape,
// regardless of which endpoint produced it.
// ---------------------------------------------------------------------------

function normalizeAuthResponse(data) {
  if (data?.success === false) {
    throw new Error(data.message || 'Authentication failed.');
  }
  return { accessToken: data.token, user: data.user };
}

const authService = {
  register: async ({ username, email, password, displayName }) => {
    const { data } = await api.post('/auth/register', { username, email, password, displayName });
    return normalizeAuthResponse(data);
  },

  login: async ({ username, password }) => {
    const { data } = await api.post('/auth/login', { username, password });
    return normalizeAuthResponse(data);
  },

  refresh: async () => {
    const { data } = await api.post('/auth/refresh', {});
    return normalizeAuthResponse(data);
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