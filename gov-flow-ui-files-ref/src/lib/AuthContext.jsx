import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { getAppPublicSettings, getCurrentUser, logout as authLogout, redirectToLogin, signIn as authSignIn } from '@/api/authApi';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const hasTriggeredLoginRedirect = useRef(false);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      try {
        const publicSettings = await getAppPublicSettings();
        setAppPublicSettings(publicSettings);
        
        // For local/mock mode we always load the current user immediately.
        await checkUserAuth();
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      hasTriggeredLoginRedirect.current = false;
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    authLogout({ redirectToCurrent: shouldRedirect });
  };

  const navigateToLogin = () => {
    if (hasTriggeredLoginRedirect.current) return;
    hasTriggeredLoginRedirect.current = true;
    redirectToLogin();
  };

  const signIn = async (identifier, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await authSignIn(identifier, password);
      setUser(currentUser);
      setIsAuthenticated(true);
      hasTriggeredLoginRedirect.current = false;
      return currentUser;
    } catch (error) {
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        setAuthError({
          type: 'auth_required',
          message: error.message || 'Authentication failed',
        });
      } else {
        setAuthError({
          type: 'unknown',
          message: error.message || 'Sign in failed',
        });
      }
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      signIn,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
