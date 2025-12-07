import { useMemo } from 'react';
import VideoPlayer from './VideoPlayer';

export default function VideoGrid({
    localStream,
    localVideoRef,
    isLocalAudioOn,
    isLocalVideoOn,
    isScreenSharing,
    username,
    participants,
    remoteStreams,
    pingTarget,
    onPingUser,
    isGuest = false,
    pinnedUser = null,
    onPinUser,
    localSocketId
}) {
    const participantList = Object.values(participants);
    const totalParticipants = participantList.length + 1;

    // Calculate dynamic sizing for video players based on screen and participant count
    const getVideoSize = (isPinned = false) => {
        if (isPinned) return 'extra-large';
        if (pinnedUser) return 'compact';
        if (totalParticipants === 1) return 'extra-large';
        if (totalParticipants === 2) return 'large';
        if (totalParticipants <= 4) return 'medium-large';
        if (totalParticipants <= 6) return 'medium';
        if (totalParticipants <= 9) return 'small';
        return 'compact';
    };

    // If someone is pinned, show special layout
    if (pinnedUser) {
        const isLocalPinned = pinnedUser.isLocal;
        const pinnedParticipant = isLocalPinned ? null : participantList.find(p => p.socketId === pinnedUser.socketId);

        const unpinnedParticipants = isLocalPinned
            ? participantList
            : participantList.filter(p => p.socketId !== pinnedUser.socketId);

        return (
            <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-7xl mx-auto px-1 sm:px-2">
                {/* Pinned Video - Large at top */}
                <div className="w-full max-w-4xl mx-auto">
                    {isLocalPinned ? (
                        <VideoPlayer
                            videoRef={localVideoRef}
                            stream={localStream}
                            username={username}
                            isLocal={true}
                            isAudioOn={isLocalAudioOn}
                            isVideoOn={isLocalVideoOn || isScreenSharing}
                            isScreenSharing={isScreenSharing}
                            isGuest={isGuest}
                            size="extra-large"
                            totalParticipants={totalParticipants}
                            isPinned={true}
                            onPin={() => onPinUser(localSocketId, username, true)}
                        />
                    ) : pinnedParticipant && (
                        <VideoPlayer
                            key={pinnedParticipant.socketId}
                            stream={remoteStreams[pinnedParticipant.socketId]}
                            username={pinnedParticipant.username || 'Anonymous'}
                            isLocal={false}
                            isAudioOn={pinnedParticipant.isAudioOn}
                            isVideoOn={pinnedParticipant.isVideoOn}
                            isPinged={pingTarget?.socketId === pinnedParticipant.socketId}
                            onPing={() => onPingUser(pinnedParticipant.socketId)}
                            userTier={pinnedParticipant.userTier}
                            size="extra-large"
                            totalParticipants={totalParticipants}
                            isPinned={true}
                            onPin={() => onPinUser(pinnedParticipant.socketId, pinnedParticipant.username)}
                        />
                    )}
                </div>

                {/* Unpinned Videos - Horizontal scrollable strip at bottom */}
                {(unpinnedParticipants.length > 0 || !isLocalPinned) && (
                    <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        {!isLocalPinned && (
                            <div className="shrink-0 w-32 xs:w-36 sm:w-44 md:w-56 aspect-video">
                                <VideoPlayer
                                    videoRef={localVideoRef}
                                    stream={localStream}
                                    username={username}
                                    isLocal={true}
                                    isAudioOn={isLocalAudioOn}
                                    isVideoOn={isLocalVideoOn || isScreenSharing}
                                    isScreenSharing={isScreenSharing}
                                    isGuest={isGuest}
                                    size="compact"
                                    totalParticipants={totalParticipants}
                                    isPinned={false}
                                    onPin={() => onPinUser(localSocketId, username, true)}
                                />
                            </div>
                        )}
                        {unpinnedParticipants.map((participant) => (
                            <div key={participant.socketId} className="shrink-0 w-32 xs:w-36 sm:w-44 md:w-56 aspect-video">
                                <VideoPlayer
                                    stream={remoteStreams[participant.socketId]}
                                    username={participant.username || 'Anonymous'}
                                    isLocal={false}
                                    isAudioOn={participant.isAudioOn}
                                    isVideoOn={participant.isVideoOn}
                                    isPinged={pingTarget?.socketId === participant.socketId}
                                    onPing={() => onPingUser(participant.socketId)}
                                    userTier={participant.userTier}
                                    size="compact"
                                    totalParticipants={totalParticipants}
                                    isPinned={false}
                                    onPin={() => onPinUser(participant.socketId, participant.username)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Special layout for 3 participants 
    // Mobile: vertical scroll, Tablet+: 2 on top, 1 centered bottom
    if (totalParticipants === 3) {
        return (
            <div className="flex flex-col gap-2 sm:gap-3 max-w-5xl w-full mx-auto px-1 sm:px-2">
                {/* Mobile: All 3 in vertical list | Desktop: 2+1 grid */}

                {/* On mobile (< 640px): Show all 3 videos in a single column */}
                <div className="flex flex-col gap-2 sm:hidden">
                    <VideoPlayer
                        videoRef={localVideoRef}
                        stream={localStream}
                        username={username}
                        isLocal={true}
                        isAudioOn={isLocalAudioOn}
                        isVideoOn={isLocalVideoOn || isScreenSharing}
                        isScreenSharing={isScreenSharing}
                        isGuest={isGuest}
                        size="medium"
                        totalParticipants={totalParticipants}
                        onPin={() => onPinUser(localSocketId, username, true)}
                    />
                    {participantList.map((participant) => (
                        <VideoPlayer
                            key={participant.socketId}
                            stream={remoteStreams[participant.socketId]}
                            username={participant.username || 'Anonymous'}
                            isLocal={false}
                            isAudioOn={participant.isAudioOn}
                            isVideoOn={participant.isVideoOn}
                            isPinged={pingTarget?.socketId === participant.socketId}
                            onPing={() => onPingUser(participant.socketId)}
                            userTier={participant.userTier}
                            size="medium"
                            totalParticipants={totalParticipants}
                            onPin={() => onPinUser(participant.socketId, participant.username)}
                        />
                    ))}
                </div>

                {/* On larger screens (>= 640px): 2+1 layout */}
                <div className="hidden sm:flex sm:flex-col gap-2 sm:gap-3">
                    {/* First row - 2 videos */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <VideoPlayer
                            videoRef={localVideoRef}
                            stream={localStream}
                            username={username}
                            isLocal={true}
                            isAudioOn={isLocalAudioOn}
                            isVideoOn={isLocalVideoOn || isScreenSharing}
                            isScreenSharing={isScreenSharing}
                            isGuest={isGuest}
                            size={getVideoSize()}
                            totalParticipants={totalParticipants}
                            onPin={() => onPinUser(localSocketId, username, true)}
                        />
                        {participantList[0] && (
                            <VideoPlayer
                                key={participantList[0].socketId}
                                stream={remoteStreams[participantList[0].socketId]}
                                username={participantList[0].username || 'Anonymous'}
                                isLocal={false}
                                isAudioOn={participantList[0].isAudioOn}
                                isVideoOn={participantList[0].isVideoOn}
                                isPinged={pingTarget?.socketId === participantList[0].socketId}
                                onPing={() => onPingUser(participantList[0].socketId)}
                                userTier={participantList[0].userTier}
                                size={getVideoSize()}
                                totalParticipants={totalParticipants}
                                onPin={() => onPinUser(participantList[0].socketId, participantList[0].username)}
                            />
                        )}
                    </div>
                    {/* Second row - 1 centered video */}
                    <div className="flex justify-center">
                        <div className="w-1/2 min-w-[180px] max-w-[400px]">
                            {participantList[1] && (
                                <VideoPlayer
                                    key={participantList[1].socketId}
                                    stream={remoteStreams[participantList[1].socketId]}
                                    username={participantList[1].username || 'Anonymous'}
                                    isLocal={false}
                                    isAudioOn={participantList[1].isAudioOn}
                                    isVideoOn={participantList[1].isVideoOn}
                                    isPinged={pingTarget?.socketId === participantList[1].socketId}
                                    onPing={() => onPingUser(participantList[1].socketId)}
                                    userTier={participantList[1].userTier}
                                    size={getVideoSize()}
                                    totalParticipants={totalParticipants}
                                    onPin={() => onPinUser(participantList[1].socketId, participantList[1].username)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic grid layout calculation based on participant count
    const gridConfig = useMemo(() => {
        if (totalParticipants === 1) {
            return {
                className: 'grid-cols-1',
                maxWidth: 'max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl',
                gap: 'gap-2 sm:gap-4',
                containerClass: 'min-h-[50vh] sm:min-h-[60vh] md:h-[70vh] md:max-h-[600px]'
            };
        }
        if (totalParticipants === 2) {
            return {
                className: 'grid-cols-1 sm:grid-cols-2',
                maxWidth: 'max-w-md sm:max-w-4xl md:max-w-5xl lg:max-w-6xl',
                gap: 'gap-2 sm:gap-3 md:gap-4',
                containerClass: 'min-h-[40vh] sm:min-h-[50vh] md:h-[60vh] md:max-h-[500px]'
            };
        }
        if (totalParticipants === 4) {
            return {
                className: 'grid-cols-2',
                maxWidth: 'max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl',
                gap: 'gap-1.5 sm:gap-2 md:gap-3',
                containerClass: 'h-auto'
            };
        }
        if (totalParticipants <= 6) {
            return {
                className: 'grid-cols-2 md:grid-cols-3',
                maxWidth: 'max-w-sm sm:max-w-3xl md:max-w-4xl lg:max-w-5xl',
                gap: 'gap-1.5 sm:gap-2',
                containerClass: 'h-auto'
            };
        }
        if (totalParticipants <= 9) {
            return {
                className: 'grid-cols-2 sm:grid-cols-3',
                maxWidth: 'max-w-sm sm:max-w-3xl md:max-w-4xl lg:max-w-5xl',
                gap: 'gap-1 sm:gap-1.5 md:gap-2',
                containerClass: 'h-auto'
            };
        }
        if (totalParticipants <= 12) {
            return {
                className: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                maxWidth: 'max-w-sm sm:max-w-4xl md:max-w-5xl lg:max-w-6xl',
                gap: 'gap-1 sm:gap-1.5',
                containerClass: 'h-auto'
            };
        }
        return {
            className: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
            maxWidth: 'max-w-full',
            gap: 'gap-1',
            containerClass: 'h-auto'
        };
    }, [totalParticipants]);

    return (
        <div
            className={`
                grid ${gridConfig.className} ${gridConfig.gap} 
                ${gridConfig.maxWidth} w-full mx-auto
                ${gridConfig.containerClass}
                transition-all duration-300 ease-out
                px-1 sm:px-2
            `}
        >
            <VideoPlayer
                videoRef={localVideoRef}
                stream={localStream}
                username={username}
                isLocal={true}
                isAudioOn={isLocalAudioOn}
                isVideoOn={isLocalVideoOn || isScreenSharing}
                isScreenSharing={isScreenSharing}
                isGuest={isGuest}
                size={getVideoSize()}
                totalParticipants={totalParticipants}
                onPin={() => onPinUser(localSocketId, username, true)}
            />
            {participantList.map((participant) => (
                <VideoPlayer
                    key={participant.socketId}
                    stream={remoteStreams[participant.socketId]}
                    username={participant.username || 'Anonymous'}
                    isLocal={false}
                    isAudioOn={participant.isAudioOn}
                    isVideoOn={participant.isVideoOn}
                    isPinged={pingTarget?.socketId === participant.socketId}
                    onPing={() => onPingUser(participant.socketId)}
                    userTier={participant.userTier}
                    size={getVideoSize()}
                    totalParticipants={totalParticipants}
                    onPin={() => onPinUser(participant.socketId, participant.username)}
                />
            ))}
        </div>
    );
}
