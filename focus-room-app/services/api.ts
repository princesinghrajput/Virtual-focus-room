import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/api";

const TOKEN_KEY = "focusroom_token";

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: any;
    headers?: Record<string, string>;
    requireAuth?: boolean;
};

class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getToken(): Promise<string | null> {
        return await AsyncStorage.getItem(TOKEN_KEY);
    }

    async setToken(token: string): Promise<void> {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    }

    async removeToken(): Promise<void> {
        await AsyncStorage.removeItem(TOKEN_KEY);
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = "GET", body, headers = {}, requireAuth = true } = options;

        const requestHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...headers,
        };

        if (requireAuth) {
            const token = await this.getToken();
            if (token) {
                requestHeaders["Authorization"] = `Bearer ${token}`;
            }
        }

        const config: RequestInit = {
            method,
            headers: requestHeaders,
        };

        if (body && method !== "GET") {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Request failed");
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Network error");
        }
    }

    // Convenience methods
    async get<T>(endpoint: string, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: "GET", requireAuth });
    }

    async post<T>(endpoint: string, body: any, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: "POST", body, requireAuth });
    }

    async put<T>(endpoint: string, body: any, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: "PUT", body, requireAuth });
    }

    async delete<T>(endpoint: string, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE", requireAuth });
    }

    async patch<T>(endpoint: string, body: any, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: "PATCH", body, requireAuth });
    }
}

export const api = new ApiService(API_BASE_URL);
export default api;
