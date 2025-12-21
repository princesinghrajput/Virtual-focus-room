import React, { useState, useRef, useEffect } from "react";
import {
    View,
    StyleSheet,
    Dimensions,
    Pressable,
    Text,
    Modal,
    GestureResponderEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Line } from "react-native-svg";
import { useSocket } from "@/context/SocketContext";
import { useTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.6;

// Line segment format (compatible with browser Whiteboard)
type DrawLine = {
    x0: number;  // normalized 0-1
    y0: number;
    x1: number;
    y1: number;
    color: string;
    width: number;
};

// Colors for dark mode (light colors on dark canvas)
const COLORS_DARK = [
    "#ffffff", // White
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
];

// Colors for light mode (dark colors on white canvas)
const COLORS_LIGHT = [
    "#1e293b", // Dark slate (default)
    "#000000", // Black
    "#dc2626", // Red
    "#ea580c", // Orange
    "#16a34a", // Green
    "#2563eb", // Blue
    "#7c3aed", // Purple
    "#db2777", // Pink
];

const STROKE_WIDTHS = [2, 4, 6, 8, 12];

type JamboardProps = {
    visible: boolean;
    onClose: () => void;
};

export default function Jamboard({ visible, onClose }: JamboardProps) {
    const { socket, isConnected, currentRoom } = useSocket();
    const { theme, isDark } = useTheme();
    const [lines, setLines] = useState<DrawLine[]>([]);
    const [selectedColor, setSelectedColor] = useState(isDark ? "#ffffff" : "#1e293b");
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isEraser, setIsEraser] = useState(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);
    const isDrawingRef = useRef(false);

    // Get the appropriate colors based on theme
    const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

    // Canvas and eraser colors
    const canvasColor = isDark ? "#0f0f2a" : "#ffffff";
    const eraserColor = canvasColor;

    // Update default color when theme changes
    useEffect(() => {
        setSelectedColor(isDark ? "#ffffff" : "#1e293b");
    }, [isDark]);

    // Request history when opening
    useEffect(() => {
        if (visible && socket && isConnected) {
            socket.emit("whiteboard:request-history");
        }
    }, [visible, socket, isConnected]);

    // Listen for whiteboard events
    useEffect(() => {
        if (!socket) return;

        // Helper to validate incoming line data
        const isValidLine = (line: DrawLine): boolean => {
            return line &&
                typeof line.x0 === 'number' &&
                typeof line.y0 === 'number' &&
                typeof line.x1 === 'number' &&
                typeof line.y1 === 'number' &&
                typeof line.color === 'string' &&
                typeof line.width === 'number';
        };

        // Receive drawing from others
        const onDraw = (data: DrawLine) => {
            if (isValidLine(data)) {
                setLines((prev) => [...prev, data]);
            }
        };

        // Receive clear event
        const onClear = () => {
            setLines([]);
        };

        // Receive history
        const onHistory = (history: DrawLine[]) => {
            if (history && Array.isArray(history)) {
                const validHistory = history.filter(isValidLine);
                if (validHistory.length > 0) {
                    setLines(validHistory);
                }
            }
        };

        socket.on("whiteboard:draw", onDraw);
        socket.on("whiteboard:clear", onClear);
        socket.on("whiteboard:history", onHistory);

        return () => {
            socket.off("whiteboard:draw", onDraw);
            socket.off("whiteboard:clear", onClear);
            socket.off("whiteboard:history", onHistory);
        };
    }, [socket]);

    // Get normalized coordinates (0-1) from touch event
    const getNormalizedCoords = (e: GestureResponderEvent) => {
        const { locationX, locationY } = e.nativeEvent;
        return {
            x: locationX / CANVAS_WIDTH,
            y: locationY / CANVAS_HEIGHT
        };
    };

    // Handle touch start
    const handleTouchStart = (e: GestureResponderEvent) => {
        isDrawingRef.current = true;
        const coords = getNormalizedCoords(e);
        lastPosRef.current = coords;
    };

    // Handle touch move
    const handleTouchMove = (e: GestureResponderEvent) => {
        if (!isDrawingRef.current || !lastPosRef.current) return;

        const coords = getNormalizedCoords(e);
        const { x: lastX, y: lastY } = lastPosRef.current;

        const newLine: DrawLine = {
            x0: lastX,
            y0: lastY,
            x1: coords.x,
            y1: coords.y,
            color: isEraser ? eraserColor : selectedColor,
            width: isEraser ? strokeWidth * 3 : strokeWidth,
        };

        // Add line locally
        setLines((prev) => [...prev, newLine]);

        // Emit to other users
        if (socket && isConnected) {
            socket.emit("whiteboard:draw", {
                roomId: currentRoom?.id,
                ...newLine
            });
        }

        lastPosRef.current = coords;
    };

    // Handle touch end
    const handleTouchEnd = () => {
        isDrawingRef.current = false;
        lastPosRef.current = null;
    };

    // Clear the canvas
    const handleClear = () => {
        setLines([]);
        if (socket && isConnected) {
            socket.emit("whiteboard:clear", { roomId: currentRoom?.id });
        }
    };

    // Undo last line
    const handleUndo = () => {
        if (lines.length > 0) {
            setLines((prev) => prev.slice(0, -1));
        }
    };

    const backgroundColors = isDark
        ? [theme.gradientStart, theme.gradientMid, theme.gradientEnd] as const
        : [theme.background, theme.backgroundSecondary, theme.backgroundTertiary] as const;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <LinearGradient colors={backgroundColors} style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.surfaceBorder }]}>
                    <Pressable style={[styles.closeBtn, { backgroundColor: theme.cardBackground }]} onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <Ionicons name="easel" size={20} color={theme.primary} />
                        <Text style={[styles.title, { color: theme.text }]}>Jamboard</Text>
                        {isConnected && (
                            <View style={styles.syncBadge}>
                                <View style={styles.syncDot} />
                                <Text style={styles.syncText}>Synced</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable style={[styles.actionBtn, { backgroundColor: theme.cardBackground }]} onPress={handleUndo}>
                            <Ionicons name="arrow-undo" size={20} color={theme.textSecondary} />
                        </Pressable>
                        <Pressable style={[styles.actionBtn, { backgroundColor: theme.cardBackground }]} onPress={handleClear}>
                            <Ionicons name="trash-outline" size={20} color={theme.error} />
                        </Pressable>
                    </View>
                </View>

                {/* Canvas */}
                <View style={styles.canvasContainer}>
                    <View
                        style={[styles.canvas, { backgroundColor: canvasColor, borderColor: theme.primaryBorder }]}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={styles.svg}>
                            {/* Render all lines */}
                            {lines.map((line, index) => (
                                <Line
                                    key={index}
                                    x1={line.x0 * CANVAS_WIDTH}
                                    y1={line.y0 * CANVAS_HEIGHT}
                                    x2={line.x1 * CANVAS_WIDTH}
                                    y2={line.y1 * CANVAS_HEIGHT}
                                    stroke={line.color}
                                    strokeWidth={line.width}
                                    strokeLinecap="round"
                                />
                            ))}
                        </Svg>
                    </View>
                </View>

                {/* Toolbar */}
                <View style={[styles.toolbar, { borderTopColor: theme.surfaceBorder }]}>
                    {/* Color Picker Toggle */}
                    <Pressable
                        style={[styles.toolBtn, { backgroundColor: theme.cardBackground }, showColorPicker && { backgroundColor: theme.primaryLight, borderWidth: 2, borderColor: theme.primary }]}
                        onPress={() => setShowColorPicker(!showColorPicker)}
                    >
                        <View style={[styles.colorPreview, { backgroundColor: selectedColor, borderColor: isDark ? "#fff" : "#374151" }]} />
                    </Pressable>

                    {/* Pen Tool */}
                    <Pressable
                        style={[styles.toolBtn, { backgroundColor: theme.cardBackground }, !isEraser && { backgroundColor: theme.primaryLight, borderWidth: 2, borderColor: theme.primary }]}
                        onPress={() => setIsEraser(false)}
                    >
                        <Ionicons name="pencil" size={24} color={!isEraser ? theme.primary : theme.textSecondary} />
                    </Pressable>

                    {/* Eraser Tool */}
                    <Pressable
                        style={[styles.toolBtn, { backgroundColor: theme.cardBackground }, isEraser && { backgroundColor: theme.primaryLight, borderWidth: 2, borderColor: theme.primary }]}
                        onPress={() => setIsEraser(true)}
                    >
                        <Ionicons name="bandage" size={24} color={isEraser ? theme.primary : theme.textSecondary} />
                    </Pressable>

                    {/* Stroke Width */}
                    <View style={[styles.strokeContainer, { backgroundColor: theme.cardBackground }]}>
                        {STROKE_WIDTHS.map((width) => (
                            <Pressable
                                key={width}
                                style={[styles.strokeBtn, strokeWidth === width && { backgroundColor: theme.primaryLight }]}
                                onPress={() => setStrokeWidth(width)}
                            >
                                <View
                                    style={[
                                        styles.strokePreview,
                                        { width: width + 8, height: width + 8, backgroundColor: theme.textSecondary },
                                        strokeWidth === width && { backgroundColor: theme.primary },
                                    ]}
                                />
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Color Picker Panel */}
                {showColorPicker && (
                    <View style={[styles.colorPicker, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
                        <Text style={[styles.colorPickerTitle, { color: theme.text }]}>Select Color</Text>
                        <View style={styles.colorGrid}>
                            {COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color, borderColor: selectedColor === color ? theme.primary : "transparent" },
                                    ]}
                                    onPress={() => {
                                        setSelectedColor(color);
                                        setIsEraser(false);
                                        setShowColorPicker(false);
                                    }}
                                >
                                    {selectedColor === color && (
                                        <Ionicons name="checkmark" size={20} color={isDark ? (color === "#ffffff" ? "#000" : "#fff") : (color === "#000000" || color === "#1e293b" ? "#fff" : "#000")} />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerCenter: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    title: { fontSize: 18, fontWeight: "600" },
    syncBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(16,185,129,0.2)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
    syncText: { color: "#10b981", fontSize: 11, fontWeight: "600" },
    headerActions: { flexDirection: "row", gap: 8 },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },

    // Canvas
    canvasContainer: {
        flex: 1,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    canvas: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        borderRadius: 16,
        borderWidth: 2,
        overflow: "hidden",
    },
    svg: { backgroundColor: "transparent" },

    // Toolbar
    toolbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
        borderTopWidth: 1,
    },
    toolBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    colorPreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    strokeContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 24,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },
    strokeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    strokePreview: {
        borderRadius: 20,
    },

    // Color Picker
    colorPicker: {
        position: "absolute",
        bottom: 100,
        left: 16,
        right: 16,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    colorPickerTitle: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 16,
    },
    colorGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 12,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
    },
});
