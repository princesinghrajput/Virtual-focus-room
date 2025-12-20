import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/config/api";

export type Room = {
    id: string;
    name: string;
    isPrivate: boolean;
    participantCount: number;
    createdAt: string;
    creatorTier: string;
};

export type Participant = {
    socketId: string;
    username: string;
    userTier: string;
    userId?: string;
    isAudioEnabled?: boolean;
    isVideoEnabled?: boolean;
};

export type ChatMessage = {
    id: string;
    socketId: string;
    username: string;
    message: string;
    timestamp: string;
    attachments?: any[];
};

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
    rooms: Room[];
    currentRoom: Room | null;
    participants: Participant[];
    messages: ChatMessage[];
    createRoom: (roomName: string, username: string, userTier: string, userId?: string) => Promise<{ success: boolean; roomId?: string; error?: string }>;
    joinRoom: (roomId: string, username: string, userTier: string, userId?: string) => Promise<{ success: boolean; room?: Room; existingUsers?: Participant[]; error?: string }>;
    leaveRoom: () => void;
    sendMessage: (message: string) => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        console.log("Connecting to socket server:", API_BASE_URL);

        const socketInstance = io(API_BASE_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ["websocket"],
        });

        socketInstance.on("connect", () => {
            console.log("Socket connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        socketInstance.on("rooms:list", (roomList: Room[]) => {
            setRooms(roomList);
        });

        socketInstance.on("user:joined", (user: Participant) => {
            console.log("User joined:", user.username);
            setParticipants((prev) => {
                // Prevent duplicates
                if (prev.some((p) => p.socketId === user.socketId)) {
                    return prev;
                }
                return [...prev, user];
            });
        });

        socketInstance.on("user:left", ({ socketId }: { socketId: string }) => {
            console.log("User left:", socketId);
            setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
        });

        socketInstance.on("chat:message", (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
        });

        socketInstance.on("user:media-toggle", ({ socketId, type, enabled }: { socketId: string; type: string; enabled: boolean }) => {
            setParticipants((prev) =>
                prev.map((p) =>
                    p.socketId === socketId
                        ? { ...p, [type === "audio" ? "isAudioEnabled" : "isVideoEnabled"]: enabled }
                        : p
                )
            );
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const createRoom = useCallback(
        (roomName: string, username: string, userTier: string, userId?: string): Promise<{ success: boolean; roomId?: string; error?: string }> => {
            return new Promise((resolve) => {
                if (!socket || !isConnected) {
                    resolve({ success: false, error: "Not connected" });
                    return;
                }

                socket.emit(
                    "room:create",
                    {
                        roomName: roomName || `${username}'s Room`,
                        username,
                        isPrivate: false,
                        password: null,
                        creatorTier: userTier,
                        userId,
                    },
                    (response: any) => {
                        if (response.success) {
                            setCurrentRoom(response.room);
                            setParticipants([{ socketId: socket.id!, username, userTier, userId }]);
                            setMessages([]);
                        }
                        resolve(response);
                    }
                );
            });
        },
        [socket, isConnected]
    );

    const joinRoom = useCallback(
        (roomId: string, username: string, userTier: string, userId?: string): Promise<{ success: boolean; room?: Room; existingUsers?: Participant[]; error?: string }> => {
            return new Promise((resolve) => {
                if (!socket || !isConnected) {
                    resolve({ success: false, error: "Not connected" });
                    return;
                }

                socket.emit(
                    "room:join",
                    { roomId, username, userTier, userId },
                    (response: any) => {
                        if (response.success) {
                            setCurrentRoom(response.room);
                            // Filter out current user from existingUsers to prevent duplicates
                            const filteredExisting = (response.existingUsers || []).filter(
                                (u: Participant) => u.socketId !== socket.id
                            );
                            setParticipants([
                                ...filteredExisting,
                                { socketId: socket.id!, username, userTier, userId },
                            ]);
                            setMessages([]);
                        }
                        resolve(response);
                    }
                );
            });
        },
        [socket, isConnected]
    );

    const leaveRoom = useCallback(() => {
        if (socket) {
            socket.emit("room:leave");
            setCurrentRoom(null);
            setParticipants([]);
            setMessages([]);
        }
    }, [socket]);

    const sendMessage = useCallback(
        (message: string) => {
            if (socket && message.trim()) {
                socket.emit("chat:message", { message, attachments: [] });
            }
        },
        [socket]
    );

    return (
        <SocketContext.Provider
            value={{
                socket,
                isConnected,
                rooms,
                currentRoom,
                participants,
                messages,
                createRoom,
                joinRoom,
                leaveRoom,
                sendMessage,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
}

export default SocketContext;
