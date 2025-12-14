import { useState, useCallback, useRef } from 'react';

export function useMediaStream() {
    const [stream, setStream] = useState(null);
    const [isAudioOn, setIsAudioOn] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [error, setError] = useState(null);

    const screenStreamRef = useRef(null);
    const wasVideoOnBeforeScreenShare = useRef(true);

    const startStream = useCallback(async () => {
        try {
            console.log('[useMediaStream] Requesting media stream...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                audio: { echoCancellation: true, noiseSuppression: true }
            });

            // Default: audio off
            mediaStream.getAudioTracks().forEach(track => { track.enabled = false; });

            setStream(mediaStream);
            setIsAudioOn(false);
            setIsVideoOn(true);
            setError(null);
            console.log('[useMediaStream] Stream started successfully');
            return mediaStream;
        } catch (err) {
            console.error('[useMediaStream] Error getting media:', err);
            setError(err.message);
            return null;
        }
    }, []);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
    }, [stream]);

    const toggleAudio = useCallback(() => {
        if (stream) {
            const audioTracks = stream.getAudioTracks();
            audioTracks.forEach(track => { track.enabled = !track.enabled; });
            const newState = audioTracks[0]?.enabled ?? false;
            setIsAudioOn(newState);
            return newState;
        }
        return false;
    }, [stream]);

    const toggleVideo = useCallback(() => {
        if (stream && !isScreenSharing) {
            const videoTracks = stream.getVideoTracks();
            videoTracks.forEach(track => { track.enabled = !track.enabled; });
            const newState = videoTracks[0]?.enabled ?? false;
            setIsVideoOn(newState);
            return newState;
        }
        return isVideoOn;
    }, [stream, isVideoOn, isScreenSharing]);

    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            // Stop screen sharing
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }

            // Restore camera - get a fresh camera stream
            if (stream) {
                const currentVideoTrack = stream.getVideoTracks()[0];
                if (currentVideoTrack) {
                    stream.removeTrack(currentVideoTrack);
                    currentVideoTrack.stop();
                }

                try {
                    const newCameraStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
                    });
                    const newVideoTrack = newCameraStream.getVideoTracks()[0];
                    if (newVideoTrack) {
                        // Restore the video state that was before screen share
                        newVideoTrack.enabled = wasVideoOnBeforeScreenShare.current;
                        stream.addTrack(newVideoTrack);
                        setIsVideoOn(wasVideoOnBeforeScreenShare.current);
                    }
                } catch (err) {
                    console.error('[useMediaStream] Failed to restore camera:', err);
                }
            }

            setIsScreenSharing(false);
            return false;
        } else {
            // Start screen sharing
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });

                screenStreamRef.current = displayStream;
                const screenTrack = displayStream.getVideoTracks()[0];

                // Save current video state before replacing
                wasVideoOnBeforeScreenShare.current = isVideoOn;

                // Replace video track with screen track
                if (stream) {
                    const currentVideoTrack = stream.getVideoTracks()[0];
                    if (currentVideoTrack) {
                        stream.removeTrack(currentVideoTrack);
                        currentVideoTrack.stop();
                    }
                    stream.addTrack(screenTrack);
                }

                // Handle user stopping via browser UI
                screenTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
                return true;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('[useMediaStream] Screen share error:', err);
                    setError(err.message);
                }
                return false;
            }
        }
    }, [stream, isScreenSharing, isVideoOn]);

    return {
        stream,
        isAudioOn,
        isVideoOn,
        isScreenSharing,
        error,
        startStream,
        stopStream,
        toggleAudio,
        toggleVideo,
        toggleScreenShare
    };
}
