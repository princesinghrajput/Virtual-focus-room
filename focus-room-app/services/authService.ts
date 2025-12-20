import api from "./api";
import { API_ENDPOINTS } from "@/config/api";

export type User = {
    _id: string;
    name: string;
    email: string;
    tier: "guest" | "free" | "premium";
    friends: string[];
    createdAt: string;
};

type AuthResponse = {
    success: boolean;
    user: User;
    token: string;
    message?: string;
};

type ProfileResponse = {
    success: boolean;
    user: User;
};

// Login user
export async function login(email: string, password: string): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        { email, password },
        false
    );
    if (data.success && data.token) {
        await api.setToken(data.token);
    }
    return data;
}

// Signup user
export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH.SIGNUP,
        { name, email, password },
        false
    );
    if (data.success && data.token) {
        await api.setToken(data.token);
    }
    return data;
}

// Get current user profile
export async function getProfile(): Promise<ProfileResponse> {
    return api.get<ProfileResponse>(API_ENDPOINTS.AUTH.PROFILE);
}

// Update profile
export async function updateProfile(userData: Partial<User>): Promise<ProfileResponse> {
    return api.put<ProfileResponse>(API_ENDPOINTS.AUTH.PROFILE, userData);
}

// Upgrade to premium
export async function upgradeToPremium(): Promise<{ success: boolean; user: User }> {
    return api.post(API_ENDPOINTS.AUTH.UPGRADE, {});
}

// Logout (clear token)
export async function logout(): Promise<void> {
    await api.removeToken();
}
