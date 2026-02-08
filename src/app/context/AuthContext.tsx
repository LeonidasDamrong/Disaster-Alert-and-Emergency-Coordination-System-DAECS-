import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../lib/types';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser({
            id: userData.userId,
            userId: userData.userId,
            name: userData.name,
            email: userData.email,
            role: userData.role as UserRole,
            phone: userData.phone,
            password: '', // Not needed on client
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (userId: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(userId, password);

      // Store JWT token
      localStorage.setItem('authToken', response.token);

      // Set user data
      setUser({
        id: response.userId,
        userId: response.userId,
        name: response.name,
        email: response.email,
        role: response.role as UserRole,
        phone: response.phone,
        password: '', // Not needed on client
        createdAt: new Date().toISOString()
      });

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    // Clear token and user data
    localStorage.removeItem('authToken');
    setUser(null);

    // Optional: Call backend logout endpoint
    authApi.logout().catch(() => {
      // Ignore errors on logout
    });
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user?.role != null && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        hasAnyRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};