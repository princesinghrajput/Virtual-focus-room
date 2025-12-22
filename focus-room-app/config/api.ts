// API Configuration for Focus Room Mobile App
// 
// IMPORTANT: Update API_BASE_URL with your machine's IP address for mobile testing
// To find your IP:
// - Windows: Run 'ipconfig' in terminal, look for IPv4 address
// - Mac/Linux: Run 'ifconfig' or 'ip addr'
// 
// For development with Expo, mobile devices cannot access 'localhost'
// Use your actual LAN IP address (e.g., 192.168.1.100)

// Get the API URL based on environment
const getApiUrl = () => {
    // Check if we're in a web environment (can use localhost)
    if (typeof window !== "undefined" && window.location?.hostname === "localhost") {
        return "http://localhost:3000";
    }

    // For mobile/emulator, use the machine's IP address
    // Replace this with your actual machine IP address
    return "http://10.17.18.12:3000";
};

export const API_BASE_URL = getApiUrl();

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: "/api/auth/login",
        SIGNUP: "/api/auth/signup",
        PROFILE: "/api/auth/profile",
        UPGRADE: "/api/auth/upgrade",
    },
    // Friends
    FRIENDS: {
        DETAILS: "/api/friends/details",
        REQUEST: "/api/friends/request",
        ACCEPT: "/api/friends/accept",
        REJECT: "/api/friends/reject",
        SEARCH: "/api/friends/search",
    },
    // Stats
    STATS: {
        GET: "/api/stats",
        DASHBOARD: "/api/stats/dashboard",
        SESSION: "/api/stats/session",
    },
    // Todos
    TODOS: {
        LIST: "/api/todos",
        CREATE: "/api/todos",
        UPDATE: "/api/todos",
        DELETE: "/api/todos",
    },
    // Tiers
    TIERS: "/api/tiers",
};

// User Tiers
export const USER_TIERS = {
    GUEST: "guest",
    FREE: "free",
    PREMIUM: "premium",
} as const;

export type UserTier = (typeof USER_TIERS)[keyof typeof USER_TIERS];
