import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Theme color definitions
export const themes = {
    dark: {
        mode: "dark" as const,
        // Background colors
        background: "#0a0a1a",
        backgroundSecondary: "#0f0f2a",
        backgroundTertiary: "#1a1a35",
        surface: "rgba(255,255,255,0.05)",
        surfaceBorder: "rgba(255,255,255,0.1)",

        // Gradient backgrounds
        gradientStart: "#0a0a1a",
        gradientMid: "#0f0f2a",
        gradientEnd: "#1a1a35",

        // Text colors
        text: "#ffffff",
        textSecondary: "#9ca3af",
        textMuted: "#6b7280",

        // Primary/accent colors
        primary: "#a78bfa",
        primaryLight: "rgba(139,92,246,0.3)",
        primaryBorder: "rgba(139,92,246,0.2)",
        secondary: "#6366f1",

        // Status colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",

        // Tab bar
        tabBarBackground: "rgba(15, 15, 35, 0.95)",
        tabBarBorder: "rgba(139, 92, 246, 0.2)",
        tabIconActive: "#ffffff",
        tabIconInactive: "#6b7280",

        // Cards and overlays
        cardBackground: "rgba(255,255,255,0.05)",
        cardBorder: "rgba(255,255,255,0.1)",
        overlay: "rgba(0,0,0,0.5)",

        // Input fields
        inputBackground: "rgba(255,255,255,0.05)",
        inputBorder: "rgba(255,255,255,0.1)",
        inputText: "#ffffff",
        inputPlaceholder: "#6b7280",

        // Switch/Toggle
        switchTrackOff: "#374151",
        switchTrackOn: "rgba(139,92,246,0.5)",
        switchThumbOff: "#9ca3af",
        switchThumbOn: "#a78bfa",

        // StatusBar
        statusBarStyle: "light" as const,
    },
    light: {
        mode: "light" as const,
        // Background colors
        background: "#f8fafc",
        backgroundSecondary: "#ffffff",
        backgroundTertiary: "#f1f5f9",
        surface: "rgba(0,0,0,0.03)",
        surfaceBorder: "rgba(0,0,0,0.08)",

        // Gradient backgrounds
        gradientStart: "#f8fafc",
        gradientMid: "#ffffff",
        gradientEnd: "#f1f5f9",

        // Text colors
        text: "#1e293b",
        textSecondary: "#64748b",
        textMuted: "#94a3b8",

        // Primary/accent colors
        primary: "#7c3aed",
        primaryLight: "rgba(124,58,237,0.15)",
        primaryBorder: "rgba(124,58,237,0.2)",
        secondary: "#4f46e5",

        // Status colors
        success: "#059669",
        warning: "#d97706",
        error: "#dc2626",
        info: "#2563eb",

        // Tab bar
        tabBarBackground: "rgba(255, 255, 255, 0.98)",
        tabBarBorder: "rgba(124, 58, 237, 0.15)",
        tabIconActive: "#7c3aed",
        tabIconInactive: "#94a3b8",

        // Cards and overlays
        cardBackground: "#ffffff",
        cardBorder: "rgba(0,0,0,0.08)",
        overlay: "rgba(0,0,0,0.3)",

        // Input fields
        inputBackground: "#ffffff",
        inputBorder: "rgba(0,0,0,0.1)",
        inputText: "#1e293b",
        inputPlaceholder: "#94a3b8",

        // Switch/Toggle
        switchTrackOff: "#d1d5db",
        switchTrackOn: "rgba(124,58,237,0.5)",
        switchThumbOff: "#ffffff",
        switchThumbOn: "#7c3aed",

        // StatusBar
        statusBarStyle: "dark" as const,
    },
};

export type Theme = typeof themes.dark;
export type ThemeMode = "dark" | "light" | "system";

type ThemeContextType = {
    theme: Theme;
    themeMode: ThemeMode;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = "@focus_room_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme && (savedTheme === "dark" || savedTheme === "light" || savedTheme === "system")) {
                    setThemeModeState(savedTheme as ThemeMode);
                }
            } catch (error) {
                console.log("Failed to load theme preference:", error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    // Save theme preference
    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (error) {
            console.log("Failed to save theme preference:", error);
        }
    };

    // Toggle between dark and light (ignores system)
    const toggleTheme = () => {
        const newMode = isDark ? "light" : "dark";
        setThemeMode(newMode);
    };

    // Determine if dark mode should be active
    const isDark = themeMode === "system"
        ? systemColorScheme === "dark"
        : themeMode === "dark";

    // Get current theme object
    const theme = isDark ? themes.dark : themes.light;

    // Don't render children until theme is loaded to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider
            value={{
                theme,
                themeMode,
                isDark,
                setThemeMode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

export default ThemeContext;
