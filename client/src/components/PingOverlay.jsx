import { HiBellAlert } from 'react-icons/hi2';

export default function PingOverlay({ username }) {
    return (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="animate-fade-in">
                <div className="relative">
                    {/* Ping rings */}
                    <div className="absolute inset-0 rounded-full gradient-accent opacity-30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full gradient-accent opacity-20 animate-ping" style={{ animationDelay: '0.2s' }}></div>

                    {/* Center content */}
                    <div className="relative glass rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-20 h-20 rounded-full gradient-accent mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <HiBellAlert className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-xl font-bold text-white">{username} pinged you!</p>
                        <p className="text-sm text-[var(--text-muted)] mt-2">Time to refocus 💪</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
