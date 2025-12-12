import axios from '@/utils/axios';

export const recordSession = async (roomId, event, sessionId = null, roomName = null) => {
    try {
        const res = await axios.post('/api/stats/session', { roomId, roomName, event, sessionId });
        return res.data;
    } catch (error) {
        console.error('Failed to record session:', error);
        return { success: false };
    }
};

export const toggleSessionPrivacy = async (sessionId) => {
    try {
        const res = await axios.patch(`/api/stats/session/${sessionId}/privacy`);
        return res.data;
    } catch (error) {
        console.error('Failed to toggle session privacy:', error);
        return { success: false };
    }
};
