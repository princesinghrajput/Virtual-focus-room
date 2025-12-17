/**
 * Socket Event Handlers
 * Supports user tiers, private rooms, and attachments
 */

const roomManager = require("../utils/roomManager");

/**
 * Setup all socket event handlers
 */
function setupSocketHandlers(io, socket) {
    console.log(`User connected: ${socket.id}`);

    // Send current rooms list on connect
    socket.emit("rooms:list", roomManager.getAllRooms());

    // Room events
    socket.on("room:create", (data, callback) => handleRoomCreate(io, socket, data, callback));
    socket.on("room:join", (data, callback) => handleRoomJoin(io, socket, data, callback));
    socket.on("room:leave", () => handleRoomLeave(io, socket));

    // WebRTC signaling events
    socket.on("webrtc:offer", (data) => handleWebRTCOffer(socket, data));
    socket.on("webrtc:answer", (data) => handleWebRTCAnswer(socket, data));
    socket.on("webrtc:ice-candidate", (data) => handleICECandidate(socket, data));

    // Media events
    socket.on("media:toggle", (data) => handleMediaToggle(socket, data));

    // Chat events
    socket.on("chat:message", (data) => handleChatMessage(io, socket, data));

    // User interaction events
    socket.on("user:ping", (data) => handleUserPing(socket, data));
    socket.on("request:send", (data) => handleRequestSend(socket, data));
    socket.on("request:respond", (data) => handleRequestRespond(socket, data));

    // Whiteboard events
    socket.on("whiteboard:draw", (data) => handleWhiteboardDraw(socket, data));
    socket.on("whiteboard:clear", (data) => handleWhiteboardClear(socket, data));
    socket.on("whiteboard:request-history", () => handleWhiteboardHistoryRequest(socket));

    // Disconnect
    socket.on("disconnect", () => handleDisconnect(io, socket));
}

/**
 * Handle room creation
 * Now supports private rooms and creator tier
 */
function handleRoomCreate(io, socket, { roomName, username, isPrivate, password, creatorTier, userId }, callback) {
    const { roomId, room } = roomManager.createRoom(
        roomName || `${username}'s Room`,
        isPrivate || false,
        password,
        creatorTier || 'free'
    );

    // Add creator to room with their tier
    const userData = roomManager.addUserToRoom(roomId, socket.id, username, creatorTier || 'free', userId);
    socket.join(roomId);

    console.log(`Room created: ${roomId} by ${userData.username} (${creatorTier}${isPrivate ? ', private' : ''})`);

    // Notify all clients about new room
    io.emit("rooms:list", roomManager.getAllRooms());

    callback({
        success: true,
        roomId,
        room: roomManager.getRoomData(roomId)
    });
}

/**
 * Handle room joining
 * Now supports user tiers and private room password verification
 */
function handleRoomJoin(io, socket, { roomId, username, userTier, password, userId }, callback) {
    const room = roomManager.getRoom(roomId);

    if (!room) {
        callback({ success: false, error: "Room not found" });
        return;
    }

    // Check if room is private and verify password
    if (room.isPrivate) {
        if (userTier !== 'premium') {
            callback({ success: false, error: "This is a private room. Premium membership required." });
            return;
        }
        if (room.password && password !== room.password) {
            callback({ success: false, error: "Incorrect room password" });
            return;
        }
    }

    // Get existing users before joining
    const existingUsers = Array.from(room.participants.entries())
        .map(([id, user]) => ({
            socketId: id,
            username: user.username,
            userTier: user.userTier,
            userId: user.userId // Include userId
        }));

    // Add user to room with their tier AND userId
    const userData = roomManager.addUserToRoom(roomId, socket.id, username, userTier || 'guest', userId);
    socket.join(roomId);

    console.log(`${userData.username} (${userTier || 'guest'}) joined room: ${roomId}`);

    // Notify others in room about new user including userId
    socket.to(roomId).emit("user:joined", {
        socketId: socket.id,
        username: userData.username,
        userTier: userData.userTier,
        userId: userData.userId
    });

    // Update rooms list for all
    io.emit("rooms:list", roomManager.getAllRooms());

    callback({
        success: true,
        room: roomManager.getRoomData(roomId),
        existingUsers
    });
}

/**
 * Handle room leaving
 */
function handleRoomLeave(io, socket) {
    const user = roomManager.getUser(socket.id);
    if (!user) return;

    const roomId = user.roomId;
    socket.to(roomId).emit("user:left", { socketId: socket.id });
    socket.leave(roomId);

    roomManager.removeUserFromRoom(socket.id);
    io.emit("rooms:list", roomManager.getAllRooms());
}

