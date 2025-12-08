/**
 * Authentication Context
 * Manages user authentication state and tier levels:
 * - guest: Not logged in, view only
 * - free: Logged in, full basic features
 * - premium: Paid user, can create private rooms
 */

import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_AUTH = `${API_BASE}/api/auth`;
const API_TIERS = `${API_BASE}/api/tiers`;

// User tiers
export const USER_TIERS = {
    GUEST: 'guest',
    FREE: 'free',
    PREMIUM: 'premium'
};

// Tier permissions
export const TIER_PERMISSIONS = {
    [USER_TIERS.GUEST]: {
        canToggleVideo: false,
        canToggleAudio: false,
        canChat: false,
        canShareScreen: false,
        canCreateRoom: true,
        canCreatePrivateRoom: false,
        canPingUsers: false,
        canSendAttachments: false,
    },
    [USER_TIERS.FREE]: {
        canToggleVideo: true,
        canToggleAudio: true,
        canChat: true,
        canShareScreen: true,
        canCreateRoom: true,
        canCreatePrivateRoom: false,
        canPingUsers: true,
        canSendAttachments: true,
    },
    [USER_TIERS.PREMIUM]: {
        canToggleVideo: true,
        canToggleAudio: true,
        canChat: true,
        canShareScreen: true,
        canCreateRoom: true,
        canCreatePrivateRoom: true,
        canPingUsers: true,
        canSendAttachments: true,
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('focusroom_token'));
    const [isLoading, setIsLoading] = useState(true);
    const [tierPermissions, setTierPermissions] = useState(TIER_PERMISSIONS);

    // Fetch tier permissions from backend
    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/tiers`);
                const data = await res.json();
                if (data.success && data.tiers) {
                    setTierPermissions(data.tiers);
                }
            } catch (err) {
                console.error("Failed to load tier permissions:", err);
            }
        };
        fetchTiers();
    }, []);

    // Load user profile if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await fetch(`${API_AUTH}/profile`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await res.json();

                    if (data.success) {
                        setUser(data.user);
                    } else {
                        // Token invalid/expired
                        localStorage.removeItem('focusroom_token');
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Auth Error:", error);
                    // Don't modify state on connection error, maybe minor outage
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, [token]);

    // Get current tier
    const tier = user?.tier || USER_TIERS.GUEST;
    const permissions = tierPermissions[tier] || tierPermissions[USER_TIERS.GUEST];

    // Login function
    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_AUTH}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('focusroom_token', data.token);
                setToken(data.token);
                setUser(data.user);
                toast.success(`Welcome back, ${data.user.name}!`);
                return { success: true, user: data.user };
            } else {
                toast.error(data.message || 'Login failed');
                return { success: false, error: data.message };
            }
        } catch (error) {
            toast.error('Connection error. Is backend running?');
            return { success: false, error: 'Connection error' };
        }
    };

    // Signup function
    const signup = async (email, password, name) => {
        try {
            const res = await fetch(`${API_AUTH}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('focusroom_token', data.token);
                setToken(data.token);
                setUser(data.user);
                toast.success(`Account created! Welcome, ${data.user.name}!`);
                return { success: true, user: data.user };
            } else {
                toast.error(data.message || 'Signup failed');
                return { success: false, error: data.message };
            }
        } catch (error) {
            toast.error('Connection error');
            return { success: false, error: 'Connection error' };
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('focusroom_token');
        localStorage.removeItem('focusroom_username'); // Clear legacy item if present
        toast.success('Logged out successfully');
    };

    // Upgrade to premium
    const upgradeToPremium = async () => {
        if (!token) {
            toast.error('Please login first');
            return { success: false };
        }

        try {
            const res = await fetch(`${API_AUTH}/upgrade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                setUser(data.user);
                toast.success('🎉 Upgraded to Premium! Enjoy exclusive features.');
                return { success: true };
            } else {
                toast.error(data.message || 'Upgrade failed');
                return { success: false, error: data.message };
            }
        } catch (error) {
            toast.error('Connection error');
            return { success: false };
        }
    };

    // Update Profile
    const updateProfile = async (userData) => {
        if (!token) throw new Error('Not authenticated');

        const res = await fetch(`${API_AUTH}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        const data = await res.json();

        if (data.success) {
            setUser(data.user);
            return data.user;
        } else {
            throw new Error(data.message || 'Update failed');
        }
    };

    // Check if user can perform action
    const canPerformAction = (action) => {
        return permissions[action] || false;
    };

    const value = {
        user,
        tier,
        token,
        permissions,
        isLoading,
        isGuest: !user,
        isFree: tier === USER_TIERS.FREE,
        isPremium: tier === USER_TIERS.PREMIUM,
        isLoggedIn: !!user,
        login,
        signup,
        logout,
        upgradeToPremium,
        updateProfile,
        canPerformAction,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
