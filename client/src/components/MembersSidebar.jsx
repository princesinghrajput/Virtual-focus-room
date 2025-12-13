import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HiXMark, HiMagnifyingGlass, HiUserPlus, HiCheck, HiChatBubbleLeftRight, HiUsers } from 'react-icons/hi2';
import api from '@/utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const MembersSidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('friends');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friends, setFriends] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDetails = async () => {
        try {
            const res = await api.get('/api/friends/details');
            if (res.data.success) {
                setFriends(res.data.friends);
                setReceivedRequests(res.data.receivedRequests);
                setSentRequests(res.data.sentRequests);
            }
        } catch (error) {
            console.error('Failed to fetch friend details', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDetails();
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            const res = await api.get(`/api/friends/search?q=${searchQuery}`);
            if (res.data.success) {
                setSearchResults(res.data.users);
            }
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (receiverId) => {
        try {
            const res = await api.post('/api/friends/request', { receiverId });
            if (res.data.success) {
                toast.success('Friend request sent');
                fetchDetails();
                // Update search results to show pending status visually if needed
                setSearchResults(prev => prev.filter(u => u._id !== receiverId)); // Remove from search or mark as pending
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        }
    };

    const acceptRequest = async (requestId) => {
        try {
            const res = await api.post('/api/friends/accept', { requestId });
            if (res.data.success) {
                toast.success('Friend added');
                fetchDetails();
            }
        } catch (error) {
            toast.error('Failed to accept request');
        }
    };

    const rejectRequest = async (requestId) => {
        try {
            const res = await api.post('/api/friends/reject', { requestId });
            if (res.data.success) {
                toast.success('Request rejected');
                fetchDetails();
            }
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 h-full w-full sm:w-80 md:w-96 bg-background shadow-2xl z-50 border-l animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <HiUsers className="w-5 h-5 text-primary" /> Members
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <HiXMark className="w-5 h-5" />
                </Button>
            </div>

            <Tabs defaultValue="friends" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
                        <TabsTrigger value="requests">Requests ({receivedRequests.length})</TabsTrigger>
                    </TabsList>
                </div>

                {/* Add Friend Search */}
                <div className="p-4 border-b">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Find users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="h-9"
                        />
                        <Button size="icon" onClick={handleSearch} disabled={loading} className="h-9 w-9">
                            <HiMagnifyingGlass className="w-4 h-4" />
                        </Button>
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/30">
                            {searchResults.map(u => (
                                <div key={u._id} className="flex items-center justify-between p-2 rounded hover:bg-muted bg-background border">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback className="text-[10px]">{u.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm truncate max-w-[120px]">{u.name}</span>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => sendRequest(u._id)} className="h-6 w-6 p-0 rounded-full">
                                        <HiUserPlus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <TabsContent value="friends" className="flex-1 overflow-y-auto p-4 space-y-3 m-0">
                    {friends.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No friends yet.</p>
                            <p className="text-xs">Search above to add people!</p>
                        </div>
                    ) : (
                        friends.map(friend => (
                            <div key={friend._id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{friend.name}</p>
                                        <p className="text-xs text-muted-foreground">Online</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <HiChatBubbleLeftRight className="w-4 h-4" /> Chat
                                </Button>
                            </div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="requests" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
                    {receivedRequests.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Received</h3>
                            <div className="space-y-2">
                                {receivedRequests.map(req => (
                                    <div key={req._id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{req.sender.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{req.sender.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="sm" onClick={() => acceptRequest(req._id)} className="h-7 w-7 p-0 rounded-full bg-green-500 hover:bg-green-600">
                                                <HiCheck className="w-4 h-4 text-white" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => rejectRequest(req._id)} className="h-7 w-7 p-0 rounded-full border-red-200 hover:bg-red-50 hover:text-red-600">
                                                <HiXMark className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {sentRequests.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Sent</h3>
                            <div className="space-y-2">
                                {sentRequests.map(req => (
                                    <div key={req._id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 opacity-70">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{req.receiver.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{req.receiver.name}</span>
                                        </div>
                                        <span className="text-xs bg-muted px-2 py-1 rounded">Pending</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {receivedRequests.length === 0 && sentRequests.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No pending requests.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MembersSidebar;
