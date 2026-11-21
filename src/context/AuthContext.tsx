import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, setSessionExpiryHandler } from '../config/api';
import authService, { StudentLoginPayload, StaffLoginPayload } from '../services/authService';
import parentService from '../services/parentService';
import { StudentUser, StaffUser, ParentUser, UserRole } from '../types';

interface AuthContextType {
  token: string | null;
  userType: UserRole | null;
  user: StudentUser | StaffUser | ParentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  studentLogin: (payload: StudentLoginPayload) => Promise<void>;
  staffLogin: (payload: StaffLoginPayload) => Promise<void>;
  parentLogin: (token: string, user: ParentUser) => Promise<void>;
  switchChild: (studentId: number | string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserRole | null>(null);
  const [user, setUser] = useState<StudentUser | StaffUser | ParentUser | null>(null);
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

          // Silently verify and refresh token in the background
          authService.verifyToken().then((res) => {
            if (res?.token && res.token !== storedToken) {
              setToken(res.token);
              AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
            }
          }).catch((err: any) => {
            // If the server explicitly rejected the token as invalid or expired (401), clear credentials
            if (err?.response?.status === 401) {
              logout();
            }
          });
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

  const parentLogin = async (parentToken: string, parentUser: ParentUser) => {
    setIsLoading(true);
    try {
      setToken(parentToken);
      setUser(parentUser);
      setUserType('parent');

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, parentToken],
        [STORAGE_KEYS.USER, JSON.stringify(parentUser)],
        [STORAGE_KEYS.USER_TYPE, 'parent'],
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const switchChild = async (studentId: number | string): Promise<boolean> => {
    try {
      const res = await parentService.switchChild(studentId);
      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        setUserType('parent');

        await AsyncStorage.multiSet([
          [STORAGE_KEYS.TOKEN, res.token],
          [STORAGE_KEYS.USER, JSON.stringify(res.user)],
          [STORAGE_KEYS.USER_TYPE, 'parent'],
        ]);
        return true;
      }
      return false;
    } catch {
      return false;
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
      const res = await authService.verifyToken();
      if (res?.token) {
        setToken(res.token);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
      }
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
        parentLogin,
        switchChild,
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

