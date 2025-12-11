import { useState, useEffect, useRef, useCallback } from 'react';
import { getTodos, createTodo, toggleTodo, deleteTodo as deleteTodoService } from '@/services/todoService';
import { recordSession } from '@/services/sessionService';
import { saveMessage } from '@/services/messageService';

import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    HiVideoCamera,
    HiUserGroup,
    HiChatBubbleLeftRight,
    HiMicrophone,
    HiPhone,
    HiClipboardDocumentList,
    HiPlus,
    HiCheck,
    HiXMark,
    HiComputerDesktop,
    HiStopCircle,
    HiClock,
    HiPlay,
    HiPause,
    HiArrowPath,
    HiLockClosed,
    HiStar,
    HiEye,
    HiMusicalNote,
    HiPencil
} from 'react-icons/hi2';
import Whiteboard from '@/components/Whiteboard';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoGrid from '@/components/VideoGrid';
import ChatPanel from '@/components/ChatPanel';
import UserList from '@/components/UserList';
import PingOverlay from '@/components/PingOverlay';
import AmbientPlayer from '@/components/AmbientPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const { theme } = useTheme();
    const { user, tier, isGuest, isLoggedIn, isPremium, permissions } = useAuth();
    const { stream, isAudioOn, isVideoOn, isScreenSharing, startStream, stopStream, toggleAudio, toggleVideo, toggleScreenShare } = useMediaStream();
    const { remoteStreams, initiateCall, closeAllConnections, updateLocalTracks } = useWebRTC(socket, stream);

    const [roomInfo, setRoomInfo] = useState(null);
    const [participants, setParticipants] = useState({});
    const [messages, setMessages] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isUserListOpen, setIsUserListOpen] = useState(false);
    const [isTodoOpen, setIsTodoOpen] = useState(false);
    const [isAmbientOpen, setIsAmbientOpen] = useState(false);
    const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [pingTarget, setPingTarget] = useState(null);
    const [pinnedUser, setPinnedUser] = useState(null); // Track pinned video
    const [unreadCount, setUnreadCount] = useState(0);
    const [existingUsers, setExistingUsers] = useState([]);
    const [showGuestBanner, setShowGuestBanner] = useState(isGuest);

    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [currentSessionId, setCurrentSessionId] = useState(null);

    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerMode, setTimerMode] = useState('stopwatch');
    const [customMinutes, setCustomMinutes] = useState('25');
    const timerRef = useRef(null);

    const username = user?.name || localStorage.getItem('focusroom_username') || 'Anonymous';
    const localVideoRef = useRef(null);
    const hasJoinedRef = useRef(false);
    const hasCalledPeersRef = useRef(false);
    const isDark = theme === 'dark';

    // Show restriction toast for guests
    const showRestrictionToast = (feature) => {
        toast.error(`${feature} is not available for guests. Please sign up!`, {
            icon: '🔒',
            duration: 4000
        });
    };

    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => {
                    if (timerMode === 'countdown' && prev <= 1) {
                        setIsTimerRunning(false);
                        toast.success('Timer complete! Great focus session! 🎉');
                        return 0;
                    }
                    return timerMode === 'stopwatch' ? prev + 1 : prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isTimerRunning, timerMode]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startStopwatch = () => { setTimerMode('stopwatch'); setTimerSeconds(0); setIsTimerRunning(true); setIsTimerModalOpen(false); };
    const startCountdown = (mins) => { setTimerMode('countdown'); setTimerSeconds(mins * 60); setIsTimerRunning(true); setIsTimerModalOpen(false); };
    const toggleTimer = () => setIsTimerRunning(prev => !prev);
    const resetTimer = () => { setIsTimerRunning(false); setTimerSeconds(0); };

    useEffect(() => {
        if (!socket || !isConnected || hasJoinedRef.current) return;
        const initRoom = async () => {
            // Only start stream if user has permissions
            if (permissions.canToggleVideo || permissions.canToggleAudio) {
                const mediaStream = await startStream();
                if (mediaStream) toast.success('Camera and microphone ready!');
                else toast.error('Could not access camera/microphone');
            } else {
                toast('You are in view-only mode as a guest', { icon: '👁️' });
            }

            socket.emit('room:join', { roomId, username, userTier: tier, userId: user?._id }, async (response) => {
                if (response.success) {
                    setRoomInfo(response.room);
                    hasJoinedRef.current = true;
                    const initialParticipants = {};
                    response.room.participants.forEach(p => { if (p.socketId !== socket.id) initialParticipants[p.socketId] = p; });
                    setParticipants(initialParticipants);
                    if (response.existingUsers?.length > 0) setExistingUsers(response.existingUsers);

                    // Record session start
                    if (isLoggedIn) {
                        const sessionRes = await recordSession(roomId, 'start', null, response.room.name || 'Focus Room');
                        if (sessionRes.success) setCurrentSessionId(sessionRes.sessionId);
                    }
                } else { toast.error(response.error || 'Failed to join room'); navigate('/'); }
            });
        };
        initRoom();
        return () => {
            if (hasJoinedRef.current) {
                // Record session end
                if (isLoggedIn && currentSessionId) {
                    recordSession(roomId, 'end', currentSessionId);
                }
                socket.emit('room:leave');
                closeAllConnections();
                stopStream();
            }
        };
    }, [socket, isConnected, roomId, permissions]);

    useEffect(() => {
        if (!stream || existingUsers.length === 0 || hasCalledPeersRef.current) return;
        hasCalledPeersRef.current = true;
        existingUsers.forEach((user, index) => { setTimeout(() => initiateCall(user.socketId, user.username), 500 + (index * 500)); });
    }, [stream, existingUsers, initiateCall]);

    useEffect(() => { if (localVideoRef.current && stream) localVideoRef.current.srcObject = stream; }, [stream, isScreenSharing]);

    useEffect(() => {
        if (!socket) return;
        const handleUserJoined = ({ socketId, username, userTier, userId }) => {
            toast.success(`${username} joined${userTier === 'guest' ? ' (guest)' : ''}`);
            setParticipants(prev => ({ ...prev, [socketId]: { socketId, username, userTier, userId, isAudioOn: userTier !== 'guest', isVideoOn: userTier !== 'guest' } }));
        };
        const handleUserLeft = ({ socketId }) => { const user = participants[socketId]; if (user) toast(`${user.username} left`, { icon: '👋' }); setParticipants(prev => { const u = { ...prev }; delete u[socketId]; return u; }); };
        const handleMediaToggle = ({ socketId, type, enabled }) => { setParticipants(prev => ({ ...prev, [socketId]: { ...prev[socketId], [type === 'audio' ? 'isAudioOn' : 'isVideoOn']: enabled } })); };
        const handleChatMessage = (message) => { setMessages(prev => [...prev, message]); if (!isChatOpen && message.socketId !== socket.id) setUnreadCount(prev => prev + 1); };
        const handlePinged = ({ username }) => { toast(`${username} pinged you!`, { icon: '🔔' }); setPingTarget({ socketId: 'local', username }); setTimeout(() => setPingTarget(null), 3000); };
        socket.on('user:joined', handleUserJoined); socket.on('user:left', handleUserLeft); socket.on('user:media-toggle', handleMediaToggle); socket.on('chat:message', handleChatMessage); socket.on('user:pinged', handlePinged);
        return () => { socket.off('user:joined', handleUserJoined); socket.off('user:left', handleUserLeft); socket.off('user:media-toggle', handleMediaToggle); socket.off('chat:message', handleChatMessage); socket.off('user:pinged', handlePinged); };
    }, [socket, isChatOpen, participants]);

    const handleToggleAudio = useCallback(() => {
        if (!permissions.canToggleAudio) {
            showRestrictionToast('Microphone');
            return;
        }
        const e = toggleAudio();
        socket?.emit('media:toggle', { type: 'audio', enabled: e });
    }, [socket, toggleAudio, permissions]);

    const handleToggleVideo = useCallback(() => {
        if (!permissions.canToggleVideo) {
            showRestrictionToast('Camera');
            return;
        }
        const e = toggleVideo();
        socket?.emit('media:toggle', { type: 'video', enabled: e });
    }, [socket, toggleVideo, permissions]);

    const handleToggleScreenShare = useCallback(async () => {
        if (!permissions.canShareScreen) {
            showRestrictionToast('Screen sharing');
            return;
        }
        const result = await toggleScreenShare();

        // Update tracks in all peer connections after a short delay to allow stream to update
        setTimeout(() => {
            if (stream) {
                updateLocalTracks(stream);
            }
        }, 100);

        if (result) {
            toast.success('Screen sharing started');
            socket?.emit('media:toggle', { type: 'screen', enabled: true });
        } else if (isScreenSharing) {
            toast('Screen sharing stopped', { icon: '🖥️' });
            socket?.emit('media:toggle', { type: 'screen', enabled: false });
        }
    }, [toggleScreenShare, isScreenSharing, socket, permissions, stream, updateLocalTracks]);

    const handleLeaveRoom = useCallback(() => { socket?.emit('room:leave'); closeAllConnections(); stopStream(); toast('Left the room', { icon: '👋' }); navigate('/'); }, [socket, closeAllConnections, stopStream, navigate]);

    // Handle pinning a user's video - pin to make it larger, click again to unpin
    const handlePinUser = useCallback((socketId, username, isLocal = false) => {
        setPinnedUser(prev => {
            if (prev?.socketId === socketId) {
                // Unpin if clicking the same user
                toast(`Unpinned ${isLocal ? 'yourself' : username}`, { icon: '📌' });
                return null;
            }
            // Pin new user
            toast.success(`Pinned ${isLocal ? 'yourself' : username}`, { icon: '📌' });
            return { socketId, username, isLocal };
        });
    }, []);

    const handleSendMessage = useCallback(async (message, attachments = []) => {
        if (!permissions.canChat) {
            showRestrictionToast('Chat');
            return;
        }

        // Persist message if logged in and in a session
        if (isLoggedIn && currentSessionId) {
            const hasAttachments = attachments && attachments.length > 0;

            if (hasAttachments) {
                // Upload attachments
                // We'll save the first attachment with the message text,
                // and subsequent attachments as separate messages to fit the 1-media-per-message model
                attachments.forEach((att, index) => {
                    const content = index === 0 ? (message || '') : '';
                    if (att.file) {
                        saveMessage({
                            roomId,
                            sessionId: currentSessionId,
                            content
                        }, att.file); // Pass the file object
                    }
                });

                // If there's message text but was not saved with first attachment (e.g. if first att had no file object for some reason, though unlikely given logic)
                // actually the above loop covers it if there are attachments.
                // But if attachments have no 'file' (e.g. from some other source?), we might miss text.
                // Assuming ChatPanel passes 'file'.
            } else if (message && message.trim()) {
                // Text only
                saveMessage({
                    roomId,
                    sessionId: currentSessionId,
                    content: message
                });
            }
        }

        socket?.emit('chat:message', { message, attachments });
    }, [socket, permissions, isLoggedIn, currentSessionId, roomId]);

    const handlePingUser = useCallback((targetSocketId) => {
        if (!permissions.canPingUsers) {
            showRestrictionToast('Ping');
            return;
        }
        socket?.emit('user:ping', { targetSocketId });
        toast.success(`Pinged!`);
    }, [socket, permissions]);

    useEffect(() => {
        if (isTodoOpen) {
            fetchTodos();
        }
    }, [isTodoOpen]);

    const fetchTodos = async () => {
        try {
            const today = new Date().toISOString();
            const res = await getTodos(today);
            if (res.success) setTodos(res.todos);
        } catch (error) { console.error(error); }
    };

    const toggleChat = () => { setIsChatOpen(prev => !prev); if (!isChatOpen) setUnreadCount(0); setIsUserListOpen(false); setIsTodoOpen(false); };
    const toggleUserList = () => { setIsUserListOpen(prev => !prev); setIsChatOpen(false); setIsTodoOpen(false); };
    const toggleTasksPanel = () => { setIsTodoOpen(prev => !prev); setIsChatOpen(false); setIsUserListOpen(false); };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        try {
            const res = await createTodo(newTodo.trim(), new Date());
            if (res.success) { setTodos(prev => [...prev, res.todo]); setNewTodo(''); }
        } catch (err) { toast.error('Failed to add task'); }
    };

    const toggleTodoDone = async (id) => {
        try {
            const res = await toggleTodo(id);
            if (res.success) setTodos(prev => prev.map(t => t._id === id ? { ...t, isCompleted: !t.isCompleted } : t));
        } catch (err) { toast.error('Failed to update task'); }
    };

    const deleteTodo = async (id) => {
        try {
            const res = await deleteTodoService(id);
            if (res.success) setTodos(prev => prev.filter(t => t._id !== id));
        } catch (err) { toast.error('Failed to delete task'); }
    };

    const participantCount = Object.keys(participants).length + 1;

    // Icon with slash component
    const IconWithSlash = ({ Icon, isOff, className }) => (
        <div className={`relative ${className}`}>
            <Icon className="w-5 h-5" />
            {isOff && <div className="absolute inset-0 flex items-center justify-center"><div className="w-7 h-0.5 bg-current rotate-45 rounded-full"></div></div>}
        </div>
    );

    // Locked icon for guests - shows feature is disabled
    const LockedControl = ({ Icon, label, onClick }) => (
        <button
            onClick={onClick}
            className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all relative cursor-not-allowed ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-300 text-slate-400'}`}
            title={`${label} (Sign up required)`}
        >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" />
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <HiLockClosed className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
            </div>
        </button>
    );

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'}`}>
            {/* Guest Banner - Responsive */}
            {showGuestBanner && isGuest && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 sm:px-4 py-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <HiEye className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <p className="text-xs sm:text-sm font-medium truncate">
                            <span className="hidden sm:inline">You're viewing as a guest. </span>
                            <span className="sm:hidden">Guest mode</span>
                            <span className="opacity-80 hidden sm:inline">Video, audio, and chat are disabled.</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3 bg-white/20 hover:bg-white/30 text-white border-0"
                            onClick={() => navigate('/')}
                        >
                            Sign Up
                        </Button>
                        <button onClick={() => setShowGuestBanner(false)} className="p-1 hover:bg-white/20 rounded">
                            <HiXMark className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header - Responsive */}
            <header className={`h-12 sm:h-14 px-3 sm:px-5 flex items-center justify-between shrink-0 ${isDark ? '' : 'border-b border-slate-200'}`}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                        <HiVideoCamera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <h1 className={`font-semibold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{roomInfo?.name || 'Focus Room'}</h1>
                            {roomInfo?.isPrivate && (
                                <span className="flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 text-[8px] sm:text-[10px] font-medium shrink-0">
                                    <HiLockClosed className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                    <span className="hidden sm:inline">Private</span>
                                </span>
                            )}
                        </div>
                        <div className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{participantCount}</span>
                            {isScreenSharing && <span className="hidden sm:flex items-center gap-1 text-amber-500"><HiComputerDesktop className="w-3 h-3" />Sharing</span>}
                            {isGuest && <span className="flex items-center gap-1 text-amber-500"><HiEye className="w-3 h-3" /><span className="hidden sm:inline">View Only</span></span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* User Tier Badge - Hidden on mobile */}
                    {isPremium && (
                        <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium">
                            <HiStar className="w-3 h-3" /> Premium
                        </span>
                    )}

                    {/* Timer Display (if running) */}
                    {(isTimerRunning || timerSeconds > 0) && (
                        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl cursor-pointer ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'}`} onClick={() => setIsTimerModalOpen(true)}>
                            <HiClock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isTimerRunning ? 'text-green-500' : 'text-slate-400'}`} />
                            <span className={`font-mono text-xs sm:text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatTime(timerSeconds)}</span>
                            <button onClick={(e) => { e.stopPropagation(); toggleTimer(); }} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center ${isTimerRunning ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                                {isTimerRunning ? <HiPause className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <HiPlay className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                            </button>
                        </div>
                    )}

                    {/* Header buttons - responsive sizing */}
                    <Button variant={isTodoOpen ? 'default' : 'outline'} size="sm" onClick={toggleTasksPanel} className="h-8 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-2">
                        <HiClipboardDocumentList className="w-4 h-4" />
                        <span className="hidden lg:inline">Tasks</span>
                        {todos.filter(t => !t.isCompleted).length > 0 && <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-white text-[8px] sm:text-[10px] flex items-center justify-center font-bold">{todos.filter(t => !t.isCompleted).length}</span>}
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => setIsTimerModalOpen(true)} className="h-8 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-2 hidden sm:flex">
                        <HiClock className="w-4 h-4" />
                        <span className="hidden lg:inline">Timer</span>
                    </Button>

                    <Button variant={isAmbientOpen ? 'default' : 'outline'} size="sm" onClick={() => setIsAmbientOpen(!isAmbientOpen)} className="h-8 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-2 hidden sm:flex">
                        <HiMusicalNote className="w-4 h-4" />
                        <span className="hidden lg:inline">Sounds</span>
                    </Button>
                </div>
            </header>

            {/* Timer Modal */}
            <Dialog open={isTimerModalOpen} onOpenChange={setIsTimerModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Focus Timer</DialogTitle>
                        <DialogDescription>Choose a timer mode to track your focus session.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        {/* Current Timer */}
                        {(isTimerRunning || timerSeconds > 0) && (
                            <div className="text-center p-6 rounded-xl bg-muted">
                                <p className="text-4xl font-mono font-bold">{formatTime(timerSeconds)}</p>
                                <p className="text-sm text-muted-foreground mt-2">{timerMode === 'stopwatch' ? 'Stopwatch' : 'Countdown'}</p>
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <Button onClick={toggleTimer} variant={isTimerRunning ? 'secondary' : 'default'}>
                                        {isTimerRunning ? <><HiPause className="w-4 h-4 mr-2" />Pause</> : <><HiPlay className="w-4 h-4 mr-2" />Resume</>}
                                    </Button>
                                    <Button onClick={resetTimer} variant="outline"><HiArrowPath className="w-4 h-4 mr-2" />Reset</Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <p className="text-sm font-medium">Quick Start</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={startStopwatch} variant="outline" className="h-16 flex-col"><HiClock className="w-5 h-5 mb-1" /><span>Stopwatch</span></Button>
                                <Button onClick={() => startCountdown(25)} variant="outline" className="h-16 flex-col"><span className="text-lg font-bold">25</span><span className="text-xs">minutes</span></Button>
                                <Button onClick={() => startCountdown(45)} variant="outline" className="h-16 flex-col"><span className="text-lg font-bold">45</span><span className="text-xs">minutes</span></Button>
                                <Button onClick={() => startCountdown(60)} variant="outline" className="h-16 flex-col"><span className="text-lg font-bold">60</span><span className="text-xs">minutes</span></Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium">Custom Duration</p>
                            <div className="flex gap-2">
                                <Input type="number" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="Minutes" min="1" max="180" className="flex-1" />
                                <Button onClick={() => startCountdown(parseInt(customMinutes) || 25)}>Start</Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Content - Responsive with proper scrolling */}
            <main className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
                    <div className="min-h-full flex items-start sm:items-center justify-center py-2">
                        <VideoGrid
                            localStream={stream}
                            localVideoRef={localVideoRef}
                            isLocalAudioOn={isAudioOn}
                            isLocalVideoOn={isVideoOn}
                            isScreenSharing={isScreenSharing}
                            username={username}
                            participants={participants}
                            remoteStreams={remoteStreams}
                            pingTarget={pingTarget}
                            onPingUser={handlePingUser}
                            isGuest={isGuest}
                            pinnedUser={pinnedUser}
                            onPinUser={handlePinUser}
                            localSocketId={socket?.id}
                        />
                    </div>
                </div>

                {/* Side panels - Full screen overlay on mobile, side panel on desktop */}
                {isUserListOpen && (
                    <div className="absolute inset-0 z-20 sm:relative sm:inset-auto">
                        <UserList
                            participants={participants}
                            username={username}
                            socketId={socket?.id}
                            onPingUser={handlePingUser}
                            onClose={() => setIsUserListOpen(false)}
                            currentUserId={user?._id}
                            friends={user?.friends || []}
                        />
                    </div>
                )}
                {isChatOpen && (
                    <div className="absolute inset-0 z-20 sm:relative sm:inset-auto">
                        <ChatPanel messages={messages} currentSocketId={socket?.id} onSendMessage={handleSendMessage} onClose={() => setIsChatOpen(false)} />
                    </div>
                )}
                {isTodoOpen && (
                    <div className="absolute inset-0 z-20 sm:relative sm:inset-auto">
                        <Card className="w-full sm:w-80 h-full border-l rounded-none flex flex-col bg-card">
                            <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-4 border-b shrink-0">
                                <CardTitle className="text-base font-semibold">My Tasks</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setIsTodoOpen(false)} className="h-8 w-8 rounded-full"><HiXMark className="w-5 h-5" /></Button>
                            </CardHeader>
                            <CardContent className="flex-1 p-3 overflow-y-auto">
                                <form onSubmit={addTodo} className="flex gap-2 mb-4">
                                    <Input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add a task..." className="flex-1 h-10" />
                                    <Button type="submit" size="icon" className="h-10 w-10"><HiPlus className="w-4 h-4" /></Button>
                                </form>
                                <div className="space-y-2">
                                    {todos.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">No tasks yet.</p> : todos.map(todo => (
                                        <div key={todo._id} className={`flex items-center gap-3 p-3 rounded-lg border ${todo.isCompleted ? 'bg-muted/50 opacity-60' : 'bg-card'}`}>
                                            <button onClick={() => toggleTodoDone(todo._id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${todo.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground'}`}>{todo.isCompleted && <HiCheck className="w-3 h-3" />}</button>
                                            <span className={`flex-1 text-sm ${todo.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{todo.text}</span>
                                            <button onClick={() => deleteTodo(todo._id)} className="text-muted-foreground hover:text-destructive"><HiXMark className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>

            {/* Control Bar - Mobile Optimized */}
            <footer className="py-2 sm:py-3 md:py-4 flex items-center justify-center shrink-0 px-1.5 sm:px-2 safe-area-pb">
                <div className={`flex items-center gap-0.5 xs:gap-1 sm:gap-2 px-1.5 xs:px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl backdrop-blur-xl border shadow-2xl ${isDark ? 'bg-slate-800/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
                    {/* Audio Control */}
                    {permissions.canToggleAudio ? (
                        <button
                            onClick={handleToggleAudio}
                            className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${isAudioOn ? isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            title={isAudioOn ? 'Mute' : 'Unmute'}
                        >
                            <IconWithSlash Icon={HiMicrophone} isOff={!isAudioOn} />
                        </button>
                    ) : (
                        <LockedControl Icon={HiMicrophone} label="Microphone" onClick={() => showRestrictionToast('Microphone')} />
                    )}

                    {/* Video Control */}
                    {permissions.canToggleVideo ? (
                        <button
                            onClick={handleToggleVideo}
                            className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${isVideoOn ? isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            title={isVideoOn ? 'Camera off' : 'Camera on'}
                        >
                            <IconWithSlash Icon={HiVideoCamera} isOff={!isVideoOn} />
                        </button>
                    ) : (
                        <LockedControl Icon={HiVideoCamera} label="Camera" onClick={() => showRestrictionToast('Camera')} />
                    )}

                    {/* Screen Share Control - Visible on all screens, disabled for guests */}
                    <div className="hidden sm:block">
                        {permissions.canShareScreen ? (
                            <button
                                onClick={handleToggleScreenShare}
                                className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${isScreenSharing ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' : isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                            >
                                {isScreenSharing ? <HiStopCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <HiComputerDesktop className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                        ) : (
                            <LockedControl Icon={HiComputerDesktop} label="Screen sharing" onClick={() => showRestrictionToast('Screen sharing')} />
                        )}
                    </div>

                    {/* Jamboard Control */}
                    <button
                        onClick={() => setShowWhiteboard(true)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${showWhiteboard ? 'bg-primary text-white' : isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        title="Jamboard"
                    >
                        <HiPencil className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <div className={`w-px h-5 sm:h-6 mx-0.5 sm:mx-1 ${isDark ? 'bg-white/10' : 'bg-slate-300'}`}></div>

                    {/* Participants */}
                    <button
                        onClick={toggleUserList}
                        className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${isUserListOpen ? 'bg-sky-500 text-white' : isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        title="Participants"
                    >
                        <HiUserGroup className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Chat Control */}
                    <button
                        onClick={toggleChat}
                        className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 relative ${isChatOpen ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        title="Chat"
                    >
                        <HiChatBubbleLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 text-[8px] sm:text-[10px] flex items-center justify-center font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                        {!permissions.canChat && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-500 flex items-center justify-center">
                                <HiEye className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                            </div>
                        )}
                    </button>

                    <div className={`w-px h-5 sm:h-6 mx-0.5 sm:mx-1 ${isDark ? 'bg-white/10' : 'bg-slate-300'}`}></div>

                    {/* Leave Button */}
                    <button onClick={handleLeaveRoom} className="h-9 sm:h-10 md:h-11 px-2.5 sm:px-4 md:px-5 shrink-0 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2 transition-transform">
                        <HiPhone className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-[135deg]" /><span className="text-[11px] sm:text-xs md:text-sm">Leave</span>
                    </button>
                </div>
            </footer>

            {pingTarget?.socketId === 'local' && <PingOverlay username={pingTarget.username} />}

            <AmbientPlayer isOpen={isAmbientOpen} onClose={() => setIsAmbientOpen(false)} />

            {showWhiteboard && (
                <Whiteboard
                    socket={socket}
                    roomId={roomId}
                    onClose={() => setShowWhiteboard(false)}
                    isGuest={isGuest}
                />
            )}
        </div>
    );
}
