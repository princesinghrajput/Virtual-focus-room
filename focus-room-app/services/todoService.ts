import { API_BASE_URL } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Todo = {
    _id: string;
    text: string;
    isCompleted: boolean;
    dueDate: string;
    createdAt: string;
};

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

export const getTodos = async (date?: string): Promise<{ success: boolean; todos: Todo[] }> => {
    try {
        const headers = await getAuthHeaders();
        const params = date ? `?date=${encodeURIComponent(date)}` : "";
        const response = await fetch(`${API_BASE_URL}/api/todos${params}`, {
            method: "GET",
            headers,
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch todos:", error);
        return { success: false, todos: [] };
    }
};

export const createTodo = async (text: string, dueDate: Date): Promise<{ success: boolean; todo?: Todo }> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/api/todos`, {
            method: "POST",
            headers,
            body: JSON.stringify({ text, dueDate: dueDate.toISOString() }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to create todo:", error);
        return { success: false };
    }
};

export const toggleTodo = async (id: string): Promise<{ success: boolean }> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/api/todos/${id}/toggle`, {
            method: "PATCH",
            headers,
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to toggle todo:", error);
        return { success: false };
    }
};

export const deleteTodo = async (id: string): Promise<{ success: boolean }> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
            method: "DELETE",
            headers,
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to delete todo:", error);
        return { success: false };
    }
};