/**
 * Handle WebRTC offer
 */
function handleWebRTCOffer(socket, { to, offer }) {
    const user = roomManager.getUser(socket.id);
    socket.to(to).emit("webrtc:offer", {
        from: socket.id,
        username: user?.username,
        offer
    });
}

/**
 * Handle WebRTC answer
 */
function handleWebRTCAnswer(socket, { to, answer }) {
    socket.to(to).emit("webrtc:answer", {
        from: socket.id,
        answer
    });
}

/**
 * Handle ICE candidate
 */
function handleICECandidate(socket, { to, candidate }) {
    socket.to(to).emit("webrtc:ice-candidate", {
        from: socket.id,
        candidate
    });
}

/**
 * Handle media toggle
 * Guests cannot toggle media
 */
function handleMediaToggle(socket, { type, enabled }) {
    const user = roomManager.getUser(socket.id);
    if (!user) return;

    // Prevent guests from enabling audio/video
    if (user.userTier === 'guest' && (type === 'audio' || type === 'video') && enabled) {
        return; // Silently ignore
    }

    const updatedUser = roomManager.updateUserMedia(socket.id, type, enabled);
    if (!updatedUser) return;

    socket.to(user.roomId).emit("user:media-toggle", {
        socketId: socket.id,
        type,
        enabled
    });
}

/**
 * Handle chat message
 * Guests cannot send messages
 */
function handleChatMessage(io, socket, { message, attachments }) {
    const user = roomManager.getUser(socket.id);
    if (!user) return;

    // Prevent guests from sending messages
    if (user.userTier === 'guest') {
        socket.emit("chat:error", { error: "Guests cannot send messages" });
        return;
    }

    const chatMessage = {
        id: `msg_${Date.now()}`,
        socketId: socket.id,
        username: user.username,
        message,
        attachments: attachments || [],
        timestamp: new Date().toISOString()
    };

    roomManager.addMessageToRoom(user.roomId, chatMessage);
    io.to(user.roomId).emit("chat:message", chatMessage);
}

/**
 * Handle user ping
 * Guests cannot ping
 */
function handleUserPing(socket, { targetSocketId }) {
    const user = roomManager.getUser(socket.id);
    if (!user) return;

    // Prevent guests from pinging
    if (user.userTier === 'guest') {
        return;
    }

    socket.to(targetSocketId).emit("user:pinged", {
        from: socket.id,
        username: user.username
    });
}

/**
 * Handle connection request
 */
function handleRequestSend(socket, { targetSocketId, message }) {
    const user = roomManager.getUser(socket.id);
    if (!user) return;

    socket.to(targetSocketId).emit("request:received", {
        from: socket.id,
        username: user.username,
        message
    });
}

/**
 * Handle request response
 */
function handleRequestRespond(socket, { targetSocketId, accepted }) {
    const user = roomManager.getUser(socket.id);
    if (!user) return;

    socket.to(targetSocketId).emit("request:response", {
        from: socket.id,
        username: user.username,
        accepted
    });
}

/**
 * Handle disconnect
 */
function handleDisconnect(io, socket) {
    console.log(`User disconnected: ${socket.id}`);

    const user = roomManager.getUser(socket.id);
    if (user) {
        socket.to(user.roomId).emit("user:left", { socketId: socket.id });
        roomManager.removeUserFromRoom(socket.id);
        io.emit("rooms:list", roomManager.getAllRooms());
    }
}

/**
 * Handle whiteboard draw event
 */
function handleWhiteboardDraw(socket, data) {
    const user = roomManager.getUser(socket.id);
    if (user) {
        roomManager.addWhiteboardAction(user.roomId, data);
        socket.to(user.roomId).emit("whiteboard:draw", data);
    }
}

/**
 * Handle whiteboard clear event
 */
function handleWhiteboardClear(socket, data) {
    const user = roomManager.getUser(socket.id);
    if (user) {
        roomManager.clearWhiteboardHistory(user.roomId);
        socket.to(user.roomId).emit("whiteboard:clear");
    }
}

/**
 * Handle whiteboard history request
 */
function handleWhiteboardHistoryRequest(socket) {
    const user = roomManager.getUser(socket.id);
    if (user) {
        const history = roomManager.getWhiteboardHistory(user.roomId);
        socket.emit("whiteboard:history", history);
    }
}

module.exports = { setupSocketHandlers };
