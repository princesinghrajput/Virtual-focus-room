/**
 * Premium Features Configuration
 * Central place to define premium features and pricing
 */

export const PRICING = {
    premium: {
        name: 'Premium',
        price: 499,
        currency: '₹',
        period: 'one-time',
        features: [
            'Create unlimited private rooms',
            'Password-protected meetings',
            'Share files & attachments in chat',
            'Priority support',
            'Early access to new features',
            'Custom room themes (coming soon)'
        ]
    }
};

export const FEATURE_COMPARISON = [
    { name: 'Join public rooms', guest: true, free: true, premium: true },
    { name: 'Video & Camera', guest: false, free: true, premium: true },
    { name: 'Microphone & Audio', guest: false, free: true, premium: true },
    { name: 'Chat messages', guest: false, free: true, premium: true },
    { name: 'Screen sharing', guest: false, free: true, premium: true },
    { name: 'Send attachments', guest: false, free: true, premium: true },
    { name: 'Ping other users', guest: false, free: true, premium: true },
    { name: 'Create public rooms', guest: true, free: true, premium: true },
    { name: 'Create private rooms', guest: false, free: false, premium: true },
    { name: 'Password-protected rooms', guest: false, free: false, premium: true },
    { name: 'Priority support', guest: false, free: false, premium: true },
];

export const USER_TIER_LABELS = {
    guest: { label: 'Guest', description: 'View-only access' },
    free: { label: 'Free', description: 'Full room features' },
    premium: { label: 'Premium', description: 'All features + private rooms' }
};
