import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const storedUser = localStorage.getItem('urbancart_user');
    const storedToken = localStorage.getItem('urbancart_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        localStorage.removeItem('urbancart_user');
        localStorage.removeItem('urbancart_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (emailOrPhone, password) => {
    try {
      const data = await authAPI.login(emailOrPhone, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('urbancart_user', JSON.stringify(data.user));
      localStorage.setItem('urbancart_token', data.token);
      return data;
    } catch (error) {
      console.error('Auth API Error:', error);
      throw error;
    }
  };

  const register = async (name, emailOrPhone, password) => {
    try {
      const data = await authAPI.register(name, emailOrPhone, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('urbancart_user', JSON.stringify(data.user));
      localStorage.setItem('urbancart_token', data.token);
      return data;
    } catch (error) {
      console.error('Register API Error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const data = await authAPI.loginWithGoogle(googleToken);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('urbancart_user', JSON.stringify(data.user));
      localStorage.setItem('urbancart_token', data.token);
      return data;
    } catch (error) {
      console.error('Google Auth Context Error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('urbancart_user');
    localStorage.removeItem('urbancart_token');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('urbancart_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loginWithGoogle, isAuthenticated: !!token, loading, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
