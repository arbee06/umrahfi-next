import { createContext, useContext, useState, useEffect } from 'react';
import authService from '@/services/authService';
import { useRouter } from 'next/router';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const inactivityTimeout = 2 * 60 * 1000; // 2 minutes in milliseconds

  useEffect(() => {
    checkAuth();
  }, []);

  // Setup inactivity timer
  useEffect(() => {
    if (!user) return;

    const checkInactivity = () => {
      if (Date.now() - lastActivity > inactivityTimeout) {
        logout();
        alert('You have been logged out due to inactivity.');
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkInactivity, 30000);

    // Activity event listeners
    const updateActivity = () => setLastActivity(Date.now());
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [user, lastActivity]);

  const checkAuth = async () => {
    try {
      // Debug: Check cookies first
      console.log('Checking auth...');
      
      const response = await authService.getCurrentUser();
      console.log('Auth response:', response);
      
      if (response && response.user) {
        setUser(response.user);
        setLastActivity(Date.now()); // Reset activity on successful auth
      } else {
        setUser(null);
      }
    } catch (error) {
      // Don't log out on auth check failure, just set user to null
      console.error('Auth check error:', error.response?.data || error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      
      // Redirect based on role
      if (response.user.role === 'admin') {
        router.push('/admin');
      } else if (response.user.role === 'company') {
        router.push('/company');
      } else {
        router.push('/customer');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      
      // Redirect based on role
      if (response.user.role === 'company') {
        router.push('/company');
      } else {
        router.push('/customer');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCompany: user?.role === 'company',
    isCustomer: user?.role === 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};