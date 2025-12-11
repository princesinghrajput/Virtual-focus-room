import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    HiVideoCamera,
    HiArrowRight,
    HiUserGroup,
    HiSparkles,
    HiSun,
    HiMoon,
    HiGlobeAlt,
    HiLockClosed,
    HiLockOpen,
    HiCheck,
    HiXMark,
    HiCreditCard,
    HiShieldCheck,
    HiMicrophone,
    HiChatBubbleLeftRight,
    HiPaperClip,
    HiUser,
    HiArrowRightOnRectangle,
    HiStar,
    HiPlay,
    HiClock,
    HiBolt,
    HiUsers,
    HiChartBar,
    HiCalendar
} from 'react-icons/hi2';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth, USER_TIERS } from '@/context/AuthContext';
import CalendarModal from '@/components/CalendarModal';
import ProfileModal from '@/components/ProfileModal';
import MembersSidebar from '@/components/MembersSidebar';

// Shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Home() {
    const { socket, isConnected, rooms } = useSocket();
    const { theme, toggleTheme } = useTheme();
    const { user, tier, isLoggedIn, isPremium, login, signup, logout, upgradeToPremium, permissions } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.name || '');
    const [roomName, setRoomName] = useState('');
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [roomPassword, setRoomPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [activeUsers, setActiveUsers] = useState(247);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Auth form states
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authName, setAuthName] = useState('');
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    // Payment form states
    const [paymentStep, setPaymentStep] = useState('plan');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');

    // Simulate live user count
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateRoom = () => {
        if (!username.trim()) return toast.error('Please enter your name');
        if (!isConnected) return toast.error('Connection lost. Reconnecting...');
        if (isPrivateRoom && !isPremium) {
            setPricingDialogOpen(true);
            return toast.error('Private rooms are a Premium feature');
        }

        setIsCreating(true);
        socket.emit('room:create', {
            roomName: roomName.trim() || `${username}'s Space`,
            username: username.trim(),
            isPrivate: isPrivateRoom && isPremium,
            password: isPrivateRoom && isPremium ? roomPassword : null,
            creatorTier: tier,
            userId: user?._id // Send User ID
        }, (response) => {
            setIsCreating(false);
            if (response.success) {
                localStorage.setItem('focusroom_username', username);
                navigate(`/room/${response.roomId}`);
            } else {
                toast.error(response.error || 'Failed to create room');
            }
        });
    };

    const handleJoinRoom = (roomId, room) => {
        const displayName = username.trim() || user?.name || '';
        if (!displayName) {
            document.getElementById('username-input')?.focus();
            return toast.error('Please enter your name first');
        }

        if (room?.isPrivate && !isPremium) {
            return toast.error('This is a private room. Premium required to join.');
        }

        socket.emit('room:join', {
            roomId,
            username: displayName,
            userTier: tier,
            userId: user?._id // Send User ID
        }, (response) => {
            if (response.success) {
                localStorage.setItem('focusroom_username', displayName);
                navigate(`/room/${roomId}`);
            } else {
                toast.error(response.error);
            }
        });
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setIsAuthLoading(true);

        try {
            let result;
            if (authMode === 'login') {
                result = await login(authEmail, authPassword);
            } else {
                result = await signup(authEmail, authPassword, authName);
            }

            if (result.success) {
                setAuthDialogOpen(false);
                resetAuthForm();
            }
        } catch (error) {
            console.error('Authentication error:', error);
            // Toast is handled in AuthContext or we can add specific one here if needed
        } finally {
            setIsAuthLoading(false);
        }
    };

    const resetAuthForm = () => {
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
    };

    const handleUpgradeToPremium = async () => {
        if (!isLoggedIn) {
            setPricingDialogOpen(false);
            setAuthDialogOpen(true);
            return toast.error('Please login first to upgrade');
        }

        setPaymentProcessing(true);
        await new Promise(r => setTimeout(r, 500));

        const result = await upgradeToPremium();
        setPaymentProcessing(false);

        if (result.success) {
            setPaymentStep('success');
            setTimeout(() => {
                setPricingDialogOpen(false);
                setPaymentStep('plan');
            }, 2000);
        }
    };

    const getTierBadge = () => {
        if (isPremium) {
            return (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/25">
                    <HiStar className="w-3.5 h-3.5" /> Premium
                </span>
            );
        }
        if (isLoggedIn) {
            return (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    Free Plan
                </span>
            );
        }
        return null;
    };

    const publicRooms = rooms.filter(r => !r.isPrivate);
    const privateRooms = rooms.filter(r => r.isPrivate);
    const totalOnline = rooms.reduce((a, r) => a + (r.participantCount || 0), 0) + activeUsers;

    // Feature comparison data
    const features = [
        { name: 'Video Conferencing', icon: HiVideoCamera, guest: false, free: true, premium: true },
        { name: 'Audio Chat', icon: HiMicrophone, guest: false, free: true, premium: true },
        { name: 'Text Messaging', icon: HiChatBubbleLeftRight, guest: false, free: true, premium: true },
        { name: 'File Attachments', icon: HiPaperClip, guest: false, free: true, premium: true },
        { name: 'Screen Sharing', icon: HiPlay, guest: false, free: true, premium: true },
        { name: 'Private Rooms', icon: HiLockClosed, guest: false, free: false, premium: true },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navbar - Responsive */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                <HiVideoCamera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg sm:text-xl font-bold tracking-tight">FocusRoom</span>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground -mt-0.5 hidden sm:block">Virtual Coworking</p>
                            </div>
                        </div>
                        <div className="hidden sm:block">{getTierBadge()}</div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-3">
                        {isLoggedIn && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/dashboard')}
                                    className="rounded-full h-8 w-8 sm:h-9 sm:w-9"
                                    title="Dashboard"
                                >
                                    <HiChartBar className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCalendarOpen(true)}
                                    className="rounded-full h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex"
                                    title="Calendar & Tasks"
                                >
                                    <HiCalendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-8 w-8 sm:h-9 sm:w-9">
                            {theme === 'dark' ? <HiSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <HiMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </Button>

                        {!isLoggedIn ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setAuthMode('login'); setAuthDialogOpen(true); }} className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                                    Log In
                                </Button>
                                <Button size="sm" onClick={() => { setAuthMode('signup'); setAuthDialogOpen(true); }} className="shadow-lg shadow-primary/25 h-8 px-2 sm:px-4 text-xs sm:text-sm">
                                    <span className="hidden sm:inline">Get Started</span>
                                    <span className="sm:hidden">Sign Up</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 sm:gap-3">
                                {!isPremium && (
                                    <Button
                                        size="sm"
                                        className="gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
                                        onClick={() => setPricingDialogOpen(true)}
                                    >
                                        <HiStar className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Upgrade</span>
                                    </Button>
                                )}
                                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l">
                                    <div className="relative">
                                        <button
                                            className="flex items-center gap-2 focus:outline-none"
                                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        >
                                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-primary/20">
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-bold">
                                                    {user?.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium hidden md:block">{user?.name}</span>
                                        </button>

                                        {/* Dropdown */}
                                        {showProfileMenu && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-card border rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="px-4 py-2 border-b">
                                                    <p className="font-medium text-sm truncate">{user?.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                                </div>
                                                <button
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                                                    onClick={() => { setIsProfileModalOpen(true); setShowProfileMenu(false); }}
                                                >
                                                    <HiUser className="w-4 h-4" /> Profile
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-500 flex items-center gap-2 transition-colors"
                                                    onClick={() => { setShowProfileMenu(false); logout(); }}
                                                >
                                                    <HiArrowRightOnRectangle className="w-4 h-4" /> Logout
                                                </button>
                                            </div>
                                        )}

                                        {/* Overlay to close menu */}
                                        {showProfileMenu && (
                                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                                        )}
                                    </div>

                                    <Button variant="ghost" size="icon" onClick={() => setIsMembersSidebarOpen(true)} title="Members" className="rounded-full h-8 w-8 sm:h-9 sm:w-9">
                                        <HiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section - Responsive */}
            <section className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
                        {/* Left Column - Hero Content */}
                        <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
                            {/* Live Badge */}
                            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                    <span className="animate-ping absolute h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-green-500"></span>
                                </span>
                                <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                                    {totalOnline.toLocaleString()} people focusing
                                </span>
                            </div>

                            {/* Main Heading */}
                            <div className="space-y-2 sm:space-y-3">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
                                    Focus better,{' '}
                                    <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                        together.
                                    </span>
                                </h1>
                                <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                                    Join virtual coworking sessions with focused individuals.
                                    Stay accountable, stay productive.
                                </p>
                            </div>

                            {/* Stats Row - Hidden on mobile */}
                            <div className="hidden sm:flex items-center justify-center lg:justify-start gap-6 sm:gap-8 py-2">
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">50K+</p>
                                    <p className="text-xs text-muted-foreground">Active Users</p>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">1M+</p>
                                    <p className="text-xs text-muted-foreground">Focus Hours</p>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold">4.9</p>
                                    <p className="text-xs text-muted-foreground">User Rating</p>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto h-11 sm:h-12 px-6 text-sm sm:text-base shadow-xl shadow-primary/25 gap-2"
                                    onClick={() => document.getElementById('username-input')?.focus()}
                                >
                                    Start Focusing <HiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>
                                <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 sm:h-12 px-6 text-sm sm:text-base gap-2">
                                    <HiPlay className="w-4 h-4 sm:w-5 sm:h-5" /> Watch Demo
                                </Button>
                            </div>
                        </div>

                        {/* Right Column - Room Creation Card */}
                        <div id="start-section" className="relative lg:pl-10">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-20 -z-10" />
                            <Card className="border-2 shadow-xl">
                                <CardHeader className="pb-2 pt-5 px-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl">Start a Session</CardTitle>
                                            <CardDescription className="text-sm mt-1">
                                                {isLoggedIn
                                                    ? isPremium
                                                        ? 'Create public or private focus rooms'
                                                        : 'Create public rooms • Upgrade for private'
                                                    : 'Join as guest or sign up for full access'}
                                            </CardDescription>
                                        </div>
                                        {!isLoggedIn && (
                                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                                <HiUser className="w-5 h-5 text-amber-500" />
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 px-5 pb-5">
                                    {/* Guest Warning */}
                                    {!isLoggedIn && (
                                        <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                                    <HiSparkles className="w-3.5 h-3.5 text-amber-600" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="font-medium text-amber-700 dark:text-amber-400">Guest Mode</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        View only. <button
                                                            className="text-primary font-medium hover:underline"
                                                            onClick={() => { setAuthMode('signup'); setAuthDialogOpen(true); }}
                                                        >
                                                            Sign up
                                                        </button> for full access.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="username-input" className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Display Name</Label>
                                        <Input
                                            id="username-input"
                                            placeholder="Enter your name"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            maxLength={25}
                                            className="h-10 text-base"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="room-name" className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                                            Room Name <span className="text-[10px] normal-case opacity-70">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="room-name"
                                            placeholder="e.g. Deep Work Session"
                                            value={roomName}
                                            onChange={e => setRoomName(e.target.value)}
                                            maxLength={40}
                                            className="h-10 text-base"
                                        />
                                    </div>

                                    {/* Private Room Toggle */}
                                    <div
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isPremium
                                            ? isPrivateRoom
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                            : 'border-dashed border-muted-foreground/30 opacity-70'
                                            }`}
                                        onClick={() => isPremium ? setIsPrivateRoom(!isPrivateRoom) : setPricingDialogOpen(true)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPremium ? 'bg-primary/10' : 'bg-muted'}`}>
                                                {isPremium ? (
                                                    <HiLockClosed className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <HiLockOpen className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium flex items-center gap-2">
                                                    Private Room
                                                    {!isPremium && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-white font-bold leading-none">
                                                            PRO
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">Password protected</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${isPrivateRoom && isPremium ? 'bg-primary' : 'bg-muted'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isPrivateRoom && isPremium ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>

                                    {isPrivateRoom && isPremium && (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                            <Label htmlFor="room-password" className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Password</Label>
                                            <Input
                                                id="room-password"
                                                type="password"
                                                placeholder="Enter password"
                                                value={roomPassword}
                                                onChange={e => setRoomPassword(e.target.value)}
                                                maxLength={20}
                                                className="h-10"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleCreateRoom}
                                        disabled={isCreating}
                                        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 mt-2"
                                        size="lg"
                                    >
                                        {isCreating ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Start Focusing <HiArrowRight className="w-4 h-4" />
                                            </span>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Rooms Section - Moved up */}
            <section className="py-12 px-6 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Live Sessions</h2>
                            <p className="text-sm text-muted-foreground">Join a room and start focusing with others</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">{rooms.length} active</span>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="public" className="w-full">
                        <TabsList className="grid w-full max-w-[300px] grid-cols-2 mb-6 h-10">
                            <TabsTrigger value="public" className="gap-2 text-sm">
                                <HiGlobeAlt className="w-4 h-4" /> Public
                            </TabsTrigger>
                            <TabsTrigger value="private" className="gap-2 text-sm">
                                <HiLockClosed className="w-4 h-4" /> Private
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="public" className="m-0 min-h-[200px]">
                            {publicRooms.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-background/50">
                                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                                        <HiGlobeAlt className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">No active rooms</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Be the first to create a focus session!</p>
                                    <Button onClick={() => document.getElementById('username-input')?.focus()} variant="secondary">
                                        Create Room
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {publicRooms.map(room => (
                                        <Card
                                            key={room.id}
                                            className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300"
                                            onClick={() => handleJoinRoom(room.id, room)}
                                        >
                                            <CardContent className="pt-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-base">
                                                            {room.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                                                        <HiUserGroup className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium">{room.participantCount}</span>
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors text-lg">{room.name}</h3>
                                                <p className="text-xs text-muted-foreground mb-4">Active focus session • {new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                <Button variant="outline" className="w-full h-9 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                    Join Room <HiArrowRight className="w-3.5 h-3.5 ml-2" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="private" className="m-0 min-h-[200px]">
                            {!isPremium ? (
                                <div className="text-center py-12 border-2 border-dashed border-amber-500/30 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                                    <div className="w-16 h-16 rounded-full bg-amber-500/10 mx-auto mb-3 flex items-center justify-center">
                                        <HiLockClosed className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">Premium Feature</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Upgrade to create and join private rooms</p>
                                    <Button
                                        onClick={() => setPricingDialogOpen(true)}
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                    >
                                        <HiStar className="w-4 h-4 mr-2" /> Upgrade to Premium
                                    </Button>
                                </div>
                            ) : privateRooms.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-background/50">
                                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                                        <HiLockClosed className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">No private rooms</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Create a password-protected focus session!</p>
                                    <Button onClick={() => { setIsPrivateRoom(true); document.getElementById('username-input')?.focus(); }} variant="secondary">
                                        Create Private Room
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {privateRooms.map(room => (
                                        <Card
                                            key={room.id}
                                            className="group cursor-pointer hover:shadow-lg hover:border-amber-500/50 transition-all duration-300 bg-gradient-to-br from-amber-500/5 to-transparent"
                                            onClick={() => handleJoinRoom(room.id, room)}
                                        >
                                            <CardContent className="pt-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <Avatar className="h-10 w-10 ring-2 ring-amber-500/20">
                                                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold text-base">
                                                            {room.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">
                                                        <HiLockClosed className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium">{room.participantCount}</span>
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold mb-1 group-hover:text-amber-600 transition-colors text-lg">{room.name}</h3>
                                                <p className="text-xs text-muted-foreground mb-4">Private session</p>
                                                <Button variant="outline" className="w-full h-9 group-hover:border-amber-500 group-hover:text-amber-600 transition-all">
                                                    Join Room <HiArrowRight className="w-3.5 h-3.5 ml-2" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            {/* Features Section - Moved down */}
            <section className="py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-2">
                            Everything you need to{' '}
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">stay focused</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Powerful features designed to boost your productivity.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: HiUsers, title: 'Virtual Coworking', desc: 'Work alongside others in real-time video sessions', color: 'indigo' },
                            { icon: HiClock, title: 'Focus Timer', desc: 'Built-in Pomodoro timer to track your productivity', color: 'purple' },
                            { icon: HiBolt, title: 'Instant Rooms', desc: 'Create or join rooms in seconds, no setup needed', color: 'pink' },
                            { icon: HiChatBubbleLeftRight, title: 'Team Chat', desc: 'Communicate without breaking your focus flow', color: 'emerald' },
                            { icon: HiLockClosed, title: 'Private Rooms', desc: 'Password-protected spaces for your team', color: 'amber' },
                            { icon: HiChartBar, title: 'Progress Tracking', desc: 'Monitor your focus hours and productivity', color: 'rose' },
                        ].map((feature, i) => (
                            <Card key={i} className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300 border-none shadow-sm bg-muted/40">
                                <CardContent className="pt-6">
                                    <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className={`w-6 h-6 text-${feature.color}-500`} />
                                    </div>
                                    <h3 className="text-base font-semibold mb-1">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Comparison */}
            <section className="py-16 px-6 bg-muted/30">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold mb-2">Compare Plans</h2>
                        <p className="text-sm text-muted-foreground">Choose the plan that works best for you</p>
                    </div>

                    <Card className="overflow-hidden border shadow-sm">
                        <div className="grid grid-cols-4 gap-4 p-4 items-center bg-muted/50 border-b">
                            <div className="font-semibold text-sm">Features</div>
                            <div className="text-center">
                                <p className="font-semibold text-sm text-muted-foreground">Guest</p>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-sm text-primary">Free</p>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-sm text-amber-600">Premium</p>
                            </div>
                        </div>
                        <div className="divide-y text-sm">
                            {features.map((feature, i) => (
                                <div key={i} className="grid grid-cols-4 gap-4 p-3 items-center hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <feature.icon className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium text-xs sm:text-sm">{feature.name}</span>
                                    </div>
                                    <div className="flex justify-center">
                                        {feature.guest ? (
                                            <HiCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <HiXMark className="w-4 h-4 text-red-400 opacity-50" />
                                        )}
                                    </div>
                                    <div className="flex justify-center">
                                        {feature.free ? (
                                            <HiCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <HiXMark className="w-4 h-4 text-red-400 opacity-50" />
                                        )}
                                    </div>
                                    <div className="flex justify-center">
                                        {feature.premium ? (
                                            <HiCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <HiXMark className="w-4 h-4 text-red-400 opacity-50" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </section>

            {/* Calendar Modal */}
            <CalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
            <MembersSidebar isOpen={isMembersSidebarOpen} onClose={() => setIsMembersSidebarOpen(false)} />

            {/* Auth and Pricing Dialogs (Unchanged in logic, just re-rendering) */}
            <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{authMode === 'login' ? 'Welcome back' : 'Create account'}</DialogTitle>
                        <DialogDescription>
                            {authMode === 'login'
                                ? 'Enter your credentials to access your account'
                                : 'Sign up to unlock video, audio, and chat features'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAuthSubmit} className="space-y-4 pt-4">
                        {authMode === 'signup' && (
                            <div className="space-y-2">
                                <Label htmlFor="auth-name">Name</Label>
                                <Input
                                    id="auth-name"
                                    type="text"
                                    placeholder="Your name"
                                    value={authName}
                                    onChange={(e) => setAuthName(e.target.value)}
                                    required
                                    className="h-10"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="auth-email">Email</Label>
                            <Input
                                id="auth-email"
                                type="email"
                                placeholder="you@example.com"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="auth-password">Password</Label>
                            <Input
                                id="auth-password"
                                type="password"
                                placeholder="••••••••"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                        <Button type="submit" className="w-full h-10" disabled={isAuthLoading}>
                            {isAuthLoading ? 'Please wait...' : (authMode === 'login' ? 'Log In' : 'Create Account')}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                            <button type="button" className="text-primary font-medium hover:underline" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                                {authMode === 'login' ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                <HiStar className="w-5 h-5 text-white" />
                            </div>
                            Upgrade to Premium
                        </DialogTitle>
                        <DialogDescription>
                            Unlock private rooms and exclusive features
                        </DialogDescription>
                    </DialogHeader>

                    {paymentStep === 'plan' && (
                        <div className="space-y-6 pt-4">
                            <div className="p-6 rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold">Premium Plan</h3>
                                        <p className="text-sm text-muted-foreground">Lifetime access</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold">₹499</p>
                                        <p className="text-xs text-muted-foreground">one-time payment</p>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        'Unlimited private rooms',
                                        'Password-protected sessions',
                                        'Priority support',
                                        'Early feature access',
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                <HiCheck className="w-3 h-3 text-white" />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                onClick={() => setPaymentStep('payment')}
                                className="w-full h-12 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                disabled={!isLoggedIn}
                            >
                                {isLoggedIn ? (
                                    <>
                                        <HiCreditCard className="w-5 h-5 mr-2" /> Continue to Payment
                                    </>
                                ) : (
                                    'Login Required'
                                )}
                            </Button>

                            {!isLoggedIn && (
                                <p className="text-sm text-center text-muted-foreground">
                                    <button
                                        className="text-primary font-medium hover:underline"
                                        onClick={() => { setPricingDialogOpen(false); setAuthDialogOpen(true); }}
                                    >
                                        Login or Sign up
                                    </button> to continue
                                </p>
                            )}
                        </div>
                    )}

                    {paymentStep === 'payment' && (
                        <div className="space-y-6 pt-4">
                            <div className="p-4 rounded-xl bg-muted flex items-center justify-between">
                                <span className="font-medium">Premium Plan</span>
                                <span className="text-xl font-bold">₹499</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Card Number</Label>
                                    <Input
                                        placeholder="4242 4242 4242 4242"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Expiry</Label>
                                        <Input
                                            placeholder="MM/YY"
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(e.target.value)}
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CVC</Label>
                                        <Input
                                            placeholder="123"
                                            value={cardCvc}
                                            onChange={(e) => setCardCvc(e.target.value)}
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <HiShieldCheck className="w-6 h-6 text-green-500 shrink-0" />
                                <p className="text-sm text-muted-foreground">Demo payment only. No charges will be made.</p>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setPaymentStep('plan')} className="flex-1 h-12">
                                    Back
                                </Button>
                                <Button
                                    onClick={handleUpgradeToPremium}
                                    disabled={paymentProcessing}
                                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                >
                                    {paymentProcessing ? 'Processing...' : 'Pay ₹499'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {paymentStep === 'success' && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-green-500 mx-auto mb-6 flex items-center justify-center animate-in zoom-in">
                                <HiCheck className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Welcome to Premium! 🎉</h3>
                            <p className="text-muted-foreground">You now have access to all premium features.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <footer className="py-8 px-6 border-t mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <HiVideoCamera className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-sm">FocusRoom</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © 2025 FocusRoom. Built for productivity.
                    </p>
                </div>
            </footer>

            <CalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
        </div>
    );
}
