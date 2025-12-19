import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, RefreshControl, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import { getStats, formatTime, Stats } from "@/services/statsService";

const { width } = Dimensions.get("window");

const features = [
    { id: 1, icon: "videocam", title: "Focus Rooms", description: "Join virtual study rooms", gradient: ["#6366f1", "#8b5cf6"] },
    { id: 2, icon: "people", title: "Study Together", description: "Connect with learners", gradient: ["#8b5cf6", "#a855f7"] },
    { id: 3, icon: "musical-notes", title: "Ambient Sounds", description: "Lo-fi beats & sounds", gradient: ["#ec4899", "#f43f5e"] },
    { id: 4, icon: "checkmark-circle", title: "Task Manager", description: "Track your goals", gradient: ["#10b981", "#14b8a6"] },
];

export default function HomeScreen() {
    const router = useRouter();
    const { user, isLoggedIn } = useAuth();
    const { theme, isDark } = useTheme();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        try {
            const data = await getStats();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.log("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, [fetchStats]);

    const todayStats = stats?.today || { tasks: 0, completed: 0, meetingTime: 0 };
    const totalStats = stats?.total || { tasks: 0, completed: 0, meetingTime: 0 };

    const backgroundColors = isDark
        ? [theme.gradientStart, theme.gradientMid, theme.gradientEnd] as const
        : [theme.background, theme.backgroundSecondary, theme.backgroundTertiary] as const;

    return (
        <LinearGradient colors={backgroundColors} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back! 👋</Text>
                            <Text style={[styles.title, { color: theme.text }]}>{user?.name || "Focus Room"}</Text>
                        </View>
                        <Pressable
                            style={[styles.notificationButton, { backgroundColor: theme.primaryLight }]}
                            onPress={() => isLoggedIn ? null : router.push("/(auth)/login")}
                        >
                            {isLoggedIn ? (
                                <>
                                    <Ionicons name="notifications-outline" size={24} color={theme.primary} />
                                    <View style={[styles.notificationBadge, { borderColor: theme.background }]} />
                                </>
                            ) : (
                                <Ionicons name="log-in-outline" size={24} color={theme.primary} />
                            )}
                        </Pressable>
                    </View>

                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <LinearGradient
                            colors={isDark
                                ? ["rgba(139, 92, 246, 0.2)", "rgba(99, 102, 241, 0.1)"]
                                : ["rgba(124, 58, 237, 0.12)", "rgba(79, 70, 229, 0.06)"]
                            }
                            style={[styles.heroCard, { borderColor: theme.primaryBorder }]}
                        >
                            <View style={styles.heroContent}>
                                <Text style={[styles.heroTitle, { color: theme.text }]}>Start Your Focus Session</Text>
                                <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>Join thousands of learners staying productive together</Text>
                                <Pressable style={styles.heroButton} onPress={() => router.push("/rooms")}>
                                    <LinearGradient colors={["#6366f1", "#8b5cf6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroButtonGradient}>
                                        <Ionicons name="play" size={20} color="#fff" />
                                        <Text style={styles.heroButtonText}>Join Room</Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                            <View style={[styles.heroStats, { backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)" }]}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNumber, { color: theme.text }]}>{formatTime(totalStats.meetingTime)}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Focus</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: theme.primaryBorder }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statNumber, { color: theme.text }]}>{totalStats.completed}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tasks Done</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Features */}
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Features</Text>
                        <View style={styles.featuresGrid}>
                            {features.map((f) => (
                                <Pressable
                                    key={f.id}
                                    style={[
                                        styles.featureCard,
                                        {
                                            backgroundColor: theme.cardBackground,
                                            borderColor: theme.cardBorder
                                        }
                                    ]}
                                >
                                    <LinearGradient colors={f.gradient as any} style={styles.featureIconContainer}>
                                        <Ionicons name={f.icon as any} size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={[styles.featureTitle, { color: theme.text }]}>{f.title}</Text>
                                    <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>{f.description}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Today's Stats */}
                    {isLoggedIn && (
                        <View style={styles.sectionContainer}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Stats</Text>
                            {loading ? (
                                <ActivityIndicator color={theme.primary} />
                            ) : (
                                <View style={styles.statsContainer}>
                                    <LinearGradient
                                        colors={isDark
                                            ? ["rgba(99,102,241,0.15)", "rgba(139,92,246,0.1)"]
                                            : ["rgba(99,102,241,0.1)", "rgba(139,92,246,0.05)"]
                                        }
                                        style={[styles.statCard, { borderColor: theme.cardBorder }]}
                                    >
                                        <Ionicons name="time-outline" size={28} color={theme.secondary} />
                                        <Text style={[styles.statCardNumber, { color: theme.text }]}>{formatTime(todayStats.meetingTime)}</Text>
                                        <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Focus Time</Text>
                                    </LinearGradient>
                                    <LinearGradient
                                        colors={isDark
                                            ? ["rgba(16,185,129,0.15)", "rgba(20,184,166,0.1)"]
                                            : ["rgba(16,185,129,0.1)", "rgba(20,184,166,0.05)"]
                                        }
                                        style={[styles.statCard, { borderColor: theme.cardBorder }]}
                                    >
                                        <Ionicons name="checkmark-done-outline" size={28} color={theme.success} />
                                        <Text style={[styles.statCardNumber, { color: theme.text }]}>{todayStats.completed}/{todayStats.tasks}</Text>
                                        <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Tasks Done</Text>
                                    </LinearGradient>
                                    <LinearGradient
                                        colors={isDark
                                            ? ["rgba(245,158,11,0.15)", "rgba(251,191,36,0.1)"]
                                            : ["rgba(245,158,11,0.1)", "rgba(251,191,36,0.05)"]
                                        }
                                        style={[styles.statCard, { borderColor: theme.cardBorder }]}
                                    >
                                        <Ionicons name="flame-outline" size={28} color={theme.warning} />
                                        <Text style={[styles.statCardNumber, { color: theme.text }]}>{Math.round((todayStats.completed / (todayStats.tasks || 1)) * 100)}%</Text>
                                        <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Success</Text>
                                    </LinearGradient>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Login prompt for guests */}
                    {!isLoggedIn && (
                        <Pressable style={styles.loginPrompt} onPress={() => router.push("/(auth)/login")}>
                            <LinearGradient
                                colors={isDark
                                    ? ["rgba(139,92,246,0.2)", "rgba(99,102,241,0.1)"]
                                    : ["rgba(124,58,237,0.12)", "rgba(79,70,229,0.06)"]
                                }
                                style={[styles.loginPromptContent, { borderColor: theme.primaryBorder }]}
                            >
                                <Ionicons name="person-circle-outline" size={32} color={theme.primary} />
                                <View style={styles.loginPromptText}>
                                    <Text style={[styles.loginPromptTitle, { color: theme.text }]}>Sign in for more!</Text>
                                    <Text style={[styles.loginPromptSubtitle, { color: theme.textSecondary }]}>Track stats, add friends, and more</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={theme.primary} />
                            </LinearGradient>
                        </Pressable>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, paddingBottom: 20 },
    greeting: { fontSize: 14, marginBottom: 4 },
    title: { fontSize: 28, fontWeight: "bold" },
    notificationButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    notificationBadge: { position: "absolute", top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444", borderWidth: 2 },
    heroSection: { marginBottom: 24 },
    heroCard: { borderRadius: 24, padding: 24, borderWidth: 1 },
    heroContent: { marginBottom: 20 },
    heroTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
    heroSubtitle: { fontSize: 15, marginBottom: 20, lineHeight: 22 },
    heroButton: { alignSelf: "flex-start" },
    heroButtonGradient: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, gap: 8 },
    heroButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    heroStats: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16 },
    statItem: { flex: 1, alignItems: "center" },
    statDivider: { width: 1, height: 30 },
    statNumber: { fontSize: 22, fontWeight: "bold" },
    statLabel: { fontSize: 12, marginTop: 4 },
    sectionContainer: { marginBottom: 24 },
    sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
    featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    featureCard: { width: (width - 52) / 2, borderRadius: 20, padding: 20, borderWidth: 1 },
    featureIconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    featureTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
    featureDescription: { fontSize: 13, lineHeight: 18 },
    statsContainer: { flexDirection: "row", gap: 12 },
    statCard: { flex: 1, alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1 },
    statCardNumber: { fontSize: 20, fontWeight: "bold", marginTop: 8 },
    statCardLabel: { fontSize: 11, marginTop: 4, textAlign: "center" },
    loginPrompt: { marginBottom: 24 },
    loginPromptContent: { flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 16, gap: 16, borderWidth: 1 },
    loginPromptText: { flex: 1 },
    loginPromptTitle: { fontSize: 16, fontWeight: "600" },
    loginPromptSubtitle: { fontSize: 13, marginTop: 2 },
});
