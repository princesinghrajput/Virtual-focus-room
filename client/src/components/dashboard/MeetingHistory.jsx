import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HiClock, HiCalendar, HiLockClosed, HiGlobeAlt } from 'react-icons/hi2';
import { toggleSessionPrivacy } from '@/services/sessionService';
import toast from 'react-hot-toast';

export default function MeetingHistory({ sessions, selectedSessionId, onSelectSession }) {
    const [localSessions, setLocalSessions] = useState(sessions || []);

    // Update local sessions when prop changes
    if (sessions && sessions !== localSessions && localSessions.length === 0) {
        setLocalSessions(sessions);
    }

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleTogglePrivacy = async (e, sessionId) => {
        e.stopPropagation();
        const res = await toggleSessionPrivacy(sessionId);
        if (res.success) {
            setLocalSessions(prev => prev.map(s =>
                s._id === sessionId ? { ...s, isPrivate: res.isPrivate } : s
            ));
            toast.success(res.isPrivate ? 'Session marked private' : 'Session marked public');
        } else {
            toast.error('Failed to update privacy');
        }
    };

    return (
        <Card className="h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HiCalendar className="w-5 h-5 text-indigo-500" />
                    Meeting History
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2">
                {localSessions && localSessions.length > 0 ? (
                    <div className="space-y-3">
                        {localSessions.map((session, idx) => (
                            <div
                                key={session._id || idx}
                                onClick={() => onSelectSession(session._id)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedSessionId === session._id
                                        ? 'bg-primary/5 border-primary ring-1 ring-primary'
                                        : 'hover:bg-muted/50'
                                    }`}
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                    <p className="font-medium truncate">{session.roomName || 'Focus Room'}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{formatDate(session.joinedAt)}</span>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                            <HiClock className="w-3 h-3" />
                                            <span>{formatTime(session.duration || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`shrink-0 h-8 w-8 rounded-full ${session.isPrivate ? 'text-amber-500' : 'text-slate-400'}`}
                                    onClick={(e) => handleTogglePrivacy(e, session._id)}
                                    title={session.isPrivate ? "Private Meeting" : "Public Meeting"}
                                >
                                    {session.isPrivate ? <HiLockClosed className="w-4 h-4" /> : <HiGlobeAlt className="w-4 h-4" />}
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No meetings yet</p>
                )}
            </CardContent>
        </Card>
    );
}
