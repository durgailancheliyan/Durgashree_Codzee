import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { User } from '@/interfaces';


interface LoginRequest {
    email: string;
    password: string;
}

interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    Phone: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: LoginRequest) => Promise<User>;
    register: (credentials: RegisterRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => void;
    isAuthenticated: boolean;
    isOnboarded: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'auth_user';
const TOKEN_STORAGE_KEY = 'token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Initialize auth state from storage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
                const storedUser = localStorage.getItem(USER_STORAGE_KEY);
                
                if (storedToken && storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setToken(storedToken);
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                    setIsOnboarded(parsedUser.isOnboarded);
                    
                    // Verify token is still valid
                    try {
                        const validToken = await authService.validateToken(storedToken);
                        if(!validToken) {
                            navigate('/auth'); // Redirect to auth page if token is invalid
                            logout();
                        }
                    } catch (error) {
                        logout();
                    }
                }
            } catch (error) {
                logout();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [navigate]);

    const login = async (credentials: LoginRequest): Promise<User> => {
        setLoading(true);
        
        try {
            const response = await authService.login(credentials.email, credentials.password);

            if (!response.token || !response.user) {
                throw new Error('Invalid response from server');
            }

            // Store token and user in localStorage
            localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // Update state
            setToken(response.token);
            setUser(response.user);
            setIsAuthenticated(true);
            setIsOnboarded(response.user.isOnboarded);
            return response.user;
        } catch (error: any) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        authService.logout();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setIsOnboarded(false);
    };

    const register = async (credentials: RegisterRequest) => {
        setLoading(true);
        try {
            const response = await authService.register(credentials);
            localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
            localStorage.setItem('user', JSON.stringify(response.user));
            setToken(response.token);
            setUser(response.user);
            setIsAuthenticated(true);
            setIsOnboarded(response.user.isOnboarded);
        } catch (error: any) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = useCallback(() => {
        try {
            const storedUser = localStorage.getItem(USER_STORAGE_KEY);
            const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
            if (storedUser && storedToken) {
                const parsed = JSON.parse(storedUser) as User;
                setUser(parsed);
                setIsOnboarded(parsed.isOnboarded);
                setToken(storedToken);
                setIsAuthenticated(true);
            }
        } catch {
            logout();
        }
    }, []);

    const value = {
        user,
        token,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated,
        isOnboarded,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
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

