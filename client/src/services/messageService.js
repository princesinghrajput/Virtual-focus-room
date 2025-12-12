import axios from '@/utils/axios';

export const getDashboardData = async () => {
    try {
        const res = await axios.get('/api/stats/dashboard');
        return res.data;
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        return { success: false };
    }
};

export const getMessages = async (roomId = null, limit = 50, sessionId = null) => {
    try {
        const params = { limit };
        if (roomId) params.roomId = roomId;
        if (sessionId) params.sessionId = sessionId;
        const res = await axios.get('/api/messages', { params });
        return res.data;
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        return { success: false };
    }
};

export const saveMessage = async (messageData, mediaFile = null) => {
    try {
        const formData = new FormData();
        formData.append('roomId', messageData.roomId);
        formData.append('content', messageData.content);
        if (messageData.sessionId) formData.append('sessionId', messageData.sessionId);
        if (mediaFile) formData.append('media', mediaFile);

        const res = await axios.post('/api/messages', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    } catch (error) {
        console.error('Failed to save message:', error);
        return { success: false };
    }
};
