import { useState, useEffect } from 'react';
import {
    HiXMark,
    HiChartBar,
    HiClock,
    HiCheckCircle,
    HiTrophy,
    HiCalendar
} from 'react-icons/hi2';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from '@/utils/axios';

export default function Dashboard({ isOpen, onClose }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week'); // 'today', 'week', 'month', 'total'

    useEffect(() => {
        if (isOpen) {
            fetchStats();
        }
    }, [isOpen]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/stats');
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const currentStats = stats?.[timeRange] || { tasks: 0, completed: 0, meetingTime: 0 };
    const completionRate = currentStats.tasks > 0
        ? Math.round((currentStats.completed / currentStats.tasks) * 100)
        : 0;

    // Prepare chart data
    const chartData = stats?.dailyBreakdown?.map(day => ({
        date: new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }),
        time: Math.round(day.duration / 60) // Convert to minutes
    })) || [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
            <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-card">
                <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-4 px-4 sm:px-6 border-b sticky top-0 bg-card z-10">
                    <CardTitle className="text-base sm:text-xl font-semibold flex items-center gap-2">
                        <HiChartBar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                        <span className="hidden sm:inline">Productivity Dashboard</span>
                        <span className="sm:hidden">Dashboard</span>
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <HiXMark className="w-5 h-5" />
                    </Button>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 sm:h-64">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Time Range Selector - Scrollable on mobile */}
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap overflow-x-auto pb-2 sm:pb-0 -mx-1 px-1">
                                {['today', 'week', 'month', 'total'].map(range => (
                                    <Button
                                        key={range}
                                        variant={timeRange === range ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTimeRange(range)}
                                        className="capitalize text-xs sm:text-sm px-3 sm:px-4 shrink-0"
                                    >
                                        {range}
                                    </Button>
                                ))}
                            </div>

                            {/* Quick Stats Cards - 2 columns on mobile, 4 on desktop */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                                <Card className="border-2 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                                <HiClock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Focus Time</p>
                                                <p className="text-lg sm:text-2xl font-bold truncate">{formatTime(currentStats.meetingTime)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                                                <HiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Tasks Done</p>
                                                <p className="text-lg sm:text-2xl font-bold truncate">{currentStats.completed}/{currentStats.tasks}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                                                <HiTrophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Success Rate</p>
                                                <p className="text-lg sm:text-2xl font-bold">{completionRate}%</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                                                <HiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Avg/Day</p>
                                                <p className="text-lg sm:text-2xl font-bold">{timeRange === 'week' ? Math.round(currentStats.meetingTime / 7 / 60) : Math.round(currentStats.meetingTime / 30 / 60)}m</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Secondary Stats Row */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-none">
                                    <CardContent className="p-3 sm:p-4 text-center">
                                        <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Pending</p>
                                        <p className="text-xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{currentStats.tasks - currentStats.completed}</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-none">
                                    <CardContent className="p-3 sm:p-4 text-center">
                                        <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Total Hours</p>
                                        <p className="text-xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{Math.floor(currentStats.meetingTime / 3600)}h</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-none">
                                    <CardContent className="p-3 sm:p-4 text-center">
                                        <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Status</p>
                                        <p className="text-xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                                            {completionRate >= 80 ? '🔥' : completionRate >= 50 ? '⭐' : '💪'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Daily Breakdown Chart - Responsive height */}
                            {timeRange === 'week' && chartData.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2 sm:pb-4">
                                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                            <HiCalendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="hidden sm:inline">Weekly Focus Time (Minutes)</span>
                                            <span className="sm:hidden">Weekly Focus</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-2 sm:px-6">
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="date" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                                                <YAxis className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} width={30} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                                <Bar dataKey="time" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}

                            {/* All-Time Summary - Responsive */}
                            {stats?.total && (
                                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                                    <CardHeader className="pb-2 sm:pb-4">
                                        <CardTitle className="text-sm sm:text-base">All-Time Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                                        <div>
                                            <p className="text-lg sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {formatTime(stats.total.meetingTime)}
                                            </p>
                                            <p className="text-[10px] sm:text-sm text-muted-foreground">Total Focus</p>
                                        </div>
                                        <div>
                                            <p className="text-lg sm:text-3xl font-bold text-green-600 dark:text-green-400">
                                                {stats.total.completed}
                                            </p>
                                            <p className="text-[10px] sm:text-sm text-muted-foreground">Tasks Done</p>
                                        </div>
                                        <div>
                                            <p className="text-lg sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                                                {Math.round((stats.total.completed / stats.total.tasks) * 100) || 0}%
                                            </p>
                                            <p className="text-[10px] sm:text-sm text-muted-foreground">Success</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
