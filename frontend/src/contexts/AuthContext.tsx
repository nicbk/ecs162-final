import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  username: string;
  oauth_id: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated using your existing endpoint
    fetch('/api/v1/authed-user', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(userData => {
        console.log('Auth response:', userData); // DEBUG LOG
        // Handle both your existing response format and false/null responses
        if (userData && userData !== false && userData !== null) {
          setUser({
            email: userData.email || '',
            username: userData.username || userData.preferred_username || 'User',
            oauth_id: userData.oauthId || userData.sub || 'unknown'
          });
        } else {
          setUser(null);
        }
      })
      .catch((error) => {
        console.log('Auth check failed:', error);
        setUser(null);
      })
      .finally(() => {
        console.log('Auth loading finished'); // DEBUG LOG
        setLoading(false);
      });
  }, []);
  
  const login = () => {
    const currentUrl = window.location.pathname + window.location.search;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    window.location.href = `${backendUrl}/login?originUrl=${encodeURIComponent(currentUrl)}`;
  };

  const logout = () => {
    // Immediately clear local state and redirect - don't wait for backend
    setUser(null);
    
    // Fire and forget - try to clear backend session but don't wait
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    fetch(`${backendUrl}/logout`, { 
      method: 'GET', 
      credentials: 'include',
      mode: 'cors'
    }).catch(() => {
      // Ignore any errors - we already logged out locally
    });
    
    // Immediate redirect
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};