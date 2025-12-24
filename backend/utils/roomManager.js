/**
 * Room Management Utilities
 * Supports public and private rooms, user tiers
 */

// In-memory storage for rooms and users
const rooms = new Map();
const users = new Map();

/**
 * Get room data by ID
 */
function getRoomData(roomId) {
    const room = rooms.get(roomId);
    if (!room) return null;

    const participants = Array.from(room.participants.values()).map(user => ({
        socketId: user.socketId,
        username: user.username,
        userTier: user.userTier,
        userId: user.userId,
        isAudioOn: user.isAudioOn,
        isVideoOn: user.isVideoOn
    }));

    return {
        id: roomId,
        name: room.name,
        isPrivate: room.isPrivate || false,
        creatorTier: room.creatorTier,
        participants,
        createdAt: room.createdAt
    };
}

/**
 * Get all active rooms list
 */
function getAllRooms() {
    const roomList = [];
    rooms.forEach((room, roomId) => {
        roomList.push({
            id: roomId,
            name: room.name,
            isPrivate: room.isPrivate || false,
            participantCount: room.participants.size,
            createdAt: room.createdAt
        });
    });
    return roomList;
}

/**
 * Create a new room
 * @param {string} roomName - Name of the room
 * @param {boolean} isPrivate - Whether the room is private
 * @param {string} password - Optional password for private rooms
 * @param {string} creatorTier - Tier of the room creator
 */
function createRoom(roomName, isPrivate = false, password = null, creatorTier = 'free') {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const room = {
        name: roomName || `Room ${roomId.slice(-4)}`,
        isPrivate: isPrivate && creatorTier === 'premium',
        password: isPrivate && creatorTier === 'premium' ? password : null,
        creatorTier,
        participants: new Map(),
        messages: [],
        whiteboardHistory: [],
        createdAt: new Date().toISOString()
    };

    rooms.set(roomId, room);
    return { roomId, room };
}

/**
 * Add user to room
 * @param {string} roomId - Room ID
 * @param {string} socketId - User socket ID
 * @param {string} username - Username
 * @param {string} userTier - User tier (guest/free/premium)
 */
function addUserToRoom(roomId, socketId, username, userTier = 'guest', userId = null) {
    const room = rooms.get(roomId);
    if (!room) return null;

    // Guests cannot enable video/audio by default
    const isGuest = userTier === 'guest';

    const userData = {
        socketId,
        username: username || `User_${socketId.slice(-4)}`,
        roomId,
        userTier,
        userId, // Store DB ID
        isAudioOn: !isGuest,
        isVideoOn: !isGuest
    };

    room.participants.set(socketId, userData);
    users.set(socketId, userData);

    return userData;
}

/**
 * Verify room password
 */
function verifyRoomPassword(roomId, password) {
    const room = rooms.get(roomId);
    if (!room || !room.isPrivate) return true;
    return room.password === password;
}

/**
 * Check if room is private
 */
function isRoomPrivate(roomId) {
    const room = rooms.get(roomId);
    return room?.isPrivate || false;
}

/**
 * Remove user from room
 */
function removeUserFromRoom(socketId) {
    const user = users.get(socketId);
    if (!user) return null;

    const room = rooms.get(user.roomId);
    if (room) {
        room.participants.delete(socketId);

        // Delete room if empty
        if (room.participants.size === 0) {
            rooms.delete(user.roomId);
            console.log(`Room deleted: ${user.roomId} (empty)`);
        }
    }

    users.delete(socketId);
    return user;
}

/**
 * Get user by socket ID
 */
function getUser(socketId) {
    return users.get(socketId);
}

/**
 * Get room by ID
 */
function getRoom(roomId) {
    return rooms.get(roomId);
}

/**
 * Update user media state
 */
function updateUserMedia(socketId, type, enabled) {
    const user = users.get(socketId);
    if (!user) return null;

    // Guests cannot enable video/audio
    if (user.userTier === 'guest' && (type === 'audio' || type === 'video')) {
        return user; // Don't update for guests
    }

    if (type === "audio") {
        user.isAudioOn = enabled;
    } else if (type === "video") {
        user.isVideoOn = enabled;
    }

    return user;
}

/**
 * Add message to room
 */
function addMessageToRoom(roomId, message) {
    const room = rooms.get(roomId);
    if (!room) return null;

    room.messages.push(message);

    // Keep only last 100 messages
    if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
    }

    return message;
}

/**
 * Add whiteboard action to history
 */
function addWhiteboardAction(roomId, action) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.whiteboardHistory.push(action);
    return action;
}

/**
 * Clear whiteboard history
 */
function clearWhiteboardHistory(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.whiteboardHistory = [];
}

/**
 * Get whiteboard history
 */
function getWhiteboardHistory(roomId) {
    const room = rooms.get(roomId);
    return room ? room.whiteboardHistory : [];
}

module.exports = {
    rooms,
    users,
    getRoomData,
    getAllRooms,
    createRoom,
    addUserToRoom,
    removeUserFromRoom,
    getUser,
    getRoom,
    updateUserMedia,
    addMessageToRoom,
    verifyRoomPassword,
    isRoomPrivate,
    addWhiteboardAction,
    clearWhiteboardHistory,
    getWhiteboardHistory
};

