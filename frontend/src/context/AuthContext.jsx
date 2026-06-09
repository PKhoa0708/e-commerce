import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại.');
      }

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
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, emailOrPhone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại.');
      }

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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('urbancart_user');
    localStorage.removeItem('urbancart_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated: !!token, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
