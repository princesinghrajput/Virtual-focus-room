import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert, Dimensions, Modal, Vibration } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSocket, ChatMessage, Participant } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { useCamera, CameraView } from "@/context/CameraContext";
import { useTheme } from "@/context/ThemeContext";
import { getTodos, createTodo, toggleTodo, deleteTodo, Todo } from "@/services/todoService";
import Jamboard from "@/components/Jamboard";
import AmbientPlayer from "@/components/AmbientPlayer";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function RoomScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ roomId: string; roomName: string }>();
    const { currentRoom, participants, messages, leaveRoom, sendMessage, isConnected, socket } = useSocket();
    const { user, isLoggedIn } = useAuth();
    const { theme, isDark } = useTheme();
    const {
        hasPermission,
        isAudioEnabled,
        isVideoEnabled,
        cameraType,
        toggleAudio,
        toggleVideo,
        switchCamera,
    } = useCamera();

    const [messageText, setMessageText] = useState("");
    const [showParticipants, setShowParticipants] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showJamboard, setShowJamboard] = useState(false);
    const [showTodos, setShowTodos] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showAmbientPlayer, setShowAmbientPlayer] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Todo state
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodoText, setNewTodoText] = useState("");

    // Timer state
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerMode, setTimerMode] = useState<"stopwatch" | "countdown">("stopwatch");
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const backgroundColors = isDark
        ? [theme.gradientStart, theme.gradientMid, theme.gradientEnd] as const
        : [theme.background, theme.backgroundSecondary, theme.backgroundTertiary] as const;

    // Filter unique participants by socketId
    const uniqueParticipants = useMemo(() => {
        const seen = new Set<string>();
        return participants.filter((p) => {
            if (seen.has(p.socketId)) {
                return false;
            }
            seen.add(p.socketId);
            return true;
        });
    }, [participants]);

    // Timer logic
    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => {
                    if (timerMode === "countdown" && prev <= 1) {
                        setIsTimerRunning(false);
                        Vibration.vibrate([0, 500, 200, 500]);
                        Alert.alert("Timer Complete! 🎉", "Great focus session!");
                        return 0;
                    }
                    return timerMode === "stopwatch" ? prev + 1 : prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning, timerMode]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const startStopwatch = () => { setTimerMode("stopwatch"); setTimerSeconds(0); setIsTimerRunning(true); setShowTimer(false); };
    const startCountdown = (mins: number) => { setTimerMode("countdown"); setTimerSeconds(mins * 60); setIsTimerRunning(true); setShowTimer(false); };
    const toggleTimer = () => setIsTimerRunning(prev => !prev);
    const resetTimer = () => { setIsTimerRunning(false); setTimerSeconds(0); };

    // Fetch todos
    const fetchTodos = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const today = new Date().toISOString();
            const res = await getTodos(today);
            if (res.success) setTodos(res.todos);
        } catch (error) {
            console.error("Failed to fetch todos:", error);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (showTodos) fetchTodos();
    }, [showTodos, fetchTodos]);

    const handleAddTodo = async () => {
        if (!newTodoText.trim()) return;
        try {
            const res = await createTodo(newTodoText.trim(), new Date());
            if (res.success && res.todo) {
                setTodos(prev => [...prev, res.todo!]);
                setNewTodoText("");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to add task");
        }
    };

    const handleToggleTodo = async (id: string) => {
        try {
            const res = await toggleTodo(id);
            if (res.success) {
                setTodos(prev => prev.map(t => t._id === id ? { ...t, isCompleted: !t.isCompleted } : t));
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update task");
        }
    };

    const handleDeleteTodo = async (id: string) => {
        try {
            const res = await deleteTodo(id);
            if (res.success) {
                setTodos(prev => prev.filter(t => t._id !== id));
            }
        } catch (error) {
            Alert.alert("Error", "Failed to delete task");
        }
    };

    // Handle leaving room
    const handleLeave = () => {
        Alert.alert("Leave Room", "Are you sure you want to leave this room?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Leave",
                style: "destructive",
                onPress: () => {
                    socket?.emit("media:toggle", { type: "video", enabled: false });
                    socket?.emit("media:toggle", { type: "audio", enabled: false });
                    leaveRoom();
                    router.back();
                },
            },
        ]);
    };

    // Send message
    const handleSend = () => {
        if (messageText.trim() && isLoggedIn) {
            sendMessage(messageText.trim());
            setMessageText("");
        }
    };

    // Notify others about media status
    useEffect(() => {
        if (socket && isConnected) {
            socket.emit("media:toggle", { type: "audio", enabled: isAudioEnabled });
        }
    }, [isAudioEnabled, socket, isConnected]);

    useEffect(() => {
        if (socket && isConnected) {
            socket.emit("media:toggle", { type: "video", enabled: isVideoEnabled });
        }
    }, [isVideoEnabled, socket, isConnected]);

    // Auto scroll to bottom on new messages
    useEffect(() => {
        if (showChat) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages, showChat]);

    const roomName = currentRoom?.name || params.roomName || "Focus Room";

    // Calculate video grid layout
    const getGridLayout = () => {
        const count = uniqueParticipants.length;
        if (count <= 1) return { cols: 1, rows: 1 };
        if (count === 2) return { cols: 2, rows: 1 };
        if (count <= 4) return { cols: 2, rows: 2 };
        if (count <= 6) return { cols: 2, rows: 3 };
        return { cols: 3, rows: Math.ceil(count / 3) };
    };

    const { cols, rows } = getGridLayout();
    const GRID_GAP = 8;
    const cellWidth = (SCREEN_WIDTH - GRID_GAP * (cols + 1) - 16) / cols;
    const videoContainerHeight = showChat || showParticipants || showTodos ? SCREEN_HEIGHT * 0.3 : SCREEN_HEIGHT * 0.55;
    const cellHeight = Math.min((videoContainerHeight - GRID_GAP * (rows + 1)) / rows, cellWidth * 1.2);

    const pendingTodos = todos.filter(t => !t.isCompleted).length;

    // Close all panels
    const closeAllPanels = () => {
        setShowChat(false);
        setShowParticipants(false);
        setShowTodos(false);
    };

    // Render participant video cell
    const renderParticipantCell = (participant: Participant, index: number) => {
        const isMe = participant.socketId === socket?.id;
        const showVideo = isMe ? (hasPermission && isVideoEnabled) : participant.isVideoEnabled !== false;

        return (
            <View key={`${participant.socketId}-${index}`} style={[styles.videoCell, { width: cellWidth, height: cellHeight, backgroundColor: theme.surface }]}>
                {isMe && hasPermission && isVideoEnabled ? (
                    <CameraView
                        style={styles.videoStream}
                        facing={cameraType}
                    />
                ) : (
                    <LinearGradient colors={isDark ? ["#1e1e3f", "#0f0f2a"] : ["#e2e8f0", "#cbd5e1"]} style={styles.noVideoPlaceholder}>
                        <View style={[styles.avatarCircle, { backgroundColor: theme.primaryLight, borderColor: theme.primaryBorder }]}>
                            <Text style={[styles.avatarText, { color: theme.text }]}>{participant.username?.charAt(0).toUpperCase() || "?"}</Text>
                        </View>
                        {!showVideo && (
                            <View style={styles.cameraOffBadge}>
                                <Ionicons name="videocam-off" size={14} color="#fff" />
                            </View>
                        )}
                    </LinearGradient>
                )}

                {/* Overlay info */}
                <View style={styles.videoOverlay}>
                    <View style={styles.videoInfoRow}>
                        <Text style={styles.videoName} numberOfLines={1}>
                            {isMe ? "You" : participant.username}
                        </Text>
                        {(isMe ? !isAudioEnabled : participant.isAudioEnabled === false) && (
                            <View style={styles.mutedBadge}>
                                <Ionicons name="mic-off" size={12} color="#fff" />
                            </View>
                        )}
                    </View>
                </View>

                {/* Switch camera for local video */}
                {isMe && hasPermission && isVideoEnabled && (
                    <Pressable style={styles.switchCameraBtn} onPress={switchCamera}>
                        <Ionicons name="camera-reverse" size={16} color="#fff" />
                    </Pressable>
                )}
            </View>
        );
    };

    return (
        <LinearGradient colors={backgroundColors} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.surfaceBorder }]}>
                    <Pressable style={[styles.backBtn, { backgroundColor: theme.cardBackground }]} onPress={handleLeave}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <Text style={[styles.roomName, { color: theme.text }]} numberOfLines={1}>{roomName}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, isConnected ? styles.online : styles.offline]} />
                            <Text style={[styles.statusText, { color: theme.textSecondary }]}>{isConnected ? "Connected" : "Reconnecting..."}</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        {/* Timer Display (if running) */}
                        {(isTimerRunning || timerSeconds > 0) && (
                            <Pressable
                                style={[styles.timerBadge, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                                onPress={() => setShowTimer(true)}
                            >
                                <Ionicons name="time" size={14} color={isTimerRunning ? theme.success : theme.textSecondary} />
                                <Text style={[styles.timerText, { color: theme.text }]}>{formatTime(timerSeconds)}</Text>
                            </Pressable>
                        )}

                        {/* Participants */}
                        <Pressable
                            style={[styles.headerBtn, { backgroundColor: theme.primaryLight }, showParticipants && { borderWidth: 1, borderColor: theme.primary }]}
                            onPress={() => { setShowParticipants(!showParticipants); setShowChat(false); setShowTodos(false); }}
                        >
                            <Ionicons name="people" size={18} color={theme.primary} />
                            <Text style={[styles.participantCount, { color: theme.primary }]}>{uniqueParticipants.length}</Text>
                        </Pressable>

                        {/* 3-dot Menu */}
                        <Pressable
                            style={[styles.moreBtn, { backgroundColor: theme.cardBackground }]}
                            onPress={() => setShowMoreMenu(!showMoreMenu)}
                        >
                            <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
                            {pendingTodos > 0 && (
                                <View style={styles.moreBadge}>
                                    <Text style={styles.moreBadgeText}>{pendingTodos}</Text>
                                </View>
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* More Menu Dropdown */}
                {showMoreMenu && (
                    <View style={[styles.moreMenu, { backgroundColor: isDark ? "#1a1a35" : "#ffffff", borderColor: theme.surfaceBorder }]}>
                        <Pressable
                            style={[styles.menuItem, { borderBottomColor: theme.surfaceBorder }]}
                            onPress={() => { setShowTimer(true); setShowMoreMenu(false); }}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: isTimerRunning ? `${theme.success}20` : theme.cardBackground }]}>
                                <Ionicons name="time" size={20} color={isTimerRunning ? theme.success : theme.primary} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={[styles.menuText, { color: theme.text }]}>Focus Timer</Text>
                                {(isTimerRunning || timerSeconds > 0) && (
                                    <Text style={[styles.menuSubtext, { color: theme.textSecondary }]}>{formatTime(timerSeconds)}</Text>
                                )}
                            </View>
                        </Pressable>
                        <Pressable
                            style={[styles.menuItem, { borderBottomColor: theme.surfaceBorder }]}
                            onPress={() => { setShowTodos(true); closeAllPanels(); setShowTodos(true); setShowMoreMenu(false); }}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: theme.cardBackground }]}>
                                <Ionicons name="checkbox" size={20} color={theme.primary} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={[styles.menuText, { color: theme.text }]}>My Tasks</Text>
                                {pendingTodos > 0 && (
                                    <Text style={[styles.menuSubtext, { color: theme.warning }]}>{pendingTodos} pending</Text>
                                )}
                            </View>
                        </Pressable>
                        <Pressable
                            style={[styles.menuItem, { borderBottomWidth: 0 }]}
                            onPress={() => { setShowAmbientPlayer(true); setShowMoreMenu(false); }}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: theme.cardBackground }]}>
                                <Ionicons name="musical-notes" size={20} color={theme.primary} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={[styles.menuText, { color: theme.text }]}>Focus Sounds</Text>
                                <Text style={[styles.menuSubtext, { color: theme.textSecondary }]}>Ambient music</Text>
                            </View>
                        </Pressable>
                    </View>
                )}

                {/* Overlay to close menu */}
                {showMoreMenu && (
                    <Pressable style={styles.menuOverlay} onPress={() => setShowMoreMenu(false)} />
                )}

                {/* Live Session Banner */}
                <LinearGradient
                    colors={isDark ? ["rgba(139,92,246,0.15)", "rgba(99,102,241,0.1)"] : ["rgba(124,58,237,0.1)", "rgba(79,70,229,0.05)"]}
                    style={[styles.infoBanner, { borderColor: theme.primaryBorder }]}
                >
                    <Ionicons name="videocam" size={18} color={theme.primary} />
                    <Text style={[styles.infoText, { color: theme.text }]}>Focus session in progress</Text>
                    <View style={styles.liveTag}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                </LinearGradient>

                {/* Video Grid */}
                <View style={[styles.videoContainer, { height: videoContainerHeight, backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)" }]}>
                    <ScrollView contentContainerStyle={styles.videoGrid} showsVerticalScrollIndicator={false}>
                        <View style={styles.gridRow}>
                            {uniqueParticipants.map((participant, index) => renderParticipantCell(participant, index))}
                        </View>
                    </ScrollView>
                </View>

                {/* Media Controls - Solid background at bottom */}
                <View style={[styles.controlsWrapper, { backgroundColor: isDark ? "#0f0f23" : "#ffffff", borderColor: theme.surfaceBorder }]}>
                    <View style={styles.controls}>
                        <Pressable style={styles.controlBtn} onPress={toggleAudio}>
                            <LinearGradient
                                colors={isAudioEnabled ? [isDark ? "#374151" : "#e5e7eb", isDark ? "#1f2937" : "#d1d5db"] : ["#ef4444", "#dc2626"]}
                                style={styles.controlBtnGrad}
                            >
                                <Ionicons name={isAudioEnabled ? "mic" : "mic-off"} size={24} color={isAudioEnabled && !isDark ? "#374151" : "#fff"} />
                            </LinearGradient>
                            <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>{isAudioEnabled ? "Mute" : "Unmute"}</Text>
                        </Pressable>

                        <Pressable style={styles.controlBtn} onPress={toggleVideo}>
                            <LinearGradient
                                colors={isVideoEnabled ? [isDark ? "#374151" : "#e5e7eb", isDark ? "#1f2937" : "#d1d5db"] : ["#ef4444", "#dc2626"]}
                                style={styles.controlBtnGrad}
                            >
                                <Ionicons name={isVideoEnabled ? "videocam" : "videocam-off"} size={24} color={isVideoEnabled && !isDark ? "#374151" : "#fff"} />
                            </LinearGradient>
                            <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>Video</Text>
                        </Pressable>

                        <Pressable style={styles.controlBtn} onPress={() => { closeAllPanels(); setShowChat(!showChat); }}>
                            <LinearGradient
                                colors={showChat ? ["#6366f1", "#8b5cf6"] : [isDark ? "#374151" : "#e5e7eb", isDark ? "#1f2937" : "#d1d5db"]}
                                style={styles.controlBtnGrad}
                            >
                                <Ionicons name="chatbubble-ellipses" size={24} color={showChat || isDark ? "#fff" : "#374151"} />
                                {messages.length > 0 && !showChat && (
                                    <View style={styles.chatBadge}>
                                        <Text style={styles.chatBadgeText}>{messages.length > 99 ? "99+" : messages.length}</Text>
                                    </View>
                                )}
                            </LinearGradient>
                            <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>Chat</Text>
                        </Pressable>

                        <Pressable style={styles.controlBtn} onPress={() => setShowJamboard(true)}>
                            <LinearGradient
                                colors={[isDark ? "#374151" : "#e5e7eb", isDark ? "#1f2937" : "#d1d5db"]}
                                style={styles.controlBtnGrad}
                            >
                                <Ionicons name="easel" size={24} color={isDark ? "#fff" : "#374151"} />
                            </LinearGradient>
                            <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>Board</Text>
                        </Pressable>

                        <Pressable style={styles.controlBtn} onPress={handleLeave}>
                            <LinearGradient colors={["#ef4444", "#dc2626"]} style={styles.controlBtnGrad}>
                                <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
                            </LinearGradient>
                            <Text style={[styles.controlLabel, { color: theme.error }]}>Leave</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Participants Panel */}
                {showParticipants && (
                    <View style={[styles.sidePanel, { backgroundColor: isDark ? "#0f0f2a" : "#ffffff", borderColor: theme.surfaceBorder }]}>
                        <View style={[styles.panelHeader, { borderBottomColor: theme.surfaceBorder }]}>
                            <Text style={[styles.panelTitle, { color: theme.text }]}>Participants ({uniqueParticipants.length})</Text>
                            <Pressable onPress={() => setShowParticipants(false)}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </Pressable>
                        </View>
                        <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
                            {uniqueParticipants.map((p, idx) => (
                                <View key={`panel-${p.socketId}-${idx}`} style={[styles.participantRow, { borderBottomColor: theme.surfaceBorder }]}>
                                    <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.participantAvatar}>
                                        <Text style={styles.participantInitial}>{p.username?.charAt(0).toUpperCase() || "?"}</Text>
                                    </LinearGradient>
                                    <View style={styles.participantInfo}>
                                        <Text style={[styles.participantName, { color: theme.text }]} numberOfLines={1}>
                                            {p.username} {p.socketId === socket?.id ? "(You)" : ""}
                                        </Text>
                                        <Text style={[styles.participantTier, { color: theme.textMuted }]}>{p.userTier}</Text>
                                    </View>
                                    <View style={styles.participantStatus}>
                                        <Ionicons name={p.isAudioEnabled !== false ? "mic" : "mic-off"} size={16} color={p.isAudioEnabled !== false ? theme.success : theme.error} />
                                        <Ionicons name={p.isVideoEnabled !== false ? "videocam" : "videocam-off"} size={16} color={p.isVideoEnabled !== false ? theme.success : theme.error} style={{ marginLeft: 8 }} />
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Chat Panel */}
                {showChat && (
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.sidePanel, { backgroundColor: isDark ? "#0f0f2a" : "#ffffff", borderColor: theme.surfaceBorder }]} keyboardVerticalOffset={100}>
                        <View style={[styles.panelHeader, { borderBottomColor: theme.surfaceBorder }]}>
                            <Text style={[styles.panelTitle, { color: theme.text }]}>Chat</Text>
                            <Pressable onPress={() => setShowChat(false)}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </Pressable>
                        </View>
                        <ScrollView ref={scrollViewRef} style={styles.panelContent} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
                            {messages.length === 0 ? (
                                <View style={styles.emptyChat}>
                                    <Ionicons name="chatbubbles-outline" size={32} color={theme.textMuted} />
                                    <Text style={[styles.emptyChatText, { color: theme.textMuted }]}>No messages yet</Text>
                                </View>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.username === user?.name;
                                    return (
                                        <View key={msg.id} style={[styles.messageBubble, isMe ? [styles.myMessage, { backgroundColor: theme.primaryLight }] : [styles.otherMessage, { backgroundColor: theme.cardBackground }]]}>
                                            {!isMe && <Text style={[styles.messageAuthor, { color: theme.primary }]}>{msg.username}</Text>}
                                            <Text style={[styles.messageText, { color: theme.text }]}>{msg.message}</Text>
                                            <Text style={[styles.messageTime, { color: theme.textMuted }]}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </Text>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>

                        {isLoggedIn ? (
                            <View style={[styles.inputContainer, { borderTopColor: theme.surfaceBorder }]}>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                                    <TextInput
                                        style={[styles.input, { color: theme.inputText }]}
                                        placeholder="Type a message..."
                                        placeholderTextColor={theme.inputPlaceholder}
                                        value={messageText}
                                        onChangeText={setMessageText}
                                        onSubmitEditing={handleSend}
                                        returnKeyType="send"
                                    />
                                    <Pressable style={styles.sendBtn} onPress={handleSend} disabled={!messageText.trim()}>
                                        <LinearGradient colors={messageText.trim() ? ["#6366f1", "#8b5cf6"] : [theme.cardBackground, theme.cardBackground]} style={styles.sendBtnGrad}>
                                            <Ionicons name="send" size={16} color={messageText.trim() ? "#fff" : theme.textMuted} />
                                        </LinearGradient>
                                    </Pressable>
                                </View>
                            </View>
                        ) : (
                            <View style={[styles.guestBanner, { backgroundColor: `${theme.warning}15`, borderColor: `${theme.warning}50` }]}>
                                <Ionicons name="lock-closed-outline" size={16} color={theme.warning} />
                                <Text style={[styles.guestText, { color: theme.warning }]}>Sign in to chat</Text>
                            </View>
                        )}
                    </KeyboardAvoidingView>
                )}

                {/* Todos Panel */}
                {showTodos && (
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.sidePanel, { backgroundColor: isDark ? "#0f0f2a" : "#ffffff", borderColor: theme.surfaceBorder }]} keyboardVerticalOffset={100}>
                        <View style={[styles.panelHeader, { borderBottomColor: theme.surfaceBorder }]}>
                            <Text style={[styles.panelTitle, { color: theme.text }]}>My Tasks</Text>
                            <Pressable onPress={() => setShowTodos(false)}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </Pressable>
                        </View>
                        <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
                            {todos.length === 0 ? (
                                <View style={styles.emptyChat}>
                                    <Ionicons name="checkbox-outline" size={32} color={theme.textMuted} />
                                    <Text style={[styles.emptyChatText, { color: theme.textMuted }]}>No tasks yet</Text>
                                </View>
                            ) : (
                                todos.map((todo) => (
                                    <View key={todo._id} style={[styles.todoItem, { backgroundColor: todo.isCompleted ? theme.cardBackground : theme.surface, borderColor: theme.cardBorder }]}>
                                        <Pressable
                                            style={[styles.todoCheck, { borderColor: todo.isCompleted ? theme.success : theme.textMuted, backgroundColor: todo.isCompleted ? theme.success : "transparent" }]}
                                            onPress={() => handleToggleTodo(todo._id)}
                                        >
                                            {todo.isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                                        </Pressable>
                                        <Text style={[styles.todoText, { color: theme.text }, todo.isCompleted && { textDecorationLine: "line-through", color: theme.textMuted }]}>{todo.text}</Text>
                                        <Pressable onPress={() => handleDeleteTodo(todo._id)}>
                                            <Ionicons name="close" size={18} color={theme.textMuted} />
                                        </Pressable>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        {isLoggedIn && (
                            <View style={[styles.inputContainer, { borderTopColor: theme.surfaceBorder }]}>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                                    <TextInput
                                        style={[styles.input, { color: theme.inputText }]}
                                        placeholder="Add a task..."
                                        placeholderTextColor={theme.inputPlaceholder}
                                        value={newTodoText}
                                        onChangeText={setNewTodoText}
                                        onSubmitEditing={handleAddTodo}
                                        returnKeyType="done"
                                    />
                                    <Pressable style={styles.sendBtn} onPress={handleAddTodo} disabled={!newTodoText.trim()}>
                                        <LinearGradient colors={newTodoText.trim() ? ["#6366f1", "#8b5cf6"] : [theme.cardBackground, theme.cardBackground]} style={styles.sendBtnGrad}>
                                            <Ionicons name="add" size={18} color={newTodoText.trim() ? "#fff" : theme.textMuted} />
                                        </LinearGradient>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </KeyboardAvoidingView>
                )}

                {/* Timer Modal */}
                <Modal visible={showTimer} transparent animationType="slide" onRequestClose={() => setShowTimer(false)}>
                    <View style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" }]}>
                        <View style={[styles.timerModal, { backgroundColor: isDark ? "#0f0f2a" : "#ffffff" }]}>
                            <View style={[styles.panelHeader, { borderBottomColor: theme.surfaceBorder }]}>
                                <Text style={[styles.panelTitle, { color: theme.text }]}>Focus Timer</Text>
                                <Pressable onPress={() => setShowTimer(false)}>
                                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                                </Pressable>
                            </View>

                            {/* Current Timer Display */}
                            {(isTimerRunning || timerSeconds > 0) && (
                                <View style={[styles.timerDisplay, { backgroundColor: theme.cardBackground }]}>
                                    <Text style={[styles.timerBig, { color: theme.text }]}>{formatTime(timerSeconds)}</Text>
                                    <Text style={[styles.timerModeText, { color: theme.textSecondary }]}>{timerMode === "stopwatch" ? "Stopwatch" : "Countdown"}</Text>
                                    <View style={styles.timerActions}>
                                        <Pressable style={[styles.timerActionBtn, { backgroundColor: isTimerRunning ? theme.warning : theme.success }]} onPress={toggleTimer}>
                                            <Ionicons name={isTimerRunning ? "pause" : "play"} size={20} color="#fff" />
                                        </Pressable>
                                        <Pressable style={[styles.timerActionBtn, { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.cardBorder }]} onPress={resetTimer}>
                                            <Ionicons name="refresh" size={20} color={theme.text} />
                                        </Pressable>
                                    </View>
                                </View>
                            )}

                            <View style={styles.timerOptions}>
                                <Text style={[styles.timerSectionTitle, { color: theme.textSecondary }]}>Quick Start</Text>
                                <View style={styles.timerGrid}>
                                    <Pressable style={[styles.timerOption, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]} onPress={startStopwatch}>
                                        <Ionicons name="time-outline" size={28} color={theme.primary} />
                                        <Text style={[styles.timerOptionText, { color: theme.text }]}>Stopwatch</Text>
                                    </Pressable>
                                    <Pressable style={[styles.timerOption, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]} onPress={() => startCountdown(25)}>
                                        <Text style={[styles.timerOptionBig, { color: theme.primary }]}>25</Text>
                                        <Text style={[styles.timerOptionText, { color: theme.text }]}>Pomodoro</Text>
                                    </Pressable>
                                    <Pressable style={[styles.timerOption, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]} onPress={() => startCountdown(45)}>
                                        <Text style={[styles.timerOptionBig, { color: theme.primary }]}>45</Text>
                                        <Text style={[styles.timerOptionText, { color: theme.text }]}>Deep Focus</Text>
                                    </Pressable>
                                    <Pressable style={[styles.timerOption, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]} onPress={() => startCountdown(60)}>
                                        <Text style={[styles.timerOptionBig, { color: theme.primary }]}>60</Text>
                                        <Text style={[styles.timerOptionText, { color: theme.text }]}>Full Hour</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Jamboard Modal */}
                <Jamboard visible={showJamboard} onClose={() => setShowJamboard(false)} />

                {/* Ambient Player Modal */}
                <AmbientPlayer visible={showAmbientPlayer} onClose={() => setShowAmbientPlayer(false)} />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },

    // Header
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    headerCenter: { flex: 1, marginHorizontal: 12 },
    roomName: { fontSize: 18, fontWeight: "600" },
    statusRow: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    online: { backgroundColor: "#10b981" },
    offline: { backgroundColor: "#f59e0b" },
    statusText: { fontSize: 12 },
    headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
    headerBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
    participantCount: { fontSize: 14, fontWeight: "600" },
    timerBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4, borderWidth: 1 },
    timerText: { fontSize: 13, fontWeight: "600", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
    moreBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    moreBadge: { position: "absolute", top: -2, right: -2, backgroundColor: "#f59e0b", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" },
    moreBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

    // More Menu
    moreMenu: { position: "absolute", top: 100, right: 16, width: 220, borderRadius: 16, borderWidth: 1, zIndex: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
    menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1 },
    menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    menuTextContainer: { flex: 1 },
    menuText: { fontSize: 14, fontWeight: "500" },
    menuSubtext: { fontSize: 12, marginTop: 2 },
    menuOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },

    // Info Banner
    infoBanner: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 10, borderWidth: 1 },
    infoText: { flex: 1, fontSize: 14 },
    liveTag: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239,68,68,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
    liveText: { color: "#ef4444", fontSize: 10, fontWeight: "700" },

    // Video Container
    videoContainer: { margin: 8, borderRadius: 16, overflow: "hidden" },
    videoGrid: { padding: 4 },
    gridRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, padding: 4 },
    videoCell: { borderRadius: 12, overflow: "hidden" },
    videoStream: { width: "100%", height: "100%" },
    noVideoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
    avatarCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 2 },
    avatarText: { fontSize: 22, fontWeight: "600" },
    cameraOffBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(239,68,68,0.8)", borderRadius: 12, padding: 4 },
    videoOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4 },
    videoInfoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    videoName: { color: "#fff", fontSize: 11, fontWeight: "500", flex: 1 },
    mutedBadge: { backgroundColor: "rgba(239,68,68,0.8)", borderRadius: 10, padding: 2 },
    switchCameraBtn: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 14, width: 28, height: 28, alignItems: "center", justifyContent: "center" },

    // Controls Wrapper
    controlsWrapper: { marginHorizontal: 12, marginBottom: 8, marginTop: "auto", borderRadius: 32, paddingVertical: 14, paddingHorizontal: 8, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    controls: { flexDirection: "row", justifyContent: "space-evenly", alignItems: "flex-start" },
    controlBtn: { alignItems: "center", width: 60 },
    controlBtnGrad: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
    controlLabel: { fontSize: 10, marginTop: 6, fontWeight: "500" },
    chatBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    chatBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

    // Side Panels
    sidePanel: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: SCREEN_HEIGHT * 0.45, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
    panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
    panelTitle: { fontSize: 18, fontWeight: "600" },
    panelContent: { flex: 1, paddingHorizontal: 16 },

    // Participants
    participantRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
    participantAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    participantInitial: { color: "#fff", fontSize: 16, fontWeight: "600" },
    participantInfo: { flex: 1, marginLeft: 12 },
    participantName: { fontSize: 14, fontWeight: "500" },
    participantTier: { fontSize: 11, textTransform: "capitalize", marginTop: 2 },
    participantStatus: { flexDirection: "row", alignItems: "center" },

    // Chat
    messagesContent: { paddingVertical: 12, flexGrow: 1 },
    emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
    emptyChatText: { fontSize: 14, marginTop: 8 },
    messageBubble: { maxWidth: "85%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginBottom: 8 },
    myMessage: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
    otherMessage: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
    messageAuthor: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
    messageText: { fontSize: 15, lineHeight: 20 },
    messageTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
    inputContainer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
    inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 24, paddingLeft: 16, paddingRight: 4, borderWidth: 1 },
    input: { flex: 1, fontSize: 15, paddingVertical: 10 },
    sendBtn: { marginLeft: 8 },
    sendBtnGrad: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    guestBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 16, marginVertical: 12, paddingVertical: 12, borderRadius: 12, gap: 8, borderWidth: 1 },
    guestText: { fontSize: 13 },

    // Todos
    todoItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginVertical: 4, gap: 12, borderWidth: 1 },
    todoCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    todoText: { flex: 1, fontSize: 14 },

    // Timer Modal
    modalOverlay: { flex: 1, justifyContent: "flex-end" },
    timerModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    timerDisplay: { margin: 16, padding: 24, borderRadius: 20, alignItems: "center" },
    timerBig: { fontSize: 48, fontWeight: "bold", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
    timerModeText: { fontSize: 14, marginTop: 4 },
    timerActions: { flexDirection: "row", gap: 12, marginTop: 16 },
    timerActionBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    timerOptions: { padding: 16 },
    timerSectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase" },
    timerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    timerOption: { width: (SCREEN_WIDTH - 56) / 2, padding: 20, borderRadius: 16, alignItems: "center", borderWidth: 1 },
    timerOptionBig: { fontSize: 28, fontWeight: "bold" },
    timerOptionText: { fontSize: 13, marginTop: 4 },
});
