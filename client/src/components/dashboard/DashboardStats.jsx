import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    HiClock,
    HiCheckCircle,
    HiTrophy,
    HiCalendar
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

export default function DashboardStats({ stats }) {
    const [timeRange, setTimeRange] = useState('week');

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

    const chartData = stats?.dailyBreakdown?.map(day => ({
        date: new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }),
        time: Math.round(day.duration / 60)
    })) || [];

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2 flex-wrap">
                {['today', 'week', 'month', 'total'].map(range => (
                    <Button
                        key={range}
                        variant={timeRange === range ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeRange(range)}
                        className="capitalize"
                    >
                        {range}
                    </Button>
                ))}
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-2 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                <HiClock className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Focus Time</p>
                                <p className="text-2xl font-bold">{formatTime(currentStats.meetingTime)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                <HiCheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tasks Done</p>
                                <p className="text-2xl font-bold">{currentStats.completed}/{currentStats.tasks}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                <HiTrophy className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Success Rate</p>
                                <p className="text-2xl font-bold">{completionRate}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                <HiCalendar className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg/Day</p>
                                <p className="text-2xl font-bold">{timeRange === 'week' ? Math.round(currentStats.meetingTime / 7 / 60) : Math.round(currentStats.meetingTime / 30 / 60)}m</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Chart */}
            {timeRange === 'week' && chartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Weekly Focus Time (Minutes)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))'
                                    }}
                                />
                                <Bar dataKey="time" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
