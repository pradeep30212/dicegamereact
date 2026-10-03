import { configureStore } from '@reduxjs/toolkit';
import gameReducer from '../features/game/gameSlice';
import authReducer from '../features/auth/authSlice';
import groupsReducer from '../features/groups/groupsSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    auth: authReducer,
    groups: groupsReducer,
  },
});

export default store;
