import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, LoginCredentials, RegisterData, MUser, MUserLogin, MUserSignup, PasswordResetResponse } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [mUser, setMUser] = useState<MUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Try to get MUser first (preferred)
          try {
            const mUserData = await authAPI.getCurrentMUser();
            setMUser(mUserData);
            setToken(storedToken);
          } catch {
            // If MUser fails, try regular user
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            setToken(storedToken);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token } = response;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await authAPI.register(data);
      // After successful registration, automatically log in
      await login({ username: data.username, password: data.password });
    } catch (error) {
      throw error;
    }
  };

  // MUser authentication methods
  const loginMUser = async (credentials: MUserLogin) => {
    try {
      const response = await authAPI.loginMUser(credentials);
      const { access_token } = response;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const mUserData = await authAPI.getCurrentMUser();
      setMUser(mUserData);
    } catch (error) {
      throw error;
    }
  };

  const signupMUser = async (data: MUserSignup) => {
    try {
      await authAPI.signupMUser(data);
      // After successful signup, automatically log in
      await loginMUser({ email_id: data.email_id, password: data.password });
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string): Promise<PasswordResetResponse> => {
    try {
      const response = await authAPI.forgotPassword(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<PasswordResetResponse> => {
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setMUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    mUser,
    loginMUser,
    signupMUser,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
