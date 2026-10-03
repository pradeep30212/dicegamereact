import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import groupService from '../../services/groupService';

export const fetchGroups = createAsyncThunk('groups/fetchGroups', async (_, { rejectWithValue }) => {
  try {
    return await groupService.listGroups();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load groups.');
  }
});

export const joinGroup = createAsyncThunk('groups/joinGroup', async (groupId, { rejectWithValue }) => {
  try {
    return await groupService.joinGroup(groupId);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not join that group.');
  }
});

// Used both for the initial load of a joined group and for polling —
// polling passes `silent: true` so it doesn't flip currentStatus back to
// 'loading' and cause the screen to flash on every refresh.
export const fetchGroupState = createAsyncThunk(
  'groups/fetchGroupState',
  async ({ groupId }, { rejectWithValue }) => {
    try {
      return await groupService.getGroupState(groupId);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lost connection to the group.');
    }
  }
);

export const rollDiceForGroup = createAsyncThunk(
  'groups/rollDice',
  async (groupId, { rejectWithValue }) => {
    try {
      return await groupService.rollDice(groupId);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "It isn't your turn yet.");
    }
  }
);

export const leaveGroup = createAsyncThunk('groups/leaveGroup', async (groupId, { rejectWithValue }) => {
  try {
    await groupService.leaveGroup(groupId);
    return groupId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not leave the group.');
  }
});

const groupsSlice = createSlice({
  name: 'groups',
  initialState: {
    list: [], // dashboard: [{ id, name, memberCount, maxMembers, status }]
    listStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    listError: null,

    current: null, // full state of the group the user is currently inside
    currentStatus: 'idle',
    currentError: null,

    rollStatus: 'idle', // separate from currentStatus so polling doesn't fight the roll button
    rollError: null,
  },
  reducers: {
    // Local-only: dismiss a roll error (e.g. "it isn't your turn") without
    // waiting for the next poll to overwrite it.
    clearRollError(state) {
      state.rollError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- dashboard list ---
      .addCase(fetchGroups.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload;
      })

      // --- join ---
      .addCase(joinGroup.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload;
      })
      .addCase(joinGroup.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.currentError = action.payload;
      })

      // --- poll / refetch ---
      .addCase(fetchGroupState.pending, (state, action) => {
        if (!action.meta.arg.silent) {
          state.currentStatus = 'loading';
        }
      })
      .addCase(fetchGroupState.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchGroupState.rejected, (state, action) => {
        if (!action.meta.arg.silent) {
          state.currentStatus = 'failed';
          state.currentError = action.payload;
        }
      })

      // --- roll ---
      .addCase(rollDiceForGroup.pending, (state) => {
        state.rollStatus = 'loading';
        state.rollError = null;
      })
      .addCase(rollDiceForGroup.fulfilled, (state, action) => {
        state.rollStatus = 'idle';
        state.current = action.payload;
      })
      .addCase(rollDiceForGroup.rejected, (state, action) => {
        state.rollStatus = 'idle';
        state.rollError = action.payload;
      })

      // --- leave ---
      .addCase(leaveGroup.fulfilled, (state) => {
        state.current = null;
        state.currentStatus = 'idle';
      });
  },
});

export const { clearRollError } = groupsSlice.actions;
export default groupsSlice.reducer;
