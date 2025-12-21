import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { useTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SOUNDS = [
    {
        id: "rain",
        name: "Soft Rain",
        icon: "rainy" as const,
        url: "https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3",
    },
    {
        id: "lofi",
        name: "Lo-Fi Chill",
        icon: "musical-notes" as const,
        url: "https://assets.mixkit.co/active_storage/sfx/2487/2487-preview.mp3",
    },
    {
        id: "cafe",
        name: "Coffee Shop",
        icon: "cafe" as const,
        url: "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3",
    },
    {
        id: "fire",
        name: "Fireplace",
        icon: "flame" as const,
        url: "https://assets.mixkit.co/active_storage/sfx/2392/2392-preview.mp3",
    },
];

type AmbientPlayerProps = {
    visible: boolean;
    onClose: () => void;
};

export default function AmbientPlayer({ visible, onClose }: AmbientPlayerProps) {
    const { theme, isDark } = useTheme();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSound, setCurrentSound] = useState(SOUNDS[0]);
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    // Configure audio mode
    useEffect(() => {
        const setupAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                });
            } catch (error) {
                console.error("Failed to setup audio:", error);
            }
        };
        setupAudio();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    // Handle sound change
    useEffect(() => {
        const loadSound = async () => {
            // Unload previous sound
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            if (!visible) return;

            setIsLoading(true);
            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: currentSound.url },
                    { isLooping: true, volume, shouldPlay: isPlaying }
                );
                soundRef.current = sound;
            } catch (error) {
                console.error("Failed to load sound:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSound();
    }, [currentSound.id, visible]);

    // Handle volume change
    useEffect(() => {
        if (soundRef.current) {
            soundRef.current.setVolumeAsync(volume);
        }
    }, [volume]);

    // Handle play/pause
    const togglePlay = async () => {
        if (!soundRef.current) return;

        try {
            if (isPlaying) {
                await soundRef.current.pauseAsync();
            } else {
                await soundRef.current.playAsync();
            }
            setIsPlaying(!isPlaying);
        } catch (error) {
            console.error("Failed to toggle play:", error);
        }
    };

    // Select a sound
    const selectSound = async (sound: typeof SOUNDS[0]) => {
        const wasPlaying = isPlaying;
        setCurrentSound(sound);
        if (wasPlaying) {
            setIsPlaying(true);
        }
    };

    // Stop and close
    const handleClose = async () => {
        if (soundRef.current && isPlaying) {
            await soundRef.current.pauseAsync();
        }
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <Pressable style={[styles.overlay, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" }]} onPress={handleClose}>
                <Pressable style={[styles.container, { backgroundColor: isDark ? "#0f0f2a" : "#ffffff" }]} onPress={e => e.stopPropagation()}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.surfaceBorder }]}>
                        <View style={styles.headerTitle}>
                            <Ionicons name="musical-notes" size={20} color={theme.primary} />
                            <Text style={[styles.title, { color: theme.text }]}>Focus Sounds</Text>
                        </View>
                        <Pressable style={[styles.closeBtn, { backgroundColor: theme.cardBackground }]} onPress={handleClose}>
                            <Ionicons name="close" size={22} color={theme.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Now Playing */}
                    <View style={styles.nowPlaying}>
                        <LinearGradient
                            colors={isDark ? ["rgba(99,102,241,0.2)", "rgba(139,92,246,0.15)"] : ["rgba(99,102,241,0.1)", "rgba(139,92,246,0.08)"]}
                            style={styles.nowPlayingIcon}
                        >
                            <Ionicons
                                name={currentSound.icon}
                                size={32}
                                color={theme.primary}
                            />
                        </LinearGradient>
                        <Text style={[styles.soundName, { color: theme.text }]}>{currentSound.name}</Text>
                        <Text style={[styles.soundStatus, { color: theme.textSecondary }]}>
                            {isLoading ? "Loading..." : isPlaying ? "Playing" : "Paused"}
                        </Text>
                    </View>

                    {/* Play/Pause Button */}
                    <View style={styles.controls}>
                        <Pressable onPress={togglePlay} disabled={isLoading}>
                            <LinearGradient
                                colors={isPlaying ? ["#ef4444", "#dc2626"] : ["#6366f1", "#8b5cf6"]}
                                style={styles.playBtn}
                            >
                                <Ionicons
                                    name={isPlaying ? "pause" : "play"}
                                    size={28}
                                    color="#fff"
                                    style={!isPlaying ? { marginLeft: 3 } : {}}
                                />
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {/* Volume Slider */}
                    <View style={styles.volumeContainer}>
                        <Ionicons name="volume-low" size={18} color={theme.textMuted} />
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={1}
                            value={volume}
                            onValueChange={setVolume}
                            minimumTrackTintColor={theme.primary}
                            maximumTrackTintColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                            thumbTintColor={theme.primary}
                        />
                        <Ionicons name="volume-high" size={18} color={theme.textMuted} />
                    </View>

                    {/* Sound Selection */}
                    <View style={styles.soundGrid}>
                        {SOUNDS.map((sound) => (
                            <Pressable
                                key={sound.id}
                                style={[
                                    styles.soundOption,
                                    {
                                        backgroundColor: currentSound.id === sound.id
                                            ? (isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)")
                                            : theme.cardBackground,
                                        borderColor: currentSound.id === sound.id ? theme.primary : theme.cardBorder,
                                    },
                                ]}
                                onPress={() => selectSound(sound)}
                            >
                                <Ionicons
                                    name={sound.icon}
                                    size={24}
                                    color={currentSound.id === sound.id ? theme.primary : theme.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.soundOptionText,
                                        { color: currentSound.id === sound.id ? theme.primary : theme.textSecondary }
                                    ]}
                                >
                                    {sound.name.split(" ")[0]}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Tip */}
                    <View style={[styles.tip, { backgroundColor: theme.cardBackground }]}>
                        <Ionicons name="bulb-outline" size={14} color={theme.textMuted} />
                        <Text style={[styles.tipText, { color: theme.textMuted }]}>
                            Ambient sounds help improve focus and concentration
                        </Text>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    nowPlaying: {
        alignItems: "center",
        paddingTop: 24,
        paddingBottom: 16,
    },
    nowPlayingIcon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    soundName: {
        fontSize: 18,
        fontWeight: "600",
    },
    soundStatus: {
        fontSize: 13,
        marginTop: 4,
    },
    controls: {
        alignItems: "center",
        paddingVertical: 16,
    },
    playBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    volumeContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 8,
        gap: 8,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    soundGrid: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 10,
    },
    soundOption: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 14,
        borderWidth: 1.5,
        gap: 6,
    },
    soundOptionText: {
        fontSize: 11,
        fontWeight: "500",
    },
    tip: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    tipText: {
        fontSize: 12,
        flex: 1,
    },
});
