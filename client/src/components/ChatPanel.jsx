import { useState, useRef, useEffect } from 'react';
import { HiXMark, HiPaperAirplane, HiPaperClip, HiPhoto, HiDocument, HiLockClosed } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function ChatPanel({ messages, currentSocketId, onSendMessage, onClose }) {
    const { isGuest, permissions, isLoggedIn } = useAuth();
    const [message, setMessage] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check permissions
        if (!permissions.canChat) {
            toast.error('Guests cannot send messages. Please sign up!');
            return;
        }

        if (!message.trim() && attachments.length === 0) return;

        // Convert attachments to base64 for socket transmission
        const processedAttachments = await Promise.all(
            attachments.map(async (att) => {
                let base64Data = null;
                if (att.file) {
                    try {
                        base64Data = await fileToBase64(att.file);
                    } catch (err) {
                        console.error('Failed to convert file:', err);
                    }
                }
                return {
                    name: att.name,
                    type: att.type,
                    size: att.size,
                    isImage: att.isImage,
                    url: base64Data || att.preview // Use base64 data for transmission
                };
            })
        );

        onSendMessage(message.trim(), processedAttachments);
        setMessage('');
        setAttachments([]);
        setShowAttachMenu(false);
    };

    const handleFileSelect = (e) => {
        if (!permissions.canSendAttachments) {
            toast.error('Please sign up to send attachments');
            return;
        }

        const files = Array.from(e.target.files);
        const maxSize = 5 * 1024 * 1024; // 5MB limit

        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`${file.name} is too large (max 5MB)`);
                return false;
            }
            return true;
        });

        const newAttachments = validFiles.map(file => {
            const isImage = file.type.startsWith('image/');
            return {
                id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                file,
                name: file.name,
                type: file.type,
                size: file.size,
                isImage,
                preview: isImage ? URL.createObjectURL(file) : null
            };
        });

        setAttachments(prev => [...prev, ...newAttachments].slice(0, 5)); // Max 5 attachments
        setShowAttachMenu(false);
    };

    const removeAttachment = (id) => {
        setAttachments(prev => {
            const removed = prev.find(a => a.id === id);
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            return prev.filter(a => a.id !== id);
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const renderAttachment = (att, isOwn = false) => {
        // Check if it's an image - use url (base64) or preview (local blob)
        const imageUrl = att.url || att.preview;
        const isImageType = att.isImage || att.type?.startsWith('image/');

        if (isImageType && imageUrl) {
            return (
                <div className="mt-2 rounded-lg overflow-hidden max-w-[150px] sm:max-w-[200px] bg-muted/50">
                    <img
                        src={imageUrl}
                        alt={att.name}
                        className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(imageUrl, '_blank')}
                        onError={(e) => {
                            // Replace with filename if image fails
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                        }}
                    />
                    <div className="hidden items-center gap-2 p-2 text-xs text-muted-foreground">
                        <span>📷</span>
                        <span className="truncate">{att.name}</span>
                    </div>
                </div>
            );
        }

        return (
            <div className={`mt-2 flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-primary-foreground/10' : 'bg-muted'}`}>
                <HiDocument className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{att.name}</p>
                    <p className="text-[10px] opacity-70">{formatFileSize(att.size)}</p>
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full sm:w-80 h-full border-l rounded-none flex flex-col animate-in slide-in-from-right-5 duration-300 bg-card">
            <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-4 px-4 border-b shrink-0">
                <CardTitle className="text-base font-semibold">Chat</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                    <HiXMark className="w-5 h-5" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 p-3 overflow-y-auto space-y-3">
                {/* Guest Warning */}
                {isGuest && (
                    <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
                        <HiLockClosed className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">View Only Mode</p>
                            <p className="opacity-80 text-[11px]">Sign up to send messages.</p>
                        </div>
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.socketId === currentSocketId;
                        return (
                            <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] sm:max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
                                    {!isOwn && (
                                        <p className="text-xs text-muted-foreground mb-1 ml-1 truncate">{msg.username}</p>
                                    )}
                                    <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl ${isOwn
                                        ? 'bg-primary text-primary-foreground rounded-br-md'
                                        : 'bg-muted rounded-bl-md'
                                        }`}>
                                        {msg.message && (
                                            <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                                        )}
                                        {/* Render attachments */}
                                        {msg.attachments?.map((att, i) => (
                                            <div key={i}>
                                                {renderAttachment(att, isOwn)}
                                            </div>
                                        ))}
                                    </div>
                                    <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            {/* Attachment Preview */}
            {attachments.length > 0 && (
                <div className="px-3 py-2 border-t bg-muted/30">
                    <div className="flex flex-wrap gap-2">
                        {attachments.map(att => (
                            <div
                                key={att.id}
                                className="relative group"
                            >
                                {att.isImage ? (
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border">
                                        <img src={att.preview} alt={att.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border flex flex-col items-center justify-center bg-muted p-1">
                                        <HiDocument className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                        <p className="text-[7px] sm:text-[8px] text-center truncate w-full mt-1">{att.name}</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                                >
                                    <HiXMark className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-2 sm:p-3 border-t shrink-0">
                <div className="flex gap-1.5 sm:gap-2 items-end">
                    {/* Attachment Button */}
                    <div className="relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                            onClick={() => {
                                if (!permissions.canSendAttachments) {
                                    toast.error('Please sign up to send attachments');
                                    return;
                                }
                                setShowAttachMenu(!showAttachMenu);
                            }}
                            disabled={!permissions.canChat}
                        >
                            <HiPaperClip className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>

                        {/* Attachment Menu */}
                        {showAttachMenu && (
                            <div className="absolute bottom-12 left-0 w-36 sm:w-40 p-2 rounded-xl bg-popover border shadow-lg animate-in slide-in-from-bottom-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        fileInputRef.current.accept = 'image/*';
                                        fileInputRef.current.click();
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
                                >
                                    <HiPhoto className="w-4 h-4 text-primary" />
                                    Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        fileInputRef.current.accept = '.pdf,.doc,.docx,.txt';
                                        fileInputRef.current.click();
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
                                >
                                    <HiDocument className="w-4 h-4 text-amber-500" />
                                    Document
                                </button>
                            </div>
                        )}
                    </div>

                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={permissions.canChat ? "Type a message..." : "Sign up to chat"}
                        className="flex-1 h-9 sm:h-10 text-sm"
                        maxLength={500}
                        disabled={!permissions.canChat}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        disabled={(!message.trim() && attachments.length === 0) || !permissions.canChat}
                    >
                        <HiPaperAirplane className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </Card>
    );
}
