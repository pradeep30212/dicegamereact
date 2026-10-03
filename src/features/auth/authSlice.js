import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import tokenService from '../../services/tokenService';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid username or password.');
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    console.log('register payload', payload);
    return await authService.register(payload);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not create that account.');
  }
});

// Called once when the app loads. The access token lives only in memory
// (see tokenService.js), so a page refresh means we've lost it — this
// thunk trades the httpOnly refresh cookie for a fresh one silently,
// so a logged-in user doesn't get bounced to the login screen on reload.
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  try {
    return await authService.refresh();
  } catch (err) {
    return rejectWithValue(null);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null, // { id, username, displayName }
    isAuthenticated: false,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // Triggered by api.js when a refresh attempt fails mid-session
    // (e.g. the refresh token was revoked or expired while the tab was open).
    sessionExpired(state) {
      state.user = null;
      state.isAuthenticated = false;
      tokenService.clearAccessToken();
    },

    // Dev-only: lets you switch "who's logged in" without a real backend, so
    // you can test turn-taking before the .NET API exists. GameArena only
    // renders the switcher when NODE_ENV !== 'production', but this reducer
    // itself has no such guard — don't dispatch it from any production code path.
    devSetUser(state, action) {
      const displayName = action.payload;
      state.user = { id: `dev-${displayName}`, username: displayName, displayName };
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        tokenService.setAccessToken(action.payload.accessToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        tokenService.setAccessToken(action.payload.accessToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        tokenService.setAccessToken(action.payload.accessToken);
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        tokenService.clearAccessToken();
      });
  },
});

export const { sessionExpired, devSetUser } = authSlice.actions;
export default authSlice.reducer;
