// src/context/AuthContext.jsx - React Context for user authentication state and operations
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Base URL of the Express backend auth endpoints
const AUTH_API = 'http://localhost:5000/api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${AUTH_API}/login`, { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem('token', receivedToken);
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
      const { token: receivedToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      return { success: true };
    } catch (error) {
      console.error('Context registration error:', error);
      const errorMsg = error.response?.data?.error || 'Registration failed. Try again.';
      return { success: false, error: errorMsg };
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
