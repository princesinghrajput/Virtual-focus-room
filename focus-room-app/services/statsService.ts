import api from "./api";
import { API_ENDPOINTS } from "@/config/api";

export type TimeRangeStats = {
    tasks: number;
    completed: number;
    meetingTime: number; // in seconds
};

export type DailyBreakdown = {
    _id: string; // date string
    duration: number;
};

export type Stats = {
    today: TimeRangeStats;
    week: TimeRangeStats;
    month: TimeRangeStats;
    total: TimeRangeStats;
    dailyBreakdown: DailyBreakdown[];
};

export type Session = {
    _id: string;
    roomId: string;
    roomName: string;
    joinedAt: string;
    leftAt?: string;
    duration: number;
};

export type Message = {
    _id: string;
    userId: { _id: string; name: string };
    content: string;
    roomId: string;
    createdAt: string;
};

export type DashboardData = {
    stats: Stats;
    recentSessions: Session[];
    recentMessages: Message[];
};

type StatsResponse = {
    success: boolean;
    stats: Stats;
};

type DashboardResponse = {
    success: boolean;
    data: DashboardData;
};

// Get user statistics
export async function getStats(): Promise<StatsResponse> {
    return api.get<StatsResponse>(API_ENDPOINTS.STATS.GET);
}

// Get comprehensive dashboard data
export async function getDashboardData(): Promise<DashboardResponse> {
    return api.get<DashboardResponse>(API_ENDPOINTS.STATS.DASHBOARD);
}

// Record session start
export async function startSession(roomId: string, roomName: string): Promise<{ success: boolean; sessionId: string }> {
    return api.post(API_ENDPOINTS.STATS.SESSION, { roomId, roomName, event: "start" });
}

// Record session end
export async function endSession(sessionId: string): Promise<{ success: boolean; duration: number }> {
    return api.post(API_ENDPOINTS.STATS.SESSION, { sessionId, event: "end" });
}

// Format time helper
export function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
