import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bootstrapAuth, sessionExpired, logout } from './features/auth/authSlice';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GameArena from './components/GameArena';
import './App.css';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, status } = useSelector((state) => state.auth);
  const { current: currentGroup } = useSelector((state) => state.groups);

  // On first load, try to silently trade the httpOnly refresh cookie for a
  // fresh access token, since the in-memory access token doesn't survive
  // a page refresh (see tokenService.js for why that's intentional).
  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  // api.js dispatches this DOM event when a refresh attempt fails mid-session
  // (refresh token revoked/expired) — drop the user back to the login screen.
  useEffect(() => {
    const handleSessionExpired = () => dispatch(sessionExpired());
    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
  }, [dispatch]);

  if (status === 'loading' && !isAuthenticated) {
    return <div className="app-loading">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div>
      <header className="app-header">
        <span>Signed in as {user?.displayName}</span>
        <button onClick={() => dispatch(logout())}>Sign out</button>
      </header>
      {currentGroup ? <GameArena /> : <Dashboard />}
    </div>
  );
}
