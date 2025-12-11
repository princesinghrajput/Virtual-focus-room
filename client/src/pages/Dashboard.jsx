import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiChartBar } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getDashboardData } from '@/services/messageService';
import DashboardStats from '@/components/dashboard/DashboardStats';
import MeetingHistory from '@/components/dashboard/MeetingHistory';
import ChatHistory from '@/components/dashboard/ChatHistory';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSessionId, setSelectedSessionId] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/');
            return;
        }
        fetchData();
    }, [isLoggedIn]);

    const fetchData = async () => {
        setLoading(true);
        const result = await getDashboardData();
        if (result.success) {
            setData(result.data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header - Responsive */}
            <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/')}
                                className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
                            >
                                <HiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <HiChartBar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-2xl font-bold">Dashboard</h1>
                                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Welcome back, {user?.name}!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Responsive */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
                {/* Stats Section */}
                <DashboardStats stats={data?.stats} />

                {/* Meeting & Chat History - Stack on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <MeetingHistory
                        sessions={data?.recentSessions}
                        selectedSessionId={selectedSessionId}
                        onSelectSession={setSelectedSessionId}
                    />
                    <ChatHistory
                        initialMessages={data?.recentMessages}
                        sessionId={selectedSessionId}
                    />
                </div>
            </main>
        </div>
    );
}
