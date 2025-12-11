import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HiChatBubbleLeftRight, HiPhoto } from 'react-icons/hi2';
import { getMessages } from '@/services/messageService';

export default function ChatHistory({ initialMessages, sessionId }) {
    const [messages, setMessages] = useState(initialMessages || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionId) {
            fetchSessionMessages();
        } else {
            setMessages(initialMessages || []);
        }
    }, [sessionId, initialMessages]);

    const fetchSessionMessages = async () => {
        setLoading(true);
        const res = await getMessages(null, 100, sessionId);
        if (res.success) {
            setMessages(res.messages);
        }
        setLoading(false);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <Card className="h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HiChatBubbleLeftRight className="w-5 h-5 text-green-500" />
                    {sessionId ? 'Session Chat' : 'Recent Chat History'}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : messages && messages.length > 0 ? (
                    <div className="space-y-3">
                        {messages.map((msg, idx) => (
                            <div
                                key={msg._id || idx}
                                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-sm">{msg.userId?.name || 'You'}</p>
                                            <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                                        </div>
                                        <p className="text-sm break-words">{msg.content}</p>
                                        {msg.mediaUrl && (
                                            <div className="mt-2">
                                                {msg.mediaType === 'image' ? (
                                                    <img
                                                        src={msg.mediaUrl}
                                                        alt="Attachment"
                                                        className="max-w-xs rounded-lg border"
                                                    />
                                                ) : (
                                                    <a
                                                        href={msg.mediaUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                                                    >
                                                        <HiPhoto className="w-4 h-4" />
                                                        View attachment
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <HiChatBubbleLeftRight className="w-12 h-12 mb-2 opacity-20" />
                        <p>{sessionId ? 'No messages in this session' : 'Select a meeting to view chat'}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
