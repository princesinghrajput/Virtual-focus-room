import api from '../utils/axios';

export const getTodos = async (params = {}) => {
    try {
        // If string passed, treat as 'date' for backward compat
        const query = typeof params === 'string' ? { date: params } : params;
        const response = await api.get('/api/todos', { params: query });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createTodo = async (text, dueDate) => {
    try {
        const response = await api.post('/api/todos', { text, dueDate });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const toggleTodo = async (id) => {
    try {
        const response = await api.patch(`/api/todos/${id}/toggle`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteTodo = async (id) => {
    try {
        const response = await api.delete(`/api/todos/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
