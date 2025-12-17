import { useState } from 'react';

export default function RequestModal({ request, onAccept, onDecline, onClose }) {
    const [isResponding, setIsResponding] = useState(false);

    const handleAccept = () => {
        setIsResponding(true);
        onAccept();
    };

    const handleDecline = () => {
        setIsResponding(true);
        onDecline();
    };

    if (!request) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card p-6 max-w-md w-full animate-fade-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 btn btn-icon btn-secondary w-8 h-8"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full gradient-accent mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold mb-2">Connection Request</h3>
                    <p className="text-[var(--text-secondary)] mb-4">
                        <span className="font-semibold text-white">{request.username}</span> wants to connect with you
                    </p>

                    {request.message && (
                        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 mb-6 text-left">
                            <p className="text-sm text-[var(--text-secondary)]">{request.message}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleDecline}
                            className="btn btn-secondary flex-1"
                            disabled={isResponding}
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            className="btn btn-primary flex-1"
                            disabled={isResponding}
                        >
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
