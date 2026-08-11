import React, { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from "next/router";
import { IAuth } from "@/domain/models";
import { authService } from '@/services';
import { toast } from 'react-hot-toast';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: IAuth | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUserRole = (token?: string) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = typeof window !== 'undefined' 
            ? window.atob(base64) 
            : Buffer.from(base64, 'base64').toString('utf-8');
        const decoded = JSON.parse(jsonPayload);
        const role = decoded.role || (decoded.roles && decoded.roles[0]?.name) || decoded.role_name;
        return typeof role === 'string' ? role.toUpperCase() : null;
    } catch (e) {
        return null;
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<IAuth | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await authService.auth();
                if (currentUser?.token) {
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Authentication check failed:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const currentUser = await authService.login({ email, password });
            setUser(currentUser);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoading) return;

        const publicRoutes = ['/home', '/'];
        const isPublicRoute = publicRoutes.includes(router.pathname);
        const isMaintenanceRoute = router.pathname.startsWith('/maintenance');
        const isUnitRoute = router.pathname.startsWith('/unit');

        if (!isAuthenticated) {
            if (!isPublicRoute) {
                router.replace('/home');
            }
        } else {
            if (isPublicRoute) {
                const role = getUserRole(user?.token);
                if (role === 'ADMIN') {
                    router.replace('/admin/dashboard');
                } else if (role === 'MAINTENANCE') {
                    router.replace('/maintenance/dashboard');
                } else {
                    router.replace('/home');
                }
            } else if (isMaintenanceRoute || isUnitRoute) {
            } else if (getUserRole(user?.token) === 'ADMIN') {
                router.replace('/admin/dashboard');
            } else if (getUserRole(user?.token) === 'MAINTENANCE') {
                router.replace('/maintenance');
            } else {
                toast.error("Akses ditolak: Peran pengguna tidak dikenali atau Anda tidak memiliki izin.");
                logout().then(() => {
                    router.replace('/home');
                });
            }
        }
    }, [isAuthenticated, isLoading, router.pathname, user?.token]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
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

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated && router.pathname !== '/home') {
        return null;
    }

    return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.replace('/home');
        return null;
    }

    const roleName = getUserRole(user?.token);
    if (roleName !== 'ADMIN') {
        router.replace('/maintenance');
        return null;
    }

    return <>{children}</>;
};

export const MekanikRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.replace('/home');
        return null;
    }

    const roleName = getUserRole(user?.token);
    if (roleName !== 'MAINTENANCE') {
        router.replace('/admin/dashboard');
        return null;
    }

    return <>{children}</>;
};

export default AuthProvider;