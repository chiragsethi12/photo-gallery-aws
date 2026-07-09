// src/context/AuthContext.jsx - React Context for user authentication state and operations
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Base URL of the Express backend auth endpoints
const AUTH_API = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth`;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
    }
    setLoading(false);
  }, []);

  // Set up event listeners for silent refresh updates & force logouts from Axios interceptor
  useEffect(() => {
    const handleTokensRefreshed = (e) => {
      setToken(e.detail.token);
      setRefreshToken(e.detail.refreshToken);
    };

    const handleLogoutEvent = () => {
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    };

    window.addEventListener('auth:tokens_refreshed', handleTokensRefreshed);
    window.addEventListener('auth:logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth:tokens_refreshed', handleTokensRefreshed);
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  // Login handler
  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${AUTH_API}/login`, { email, password });
      const { token: receivedToken, refreshToken: receivedRefreshToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setRefreshToken(receivedRefreshToken);
      setUser(receivedUser);

      // NOTE: Storing refresh token in local storage. An httpOnly cookie would be more secure
      // but requires backend cookie-parser support which is out of scope for this task.
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('refreshToken', receivedRefreshToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      return { success: true };
    } catch (error) {
      console.error('Context login error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to login. Please check your credentials.';
      return { success: false, error: errorMsg };
    }
  }, []);

  // Register handler
  const register = useCallback(async (name, email, password) => {
    try {
      const response = await axios.post(`${AUTH_API}/register`, { name, email, password });
      const { token: receivedToken, refreshToken: receivedRefreshToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setRefreshToken(receivedRefreshToken);
      setUser(receivedUser);

      // NOTE: Storing refresh token in local storage. An httpOnly cookie would be more secure
      // but requires backend cookie-parser support which is out of scope for this task.
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('refreshToken', receivedRefreshToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      return { success: true };
    } catch (error) {
      console.error('Context registration error:', error);
      const errorMsg = error.response?.data?.error || 'Registration failed. Try again.';
      return { success: false, error: errorMsg };
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem('refreshToken') || refreshToken;
    const currentToken = localStorage.getItem('token') || token;

    if (currentRefreshToken) {
      try {
        // Send request to revoke session (best-effort)
        await axios.post(`${AUTH_API}/logout`, { refreshToken: currentRefreshToken }, {
          headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {}
        });
      } catch (error) {
        console.error('Context logout network error:', error);
      }
    }

    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }, [token, refreshToken]);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
