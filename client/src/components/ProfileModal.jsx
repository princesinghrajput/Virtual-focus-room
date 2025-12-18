import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { HiUserCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || ''); // Email usually not editable directly
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateProfile({ name, password, newPassword });
            toast.success('Profile updated successfully');
            onClose();
            setPassword('');
            setNewPassword('');
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HiUserCircle className="w-6 h-6 text-primary" />
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Update your personal information.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={email} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-medium mb-3">Change Password (Optional)</h4>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Required to set new password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileModal;
