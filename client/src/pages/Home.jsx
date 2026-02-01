import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    HiVideoCamera,
    HiArrowRight,
    HiUserGroup,
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
    HiCalendar,
    HiSparkles,
    HiComputerDesktop,
    HiSignal
} from 'react-icons/hi2';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import CalendarModal from '@/components/CalendarModal';
import ProfileModal from '@/components/ProfileModal';
import MembersSidebar from '@/components/MembersSidebar';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Home() {
    const { socket, isConnected, rooms } = useSocket();
    const { theme, toggleTheme } = useTheme();
    const { user, tier, isLoggedIn, isPremium, login, signup, logout, upgradeToPremium } = useAuth();
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

    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authName, setAuthName] = useState('');
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const [paymentStep, setPaymentStep] = useState('plan');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateRoom = () => {
        if (!username.trim()) return toast.error('Please enter your name');
        if (!isConnected) return toast.error('Reconnecting…');
        if (isPrivateRoom && !isPremium) {
            setPricingDialogOpen(true);
            return toast.error('Private rooms require Premium');
        }

        setIsCreating(true);
        socket.emit('room:create', {
            roomName: roomName.trim() || `${username}'s Space`,
            username: username.trim(),
            isPrivate: isPrivateRoom && isPremium,
            password: isPrivateRoom && isPremium ? roomPassword : null,
            creatorTier: tier,
            userId: user?._id
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
            return toast.error('Enter your name first');
        }

        if (room?.isPrivate && !isPremium) {
            return toast.error('Premium required for private rooms');
        }

        socket.emit('room:join', {
            roomId,
            username: displayName,
            userTier: tier,
            userId: user?._id
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
            const result = authMode === 'login'
                ? await login(authEmail, authPassword)
                : await signup(authEmail, authPassword, authName);
            if (result.success) {
                setAuthDialogOpen(false);
                setAuthEmail(''); setAuthPassword(''); setAuthName('');
            }
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleUpgradeToPremium = async () => {
        if (!isLoggedIn) {
            setPricingDialogOpen(false);
            setAuthDialogOpen(true);
            return toast.error('Please login first');
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

    const publicRooms = rooms.filter(r => !r.isPrivate);
    const privateRooms = rooms.filter(r => r.isPrivate);
    const totalOnline = rooms.reduce((a, r) => a + (r.participantCount || 0), 0) + activeUsers;

    const features = [
        { name: 'Video', icon: HiVideoCamera, guest: false, free: true, premium: true },
        { name: 'Audio', icon: HiMicrophone, guest: false, free: true, premium: true },
        { name: 'Chat', icon: HiChatBubbleLeftRight, guest: false, free: true, premium: true },
        { name: 'Files', icon: HiPaperClip, guest: false, free: true, premium: true },
        { name: 'Screen Share', icon: HiComputerDesktop, guest: false, free: true, premium: true },
        { name: 'Private Rooms', icon: HiLockClosed, guest: false, free: false, premium: true },
    ];

    const featureCards = [
        { icon: HiUsers, title: 'Coworking', desc: 'Real-time video sessions', color: 'cyan' },
        { icon: HiClock, title: 'Focus Timer', desc: 'Built-in Pomodoro', color: 'teal' },
        { icon: HiBolt, title: 'Instant', desc: 'Zero setup needed', color: 'blue' },
        { icon: HiChatBubbleLeftRight, title: 'Team Chat', desc: 'Stay connected', color: 'emerald' },
        { icon: HiLockClosed, title: 'Private', desc: 'Password protected', color: 'amber' },
        { icon: HiChartBar, title: 'Analytics', desc: 'Track progress', color: 'slate' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* ===== NAVBAR ===== */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-primary">
                            <HiVideoCamera className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">FocusRoom</span>
                        {isPremium && (
                            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
                                <HiStar className="w-3 h-3" /> Pro
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {isLoggedIn && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full" aria-label="Dashboard">
                                    <HiChartBar className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setCalendarOpen(true)} className="rounded-full hidden sm:flex" aria-label="Calendar">
                                    <HiCalendar className="w-5 h-5" />
                                </Button>
                            </>
                        )}

                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full" aria-label="Toggle theme">
                            {theme === 'dark' ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
                        </Button>

                        {!isLoggedIn ? (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setAuthMode('login'); setAuthDialogOpen(true); }} className="h-9">
                                    Log In
                                </Button>
                                <Button size="sm" onClick={() => { setAuthMode('signup'); setAuthDialogOpen(true); }} className="h-9 btn-glow">
                                    Get Started
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 pl-2 border-l border-border/50">
                                {!isPremium && (
                                    <Button size="sm" className="gap-1.5 h-9 btn-premium hidden sm:flex" onClick={() => setPricingDialogOpen(true)}>
                                        <HiStar className="w-4 h-4" /> Upgrade
                                    </Button>
                                )}

                                <div className="relative">
                                    <button
                                        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        aria-label="Profile menu"
                                    >
                                        <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                                            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>

                                    {showProfileMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                                            <div className="absolute top-full right-0 mt-2 w-52 glass border rounded-xl shadow-xl z-50 py-1 animate-scale-in">
                                                <div className="px-4 py-3 border-b border-border/50">
                                                    <p className="font-medium text-sm truncate">{user?.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                                </div>
                                                <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent flex items-center gap-2 cursor-pointer" onClick={() => { setIsProfileModalOpen(true); setShowProfileMenu(false); }}>
                                                    <HiUser className="w-4 h-4 text-muted-foreground" /> Profile
                                                </button>
                                                <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2 cursor-pointer" onClick={() => { setShowProfileMenu(false); logout(); }}>
                                                    <HiArrowRightOnRectangle className="w-4 h-4" /> Log Out
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <Button variant="ghost" size="icon" onClick={() => setIsMembersSidebarOpen(true)} className="rounded-full" aria-label="Members">
                                    <HiUsers className="w-5 h-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ===== HERO ===== */}
            <section className="relative min-h-screen flex items-center pt-16">
                {/* Decorative Orbs */}
                <div className="orb orb-primary w-[500px] h-[500px] -top-48 -left-48 animate-float" aria-hidden="true" />
                <div className="orb orb-secondary w-[400px] h-[400px] top-1/2 -right-48 animate-float-delayed" aria-hidden="true" />

                {/* Grid Background */}
                <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
                <div className="absolute inset-0 gradient-mesh" aria-hidden="true" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left */}
                        <div className="text-center lg:text-left space-y-8">
                            {/* Live Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-emerald-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="live-dot absolute h-full w-full rounded-full bg-emerald-500" />
                                    <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-sm font-medium text-emerald-500 tabular-nums">
                                    {totalOnline.toLocaleString()} focusing
                                </span>
                            </div>

                            {/* Heading */}
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                                Focus better,
                                <br />
                                <span className="gradient-text-primary">together.</span>
                            </h1>

                            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                                Virtual coworking for maximum productivity.
                            </p>

                            {/* Stats */}
                            <div className="flex items-center justify-center lg:justify-start gap-10">
                                <div>
                                    <p className="text-3xl sm:text-4xl font-bold stat-value">50K+</p>
                                    <p className="text-sm text-muted-foreground">Users</p>
                                </div>
                                <div className="w-px h-12 bg-border" />
                                <div>
                                    <p className="text-3xl sm:text-4xl font-bold stat-value">1M+</p>
                                    <p className="text-sm text-muted-foreground">Hours</p>
                                </div>
                                <div className="w-px h-12 bg-border hidden sm:block" />
                                <div className="hidden sm:block">
                                    <p className="text-3xl sm:text-4xl font-bold stat-value">4.9</p>
                                    <p className="text-sm text-muted-foreground">Rating</p>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Button size="lg" className="h-14 px-8 text-base btn-glow gap-2 w-full sm:w-auto" onClick={() => document.getElementById('username-input')?.focus()}>
                                    Start Now <HiArrowRight className="w-5 h-5" />
                                </Button>
                                <Button variant="outline" size="lg" className="h-14 px-8 text-base gap-2 w-full sm:w-auto glass border-border/50">
                                    <HiPlay className="w-5 h-5" /> Watch Demo
                                </Button>
                            </div>
                        </div>

                        {/* Right - Form Card */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl -z-10" aria-hidden="true" />
                            <Card className="card-glass border-border/50 shadow-2xl">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl">Start Session</CardTitle>
                                            <CardDescription className="mt-1">
                                                {isLoggedIn ? (isPremium ? 'Create any room' : 'Public rooms') : 'Guest mode'}
                                            </CardDescription>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <HiSignal className="w-5 h-5 text-primary" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!isLoggedIn && (
                                        <div className="p-3 rounded-xl glass border border-amber-500/20 bg-amber-500/5">
                                            <div className="flex items-center gap-3">
                                                <HiSparkles className="w-5 h-5 text-amber-500 shrink-0" />
                                                <p className="text-sm">
                                                    <button className="text-primary font-medium hover:underline cursor-pointer" onClick={() => { setAuthMode('signup'); setAuthDialogOpen(true); }}>
                                                        Sign up
                                                    </button>
                                                    {' '}for full access
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="username-input">Name</Label>
                                        <Input id="username-input" placeholder="Your name…" value={username} onChange={e => setUsername(e.target.value)} maxLength={25} className="h-12 bg-background/50" autoComplete="name" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="room-name">Room <span className="text-muted-foreground">(optional)</span></Label>
                                        <Input id="room-name" placeholder="Deep Work…" value={roomName} onChange={e => setRoomName(e.target.value)} maxLength={40} className="h-12 bg-background/50" autoComplete="off" />
                                    </div>

                                    <button
                                        type="button"
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isPremium ? isPrivateRoom ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50' : 'border-dashed opacity-60'}`}
                                        onClick={() => isPremium ? setIsPrivateRoom(!isPrivateRoom) : setPricingDialogOpen(true)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPremium ? 'bg-primary/10' : 'bg-muted'}`}>
                                                {isPremium ? <HiLockClosed className="w-5 h-5 text-primary" /> : <HiLockOpen className="w-5 h-5 text-muted-foreground" />}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium flex items-center gap-2">
                                                    Private {!isPremium && <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-white font-semibold">PRO</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Password protected</p>
                                            </div>
                                        </div>
                                        <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${isPrivateRoom && isPremium ? 'bg-primary' : 'bg-muted'}`}>
                                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isPrivateRoom && isPremium ? 'translate-x-5' : ''}`} />
                                        </div>
                                    </button>

                                    {isPrivateRoom && isPremium && (
                                        <div className="space-y-2 animate-fade-in-up">
                                            <Label htmlFor="room-password">Password</Label>
                                            <Input id="room-password" type="password" placeholder="••••••" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} maxLength={20} className="h-12 bg-background/50" />
                                        </div>
                                    )}

                                    <Button onClick={handleCreateRoom} disabled={isCreating} className="w-full h-14 text-base font-semibold btn-glow" size="lg">
                                        {isCreating ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                                Creating…
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">Start Focusing <HiArrowRight className="w-5 h-5" /></span>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== LIVE ROOMS ===== */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
                <div className="absolute inset-0 bg-muted/30" />
                <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold">Live Sessions</h2>
                            <p className="text-muted-foreground mt-2">Join others focused right now</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-border/50">
                            <span className="relative flex h-2 w-2">
                                <span className="live-dot absolute h-full w-full rounded-full bg-emerald-500" />
                                <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-sm font-medium tabular-nums">{rooms.length} active</span>
                        </div>
                    </div>

                    <Tabs defaultValue="public" className="w-full">
                        <TabsList className="grid w-full max-w-xs grid-cols-2 mb-8 h-12 glass p-1">
                            <TabsTrigger value="public" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow">
                                <HiGlobeAlt className="w-4 h-4" /> Public
                            </TabsTrigger>
                            <TabsTrigger value="private" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow">
                                <HiLockClosed className="w-4 h-4" /> Private
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="public" className="m-0">
                            {publicRooms.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed rounded-2xl glass">
                                    <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                                        <HiGlobeAlt className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold">No active rooms</h3>
                                    <p className="text-muted-foreground mt-1 mb-4">Be the first!</p>
                                    <Button onClick={() => document.getElementById('username-input')?.focus()} variant="secondary" className="cursor-pointer">
                                        Create Room
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {publicRooms.map(room => (
                                        <Card key={room.id} className="group cursor-pointer card-glass" onClick={() => handleJoinRoom(room.id, room)}>
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                                                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                                                            {room.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                                                        <HiUserGroup className="w-4 h-4" />
                                                        <span className="text-xs font-medium tabular-nums">{room.participantCount}</span>
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-primary transition-colors">{room.name}</h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <Button variant="outline" className="w-full h-11 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                                    Join <HiArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="private" className="m-0">
                            {!isPremium ? (
                                <div className="text-center py-20 border-2 border-dashed border-amber-500/30 rounded-2xl glass">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto mb-4 flex items-center justify-center">
                                        <HiLockClosed className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Premium Feature</h3>
                                    <p className="text-muted-foreground mt-1 mb-4">Upgrade to access</p>
                                    <Button onClick={() => setPricingDialogOpen(true)} className="btn-premium cursor-pointer">
                                        <HiStar className="w-4 h-4 mr-2" /> Upgrade
                                    </Button>
                                </div>
                            ) : privateRooms.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed rounded-2xl glass">
                                    <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                                        <HiLockClosed className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold">No private rooms</h3>
                                    <p className="text-muted-foreground mt-1 mb-4">Create one now</p>
                                    <Button onClick={() => { setIsPrivateRoom(true); document.getElementById('username-input')?.focus(); }} variant="secondary" className="cursor-pointer">
                                        Create Private Room
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {privateRooms.map(room => (
                                        <Card key={room.id} className="group cursor-pointer card-glass border-amber-500/20" onClick={() => handleJoinRoom(room.id, room)}>
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <Avatar className="h-12 w-12 ring-2 ring-amber-500/30">
                                                        <AvatarFallback className="bg-amber-500 text-white font-bold text-lg">
                                                            {room.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500">
                                                        <HiLockClosed className="w-4 h-4" />
                                                        <span className="text-xs font-medium tabular-nums">{room.participantCount}</span>
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-amber-500 transition-colors">{room.name}</h3>
                                                <p className="text-sm text-muted-foreground mb-4">Private</p>
                                                <Button variant="outline" className="w-full h-11 group-hover:border-amber-500 group-hover:text-amber-500 transition-colors">
                                                    Join <HiArrowRight className="w-4 h-4 ml-2" />
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

            {/* ===== FEATURES ===== */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="orb orb-primary w-[300px] h-[300px] -bottom-24 -left-24" aria-hidden="true" />

                <div className="max-w-7xl mx-auto relative">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold">
                            Stay <span className="gradient-text-primary">focused</span>
                        </h2>
                        <p className="text-muted-foreground mt-3 text-lg">Powerful productivity tools</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featureCards.map((feature, i) => (
                            <Card key={i} className="group card-glass border-border/50 hover:border-primary/30">
                                <CardContent className="p-6">
                                    <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className={`w-6 h-6 text-${feature.color}-500`} />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PRICING ===== */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold">Plans</h2>
                        <p className="text-muted-foreground mt-2">Choose yours</p>
                    </div>

                    <Card className="glass border-border/50 overflow-hidden">
                        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 border-b border-border/50 text-sm font-medium">
                            <div>Feature</div>
                            <div className="text-center text-muted-foreground">Guest</div>
                            <div className="text-center text-primary">Free</div>
                            <div className="text-center text-amber-500">Pro</div>
                        </div>
                        <div className="divide-y divide-border/50">
                            {features.map((f, i) => (
                                <div key={i} className="grid grid-cols-4 gap-4 p-4 items-center text-sm hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <f.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className="font-medium truncate">{f.name}</span>
                                    </div>
                                    <div className="flex justify-center">
                                        {f.guest ? <HiCheck className="w-5 h-5 text-emerald-500" /> : <HiXMark className="w-5 h-5 text-muted-foreground/30" />}
                                    </div>
                                    <div className="flex justify-center">
                                        {f.free ? <HiCheck className="w-5 h-5 text-emerald-500" /> : <HiXMark className="w-5 h-5 text-muted-foreground/30" />}
                                    </div>
                                    <div className="flex justify-center">
                                        {f.premium ? <HiCheck className="w-5 h-5 text-emerald-500" /> : <HiXMark className="w-5 h-5 text-muted-foreground/30" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {!isPremium && (
                        <div className="mt-10 text-center">
                            <Button size="lg" className="h-14 px-10 btn-premium cursor-pointer" onClick={() => setPricingDialogOpen(true)}>
                                <HiStar className="w-5 h-5 mr-2" /> Upgrade — ₹499
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                            <HiVideoCamera className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold">FocusRoom</span>
                    </div>
                    <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} FocusRoom</p>
                </div>
            </footer>

            {/* ===== MODALS ===== */}
            <CalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
            <MembersSidebar isOpen={isMembersSidebarOpen} onClose={() => setIsMembersSidebarOpen(false)} />

            {/* Auth Dialog */}
            <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogContent className="sm:max-w-md glass border-border/50">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{authMode === 'login' ? 'Welcome back' : 'Get started'}</DialogTitle>
                        <DialogDescription>{authMode === 'login' ? 'Enter your credentials' : 'Create your account'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAuthSubmit} className="space-y-4 pt-4">
                        {authMode === 'signup' && (
                            <div className="space-y-2">
                                <Label htmlFor="auth-name">Name</Label>
                                <Input id="auth-name" placeholder="Your name" value={authName} onChange={e => setAuthName(e.target.value)} required className="h-12 bg-background/50" autoComplete="name" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="auth-email">Email</Label>
                            <Input id="auth-email" type="email" placeholder="you@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className="h-12 bg-background/50" autoComplete="email" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="auth-password">Password</Label>
                            <Input id="auth-password" type="password" placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required className="h-12 bg-background/50" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} />
                        </div>
                        <Button type="submit" className="w-full h-12 btn-glow" disabled={isAuthLoading}>
                            {isAuthLoading ? 'Please wait…' : (authMode === 'login' ? 'Log In' : 'Create Account')}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            {authMode === 'login' ? 'No account? ' : 'Have an account? '}
                            <button type="button" className="text-primary font-medium hover:underline cursor-pointer" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                                {authMode === 'login' ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Pricing Dialog */}
            <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
                <DialogContent className="sm:max-w-lg glass border-border/50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                                <HiStar className="w-5 h-5 text-white" />
                            </div>
                            Upgrade
                        </DialogTitle>
                        <DialogDescription>Unlock all features</DialogDescription>
                    </DialogHeader>

                    {paymentStep === 'plan' && (
                        <div className="space-y-6 pt-4">
                            <div className="p-6 rounded-2xl border-2 border-amber-500 bg-amber-500/5">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold">Premium</h3>
                                        <p className="text-sm text-muted-foreground">Lifetime</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold tabular-nums">₹499</p>
                                        <p className="text-xs text-muted-foreground">one-time</p>
                                    </div>
                                </div>
                                <ul className="space-y-3">
                                    {['Private rooms', 'Password protection', 'Priority support', 'Early access'].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                <HiCheck className="w-3 h-3 text-white" />
                                            </div>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button onClick={() => setPaymentStep('payment')} className="w-full h-14 btn-premium cursor-pointer" disabled={!isLoggedIn}>
                                {isLoggedIn ? <><HiCreditCard className="w-5 h-5 mr-2" /> Continue</> : 'Login Required'}
                            </Button>
                            {!isLoggedIn && (
                                <p className="text-sm text-center text-muted-foreground">
                                    <button className="text-primary font-medium hover:underline cursor-pointer" onClick={() => { setPricingDialogOpen(false); setAuthDialogOpen(true); }}>
                                        Login
                                    </button>{' '}to continue
                                </p>
                            )}
                        </div>
                    )}

                    {paymentStep === 'payment' && (
                        <div className="space-y-6 pt-4">
                            <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
                                <span className="font-medium">Premium</span>
                                <span className="text-xl font-bold tabular-nums">₹499</span>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Card Number</Label>
                                    <Input placeholder="4242 4242 4242 4242" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="h-12 bg-background/50" autoComplete="cc-number" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Expiry</Label>
                                        <Input placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} className="h-12 bg-background/50" autoComplete="cc-exp" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CVC</Label>
                                        <Input placeholder="123" value={cardCvc} onChange={e => setCardCvc(e.target.value)} className="h-12 bg-background/50" autoComplete="cc-csc" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <HiShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                                <p className="text-sm text-muted-foreground">Demo only. No charges.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setPaymentStep('plan')} className="flex-1 h-12 cursor-pointer">Back</Button>
                                <Button onClick={handleUpgradeToPremium} disabled={paymentProcessing} className="flex-1 h-12 btn-premium cursor-pointer">
                                    {paymentProcessing ? 'Processing…' : 'Pay ₹499'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {paymentStep === 'success' && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-emerald-500 mx-auto mb-6 flex items-center justify-center animate-scale-in">
                                <HiCheck className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Welcome to Premium!</h3>
                            <p className="text-muted-foreground">All features unlocked.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
