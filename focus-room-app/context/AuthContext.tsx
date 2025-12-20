import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as authService from "@/services/authService";
import { User } from "@/services/authService";
import api from "@/services/api";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = await api.getToken();
            if (token) {
                const data = await authService.getProfile();
                if (data.success) {
                    setUser(data.user);
                } else {
                    await api.removeToken();
                }
            }
        } catch (error) {
            console.log("No valid session");
            await api.removeToken();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const data = await authService.login(email, password);
            if (data.success) {
                setUser(data.user);
                return { success: true };
            }
            return { success: false, error: data.message || "Login failed" };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Connection error";
            return { success: false, error: message };
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        try {
            const data = await authService.signup(name, email, password);
            if (data.success) {
                setUser(data.user);
                return { success: true };
            }
            return { success: false, error: data.message || "Signup failed" };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Connection error";
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const refreshProfile = async () => {
        try {
            const data = await authService.getProfile();
            if (data.success) {
                setUser(data.user);
            }
        } catch (error) {
            console.error("Failed to refresh profile:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isLoggedIn: !!user,
                login,
                signup,
                logout,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
