import { useRef, useEffect, useState, useMemo } from 'react';
import { HiMicrophone, HiVideoCamera, HiBellAlert, HiComputerDesktop, HiEye, HiStar } from 'react-icons/hi2';
import { TbPinFilled, TbPin } from 'react-icons/tb';
import { Button } from '@/components/ui/button';

export default function VideoPlayer({
    videoRef,
    stream,
    username,
    isLocal = false,
    isAudioOn = true,
    isVideoOn = true,
    isScreenSharing = false,
    isPinged = false,
    onPing,
    isGuest = false,
    userTier,
    size = 'medium',
    totalParticipants = 1,
    isPinned = false,
    onPin
}) {
    const internalVideoRef = useRef(null);
    const actualRef = videoRef || internalVideoRef;
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        const videoElement = actualRef.current;
        if (videoElement && stream) {
            videoElement.srcObject = stream;
            videoElement.play().catch(() => { });
        }
    }, [stream, actualRef, isVideoOn, isScreenSharing]);

    const hasVideoTrack = stream?.getVideoTracks()?.length > 0;
    const videoTrackEnabled = hasVideoTrack && stream.getVideoTracks()[0]?.enabled;
    const shouldShowVideo = (isVideoOn || isScreenSharing) && hasVideoTrack && videoTrackEnabled;

    const initials = username.slice(0, 2).toUpperCase();
    const isRemoteGuest = !isLocal && userTier === 'guest';
    const isRemotePremium = !isLocal && userTier === 'premium';

    // Responsive sizing classes based on grid size and participant count
    const sizeConfig = useMemo(() => {
        switch (size) {
            case 'extra-large':
                return {
                    avatar: 'w-28 h-28 sm:w-36 sm:h-36 text-4xl sm:text-5xl',
                    badgePadding: 'px-4 py-2',
                    badgeText: 'text-sm',
                    iconSize: 'w-4 h-4',
                    controlsSize: 'w-10 h-10',
                    nameText: 'text-base sm:text-lg',
                    statusIcons: 'w-9 h-9',
                    statusIconInner: 'w-5 h-5'
                };
            case 'large':
                return {
                    avatar: 'w-24 h-24 sm:w-32 sm:h-32 text-3xl sm:text-4xl',
                    badgePadding: 'px-3 py-1.5',
                    badgeText: 'text-xs sm:text-sm',
                    iconSize: 'w-3.5 h-3.5',
                    controlsSize: 'w-9 h-9',
                    nameText: 'text-sm sm:text-base',
                    statusIcons: 'w-8 h-8',
                    statusIconInner: 'w-4 h-4'
                };
            case 'medium-large':
                return {
                    avatar: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl',
                    badgePadding: 'px-2.5 py-1',
                    badgeText: 'text-[11px] sm:text-xs',
                    iconSize: 'w-3 h-3',
                    controlsSize: 'w-7 h-7 sm:w-8 sm:h-8',
                    nameText: 'text-sm',
                    statusIcons: 'w-7 h-7',
                    statusIconInner: 'w-3.5 h-3.5'
                };
            case 'medium':
                return {
                    avatar: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl',
                    badgePadding: 'px-2 py-0.5 sm:px-2.5 sm:py-1',
                    badgeText: 'text-[10px] sm:text-xs',
                    iconSize: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
                    controlsSize: 'w-6 h-6 sm:w-7 sm:h-7',
                    nameText: 'text-xs sm:text-sm',
                    statusIcons: 'w-6 h-6 sm:w-7 sm:h-7',
                    statusIconInner: 'w-3 h-3 sm:w-3.5 sm:h-3.5'
                };
            case 'small':
                return {
                    avatar: 'w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl',
                    badgePadding: 'px-1.5 py-0.5',
                    badgeText: 'text-[9px] sm:text-[10px]',
                    iconSize: 'w-2 h-2 sm:w-2.5 sm:h-2.5',
                    controlsSize: 'w-5 h-5 sm:w-6 sm:h-6',
                    nameText: 'text-[10px] sm:text-xs',
                    statusIcons: 'w-5 h-5 sm:w-6 sm:h-6',
                    statusIconInner: 'w-2.5 h-2.5 sm:w-3 sm:h-3'
                };
            case 'compact':
                return {
                    avatar: 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg',
                    badgePadding: 'px-1 py-0.5',
                    badgeText: 'text-[8px] sm:text-[9px]',
                    iconSize: 'w-2 h-2',
                    controlsSize: 'w-5 h-5',
                    nameText: 'text-[9px] sm:text-[10px]',
                    statusIcons: 'w-4 h-4 sm:w-5 sm:h-5',
                    statusIconInner: 'w-2 h-2 sm:w-2.5 sm:h-2.5'
                };
            default:
                return {
                    avatar: 'w-20 h-20 text-2xl',
                    badgePadding: 'px-3 py-1.5',
                    badgeText: 'text-xs',
                    iconSize: 'w-3 h-3',
                    controlsSize: 'w-8 h-8',
                    nameText: 'text-sm',
                    statusIcons: 'w-7 h-7',
                    statusIconInner: 'w-3.5 h-3.5'
                };
        }
    }, [size]);

    // Should show simplified UI for small/compact sizes
    const isCompactMode = size === 'small' || size === 'compact';

    return (
        <div
            className={`
                relative rounded-xl sm:rounded-2xl overflow-hidden 
                bg-card border border-border shadow-lg 
                group transition-all duration-300 ease-out
                ${isPinned ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                ${isPinged ? 'ring-4 ring-amber-500 ring-offset-2 ring-offset-background animate-pulse' : ''}
                aspect-video
            `}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            <video
                ref={actualRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`
                    w-full h-full object-cover 
                    ${isScreenSharing ? '' : 'scale-x-[-1]'} 
                    ${shouldShowVideo ? 'block' : 'hidden'}
                    transition-opacity duration-300
                `}
            />

            {/* Avatar placeholder when video is off */}
            {!shouldShowVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <div className={`
                        ${sizeConfig.avatar} rounded-full flex items-center justify-center font-bold text-white shadow-2xl
                        transition-all duration-300
                        ${isGuest || isRemoteGuest
                            ? 'bg-gradient-to-br from-slate-500 to-slate-600'
                            : isRemotePremium
                                ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        }
                    `}>
                        {initials}
                    </div>
                </div>
            )}

            {/* Local user badge */}
            {isLocal && (
                <div className={`
                    absolute top-2 left-2 sm:top-3 sm:left-3 
                    ${sizeConfig.badgePadding} rounded-full ${sizeConfig.badgeText} 
                    font-semibold shadow-lg flex items-center gap-1 sm:gap-1.5
                    transition-all duration-200
                    ${isScreenSharing
                        ? 'bg-amber-500 text-white'
                        : isGuest
                            ? 'bg-slate-600 text-white'
                            : 'bg-primary text-primary-foreground'
                    }
                `}>
                    {isScreenSharing && <HiComputerDesktop className={sizeConfig.iconSize} />}
                    {isGuest && !isScreenSharing && <HiEye className={sizeConfig.iconSize} />}
                    <span className={isCompactMode ? 'hidden sm:inline' : ''}>
                        {isScreenSharing ? 'Screen' : isGuest ? 'Viewing' : 'You'}
                    </span>
                </div>
            )}

            {/* Remote user tier badge */}
            {!isLocal && (isRemoteGuest || isRemotePremium) && (
                <div className={`
                    absolute top-2 left-2 sm:top-3 sm:left-3 
                    ${sizeConfig.badgePadding} rounded-full ${sizeConfig.badgeText} 
                    font-semibold shadow-lg flex items-center gap-1
                    ${isRemotePremium
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'bg-slate-600 text-white'
                    }
                `}>
                    {isRemotePremium ? (
                        <>
                            <HiStar className={sizeConfig.iconSize} />
                            <span className={isCompactMode ? 'hidden sm:inline' : ''}>Premium</span>
                        </>
                    ) : (
                        <>
                            <HiEye className={sizeConfig.iconSize} />
                            <span className={isCompactMode ? 'hidden sm:inline' : ''}>Guest</span>
                        </>
                    )}
                </div>
            )}

            {/* Pin and Ping buttons */}
            <div className={`
                absolute top-2 right-2 sm:top-3 sm:right-3 
                flex items-center gap-1.5
                transition-opacity duration-200 
                ${showControls || isPinned ? 'opacity-100' : 'opacity-0'}
            `}>
                {/* Pin button - available for all users */}
                {onPin && (
                    <Button
                        size="icon"
                        variant={isPinned ? "default" : "secondary"}
                        onClick={onPin}
                        className={`
                            ${sizeConfig.controlsSize} rounded-full 
                            ${isPinned
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground'
                            }
                        `}
                        title={isPinned ? 'Unpin' : 'Pin video'}
                    >
                        {isPinned ? <TbPinFilled className={sizeConfig.statusIconInner} /> : <TbPin className={sizeConfig.statusIconInner} />}
                    </Button>
                )}
                {/* Ping button for remote users */}
                {!isLocal && onPing && !isRemoteGuest && (
                    <Button
                        size="icon"
                        variant="secondary"
                        onClick={onPing}
                        className={`
                            ${sizeConfig.controlsSize} rounded-full 
                            bg-background/80 backdrop-blur-sm 
                            hover:bg-amber-500 hover:text-white
                        `}
                        title="Ping user"
                    >
                        <HiBellAlert className={sizeConfig.statusIconInner} />
                    </Button>
                )}
            </div>

            {/* Bottom info bar */}
            <div className={`
                absolute bottom-0 left-0 right-0 
                p-2 sm:p-3 
                bg-gradient-to-t from-black/70 to-transparent
            `}>
                <div className="flex items-center justify-between">
                    <span className={`
                        ${sizeConfig.nameText} font-medium text-white 
                        truncate max-w-[60%] sm:max-w-[150px]
                    `}>
                        {username}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        {(isGuest || isRemoteGuest) ? (
                            <div className={`
                                ${sizeConfig.badgePadding} rounded-full 
                                bg-white/20 ${sizeConfig.badgeText} text-white 
                                font-medium flex items-center gap-1
                            `}>
                                <HiEye className={sizeConfig.statusIconInner} />
                                <span className="hidden sm:inline">View Only</span>
                            </div>
                        ) : (
                            <>
                                <div className={`
                                    ${sizeConfig.statusIcons} rounded-full 
                                    flex items-center justify-center transition-colors
                                    ${isAudioOn ? 'bg-white/20' : 'bg-red-500'}
                                `}>
                                    <HiMicrophone className={`${sizeConfig.statusIconInner} text-white`} />
                                </div>
                                <div className={`
                                    ${sizeConfig.statusIcons} rounded-full 
                                    flex items-center justify-center transition-colors
                                    ${isVideoOn ? 'bg-white/20' : 'bg-red-500'}
                                `}>
                                    <HiVideoCamera className={`${sizeConfig.statusIconInner} text-white`} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
