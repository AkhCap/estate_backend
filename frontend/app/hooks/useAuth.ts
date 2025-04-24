import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        const response = await axios.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAuthState({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
  };
}; 