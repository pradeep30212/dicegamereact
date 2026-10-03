import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register } from '../features/auth/authSlice';
import './Login.css';

export default function Login() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      dispatch(login({ username: form.username, password: form.password }));
    } else {
      dispatch(register(form));
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Winner Stays On</h1>
        <p className="login-subtitle">
          {mode === 'login' ? 'Sign in to take your turn.' : 'Create an account to join a group.'}
        </p>

        <label htmlFor="username">Username {mode !== 'register' ? '/Email' : ''}</label>
        <input
          id="username"
          name="username"
          value={form.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />

        {mode === 'register' && (
          <>
          <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
              required
            />
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="Shown to other players"
              required
            />
          </>
        )}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />

        {error && <div className="login-error">{error}</div>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          className="login-switch"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? "Need an account? Register" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
