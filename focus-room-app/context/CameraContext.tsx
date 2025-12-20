import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";

export type CameraType = "front" | "back";

type CameraContextType = {
    hasPermission: boolean | null;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isCameraReady: boolean;
    cameraError: string | null;
    cameraType: CameraType;
    requestPermissions: () => Promise<boolean>;
    toggleAudio: () => void;
    toggleVideo: () => void;
    switchCamera: () => void;
    setCameraReady: (ready: boolean) => void;
    setCameraError: (error: string | null) => void;
};

const CameraContext = createContext<CameraContextType | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraType, setCameraType] = useState<CameraType>("front");

    // Determine permission status - null means not checked yet
    const hasPermission: boolean | null =
        cameraPermission === null || microphonePermission === null
            ? null
            : (cameraPermission?.granted && microphonePermission?.granted) ?? false;

    // Request camera and microphone permissions
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        try {
            setCameraError(null);

            const cameraResult = await requestCameraPermission();
            const micResult = await requestMicrophonePermission();

            if (!cameraResult.granted) {
                setCameraError("Camera permission denied");
                return false;
            }

            if (!micResult.granted) {
                setCameraError("Microphone permission denied");
                return false;
            }

            return true;
        } catch (error: any) {
            console.error("Error requesting permissions:", error);
            setCameraError(error.message || "Failed to request permissions");
            return false;
        }
    }, [requestCameraPermission, requestMicrophonePermission]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        setIsAudioEnabled((prev) => !prev);
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        setIsVideoEnabled((prev) => !prev);
    }, []);

    // Switch camera (front/back)
    const switchCamera = useCallback(() => {
        setCameraType((prev) => (prev === "front" ? "back" : "front"));
    }, []);

    // Set camera ready state
    const setCameraReadyState = useCallback((ready: boolean) => {
        setIsCameraReady(ready);
    }, []);

    // Set camera error
    const setCameraErrorState = useCallback((error: string | null) => {
        setCameraError(error);
    }, []);

    return (
        <CameraContext.Provider
            value={{
                hasPermission,
                isAudioEnabled,
                isVideoEnabled,
                isCameraReady,
                cameraError,
                cameraType,
                requestPermissions,
                toggleAudio,
                toggleVideo,
                switchCamera,
                setCameraReady: setCameraReadyState,
                setCameraError: setCameraErrorState,
            }}
        >
            {children}
        </CameraContext.Provider>
    );
}

export function useCamera() {
    const context = useContext(CameraContext);
    if (!context) {
        throw new Error("useCamera must be used within a CameraProvider");
    }
    return context;
}

export { CameraView };
export default CameraContext;
