import { HiMicrophone, HiVideoCamera, HiArrowRightOnRectangle } from 'react-icons/hi2';

export default function MediaControls({
    isAudioOn,
    isVideoOn,
    onToggleAudio,
    onToggleVideo,
    onLeave
}) {
    return (
        <div className="glass px-6 py-4">
            <div className="flex items-center justify-center gap-4">
                {/* Microphone Toggle */}
                <button
                    className={`btn btn-icon btn-icon-lg transition-all ${isAudioOn
                            ? 'btn-secondary hover:bg-[var(--accent-danger)]/20'
                            : 'btn-danger'
                        }`}
                    onClick={onToggleAudio}
                    title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                    <div className="relative">
                        <HiMicrophone className="w-6 h-6" />
                        {!isAudioOn && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-0.5 bg-white rotate-45"></div>
                            </div>
                        )}
                    </div>
                </button>

                {/* Camera Toggle */}
                <button
                    className={`btn btn-icon btn-icon-lg transition-all ${isVideoOn
                            ? 'btn-secondary hover:bg-[var(--accent-danger)]/20'
                            : 'btn-danger'
                        }`}
                    onClick={onToggleVideo}
                    title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                >
                    <div className="relative">
                        <HiVideoCamera className="w-6 h-6" />
                        {!isVideoOn && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-0.5 bg-white rotate-45"></div>
                            </div>
                        )}
                    </div>
                </button>

                {/* Leave Room */}
                <button
                    className="btn btn-danger btn-icon-lg px-6 gap-2"
                    onClick={onLeave}
                    title="Leave room"
                >
                    <HiArrowRightOnRectangle className="w-6 h-6" />
                    <span className="font-medium">Leave</span>
                </button>
            </div>
        </div>
    );
}
