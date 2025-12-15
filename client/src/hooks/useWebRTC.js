import { useState, useCallback, useRef, useEffect } from 'react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

export function useWebRTC(socket, localStream) {
    const [remoteStreams, setRemoteStreams] = useState({});
    const peerConnections = useRef({});
    const localStreamRef = useRef(localStream);

    // Keep localStreamRef updated and replace tracks in peer connections when stream changes
    useEffect(() => {
        const previousStream = localStreamRef.current;
        localStreamRef.current = localStream;

        console.log('[WebRTC] Local stream updated:', localStream?.id, 'tracks:', localStream?.getTracks().length);

        // If stream changed and we have peer connections, replace the tracks
        if (localStream && previousStream !== localStream) {
            replaceTracksInAllConnections(localStream);
        }
    }, [localStream]);

    // Replace tracks in all existing peer connections (for screen share)
    const replaceTracksInAllConnections = useCallback((newStream) => {
        if (!newStream) {
            console.warn('[WebRTC] Cannot replace tracks: No stream provided');
            return;
        }

        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];

        console.log(`[WebRTC] Replacing tracks. Video: ${videoTrack?.id}, Audio: ${audioTrack?.id}`);

        Object.entries(peerConnections.current).forEach(([socketId, pc]) => {
            const senders = pc.getSenders();
            console.log(`[WebRTC] Connection ${socketId} has ${senders.length} senders`);

            senders.forEach(sender => {
                const trackKind = sender.track?.kind;
                // If track is null, maybe try to guess based on if we have videoTrack?
                // But sender.track shouldn't be null if it was active.

                if (trackKind === 'video' && videoTrack) {
                    if (sender.track.id === videoTrack.id) {
                        console.log(`[WebRTC] Video track already active for ${socketId}, skipping`);
                        return;
                    }
                    console.log(`[WebRTC] Replacing video track for: ${socketId} (old: ${sender.track?.id} -> new: ${videoTrack.id})`);
                    sender.replaceTrack(videoTrack).catch(err => {
                        console.error('[WebRTC] Error replacing video track:', err);
                    });
                } else if (trackKind === 'audio' && audioTrack) {
                    if (sender.track?.id === audioTrack.id) return;
                    console.log(`[WebRTC] Replacing audio track for: ${socketId}`);
                    sender.replaceTrack(audioTrack).catch(err => {
                        console.error('[WebRTC] Error replacing audio track:', err);
                    });
                }
            });
        });
    }, []);

    // Expose function to manually update tracks (called when screen sharing toggles)
    const updateLocalTracks = useCallback((newStream) => {
        if (!newStream) return;
        localStreamRef.current = newStream;
        replaceTracksInAllConnections(newStream);
    }, [replaceTracksInAllConnections]);

    const createPeerConnection = useCallback((targetSocketId, username, isInitiator = false) => {
        // Close existing connection if any
        if (peerConnections.current[targetSocketId]) {
            console.log('[WebRTC] Closing existing connection to:', targetSocketId);
            peerConnections.current[targetSocketId].close();
        }

        console.log('[WebRTC] Creating peer connection to:', targetSocketId, 'isInitiator:', isInitiator);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks BEFORE creating offer/answer
        const stream = localStreamRef.current;
        if (stream) {
            console.log('[WebRTC] Adding local tracks to peer connection');
            stream.getTracks().forEach(track => {
                console.log('[WebRTC] Adding track:', track.kind, track.label);
                pc.addTrack(track, stream);
            });
        } else {
            console.warn('[WebRTC] No local stream available when creating peer connection');
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                console.log('[WebRTC] Sending ICE candidate to:', targetSocketId);
                socket.emit('webrtc:ice-candidate', {
                    to: targetSocketId,
                    candidate: event.candidate
                });
            }
        };

        // Handle ICE connection state
        pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE connection state:', pc.iceConnectionState, 'for:', targetSocketId);
        };

        // Handle remote stream - THIS IS KEY
        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote track:', event.track.kind, 'from:', targetSocketId);
            const [remoteStream] = event.streams;
            if (remoteStream) {
                console.log('[WebRTC] Setting remote stream:', remoteStream.id, 'tracks:', remoteStream.getTracks().length);
                setRemoteStreams(prev => ({
                    ...prev,
                    [targetSocketId]: remoteStream
                }));
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', pc.connectionState, 'for:', targetSocketId);
            if (pc.connectionState === 'failed') {
                console.error('[WebRTC] Connection failed, closing:', targetSocketId);
                closePeerConnection(targetSocketId);
            }
        };

        pc.onnegotiationneeded = () => {
            console.log('[WebRTC] Negotiation needed for:', targetSocketId);
        };

        peerConnections.current[targetSocketId] = pc;
        return pc;
    }, [socket]);

    const closePeerConnection = useCallback((socketId) => {
        const pc = peerConnections.current[socketId];
        if (pc) {
            console.log('[WebRTC] Closing peer connection:', socketId);
            pc.close();
            delete peerConnections.current[socketId];
        }

        setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[socketId];
            return updated;
        });
    }, []);

    const initiateCall = useCallback(async (targetSocketId, username) => {
        console.log('[WebRTC] Initiating call to:', targetSocketId, username);

        // Ensure we have local stream before calling
        if (!localStreamRef.current) {
            console.warn('[WebRTC] No local stream, waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const pc = createPeerConnection(targetSocketId, username, true);

        try {
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            console.log('[WebRTC] Created offer for:', targetSocketId);
            await pc.setLocalDescription(offer);

            socket.emit('webrtc:offer', {
                to: targetSocketId,
                offer: pc.localDescription
            });
            console.log('[WebRTC] Sent offer to:', targetSocketId);
        } catch (err) {
            console.error('[WebRTC] Error creating offer:', err);
        }
    }, [createPeerConnection, socket]);

    const handleOffer = useCallback(async ({ from, username, offer }) => {
        console.log('[WebRTC] Received offer from:', from, username);

        const pc = createPeerConnection(from, username, false);

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('[WebRTC] Set remote description for:', from);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('webrtc:answer', {
                to: from,
                answer: pc.localDescription
            });
            console.log('[WebRTC] Sent answer to:', from);
        } catch (err) {
            console.error('[WebRTC] Error handling offer:', err);
        }
    }, [createPeerConnection, socket]);

    const handleAnswer = useCallback(async ({ from, answer }) => {
        console.log('[WebRTC] Received answer from:', from);
        const pc = peerConnections.current[from];
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('[WebRTC] Set remote description (answer) for:', from);
            } catch (err) {
                console.error('[WebRTC] Error handling answer:', err);
            }
        } else {
            console.warn('[WebRTC] No peer connection for answer from:', from);
        }
    }, []);

    const handleIceCandidate = useCallback(async ({ from, candidate }) => {
        const pc = peerConnections.current[from];
        if (pc && candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('[WebRTC] Added ICE candidate from:', from);
            } catch (err) {
                console.error('[WebRTC] Error adding ICE candidate:', err);
            }
        }
    }, []);

    const closeAllConnections = useCallback(() => {
        console.log('[WebRTC] Closing all connections');
        Object.keys(peerConnections.current).forEach(closePeerConnection);
    }, [closePeerConnection]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        console.log('[WebRTC] Setting up socket listeners');
        socket.on('webrtc:offer', handleOffer);
        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:ice-candidate', handleIceCandidate);

        return () => {
            socket.off('webrtc:offer', handleOffer);
            socket.off('webrtc:answer', handleAnswer);
            socket.off('webrtc:ice-candidate', handleIceCandidate);
        };
    }, [socket, handleOffer, handleAnswer, handleIceCandidate]);

    return {
        remoteStreams,
        initiateCall,
        closePeerConnection,
        closeAllConnections,
        updateLocalTracks  // Export function to update tracks when screen sharing
    };
}
