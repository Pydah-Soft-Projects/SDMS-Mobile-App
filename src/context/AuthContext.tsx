import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, setSessionExpiryHandler } from '../config/api';
import authService, { StudentLoginPayload, StaffLoginPayload } from '../services/authService';
import { StudentUser, StaffUser, UserRole } from '../types';

interface AuthContextType {
  token: string | null;
  userType: UserRole | null;
  user: StudentUser | StaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  studentLogin: (payload: StudentLoginPayload) => Promise<void>;
  staffLogin: (payload: StaffLoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserRole | null>(null);
  const [user, setUser] = useState<StudentUser | StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored session on mount
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const storedType = (await AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE)) as UserRole | null;

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setUserType(storedType || 'student');
        }
      } catch (e) {
        console.error('Failed to restore auth session from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();

    // Register session expiry listener
    setSessionExpiryHandler(() => {
      setToken(null);
      setUser(null);
      setUserType(null);
    });
  }, []);

  const studentLogin = async (payload: StudentLoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authService.studentLogin(payload);
      setToken(res.token);
      setUser(res.user);
      setUserType(res.userType);

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, res.token],
        [STORAGE_KEYS.USER, JSON.stringify(res.user)],
        [STORAGE_KEYS.USER_TYPE, res.userType],
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const staffLogin = async (payload: StaffLoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authService.staffLogin(payload);
      setToken(res.token);
      setUser(res.user);
      setUserType(res.userType);

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, res.token],
        [STORAGE_KEYS.USER, JSON.stringify(res.user)],
        [STORAGE_KEYS.USER_TYPE, res.userType],
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.USER_TYPE,
      ]);
      setToken(null);
      setUser(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      await authService.verifyToken();
    } catch {
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userType,
        user,
        isAuthenticated: !!token,
        isLoading,
        studentLogin,
        staffLogin,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

