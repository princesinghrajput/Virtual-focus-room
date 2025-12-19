import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getStats, formatTime, Stats } from "@/services/statsService";

const menuItems = [
    { id: "stats", label: "Statistics", icon: "stats-chart-outline", color: "#6366f1" },
    { id: "achievements", label: "Achievements", icon: "trophy-outline", color: "#f59e0b" },
    { id: "settings", label: "Settings", icon: "settings-outline", color: "#9ca3af" },
    { id: "help", label: "Help & Support", icon: "help-circle-outline", color: "#10b981" },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { user, isLoggedIn, logout } = useAuth();
    const { theme, isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
    const [notifications, setNotifications] = useState(true);
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

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout", style: "destructive", onPress: async () => {
                    await logout();
                    router.replace("/(auth)/login");
                }
            },
        ]);
    };

    const handleThemeModePress = () => {
        // Cycle through: dark -> light -> system -> dark
        if (themeMode === "dark") {
            setThemeMode("light");
        } else if (themeMode === "light") {
            setThemeMode("system");
        } else {
            setThemeMode("dark");
        }
    };

    const getThemeModeLabel = () => {
        switch (themeMode) {
            case "dark": return "Dark";
            case "light": return "Light";
            case "system": return "System";
        }
    };

    const totalStats = stats?.total || { tasks: 0, completed: 0, meetingTime: 0 };

    // Create dynamic styles based on theme
    const dynamicStyles = {
        container: { flex: 1 },
        background: {
            colors: isDark
                ? [theme.gradientStart, theme.gradientMid, theme.gradientEnd] as const
                : [theme.background, theme.backgroundSecondary, theme.backgroundTertiary] as const,
        },
    };

    if (!isLoggedIn) {
        return (
            <LinearGradient colors={dynamicStyles.background.colors} style={dynamicStyles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
                    </View>
                    <View style={styles.loginPrompt}>
                        <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.guestAvatar}>
                            <Ionicons name="person-outline" size={48} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.loginTitle, { color: theme.text }]}>Sign in to your account</Text>
                        <Text style={[styles.loginSubtitle, { color: theme.textSecondary }]}>Access your stats, achievements, and settings</Text>
                        <Pressable style={styles.loginBtn} onPress={() => router.push("/(auth)/login")}>
                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.loginBtnGrad}>
                                <Text style={styles.loginBtnText}>Sign In</Text>
                            </LinearGradient>
                        </Pressable>
                        <Pressable style={styles.signupBtn} onPress={() => router.push("/(auth)/signup")}>
                            <Text style={[styles.signupText, { color: theme.primary }]}>Create an Account</Text>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={dynamicStyles.background.colors} style={dynamicStyles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                        />
                    }
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
                    </View>

                    {/* Profile Card */}
                    <View style={[styles.profileCard, { borderColor: theme.primaryBorder }]}>
                        <LinearGradient
                            colors={isDark
                                ? ["rgba(139,92,246,0.2)", "rgba(99,102,241,0.1)"]
                                : ["rgba(124,58,237,0.1)", "rgba(79,70,229,0.05)"]
                            }
                            style={[styles.profileBg, { borderColor: theme.primaryBorder }]}
                        >
                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.avatar}>
                                <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || "U"}</Text>
                            </LinearGradient>
                            <Text style={[styles.userName, { color: theme.text }]}>{user?.name}</Text>
                            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
                            <View style={styles.badges}>
                                <View style={[styles.badge, { backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)" }]}>
                                    <Ionicons name="star" size={14} color={theme.warning} />
                                    <Text style={[styles.badgeText, { color: theme.text }]}>
                                        {user?.tier === "premium" ? "Pro Member" : "Free Member"}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Stats */}
                    {loading ? (
                        <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                                <Ionicons name="time-outline" size={24} color={theme.secondary} />
                                <Text style={[styles.statValue, { color: theme.text }]}>{formatTime(totalStats.meetingTime)}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Focus</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                                <Ionicons name="checkmark-done-outline" size={24} color={theme.success} />
                                <Text style={[styles.statValue, { color: theme.text }]}>{totalStats.completed}</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tasks Done</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                                <Ionicons name="trending-up-outline" size={24} color={theme.warning} />
                                <Text style={[styles.statValue, { color: theme.text }]}>{Math.round((totalStats.completed / (totalStats.tasks || 1)) * 100)}%</Text>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Success</Text>
                            </View>
                        </View>
                    )}

                    {/* Quick Settings */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Quick Settings</Text>
                        <View style={[styles.settingCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Ionicons name="notifications-outline" size={22} color={theme.primary} />
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
                                </View>
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                                    thumbColor={notifications ? theme.switchThumbOn : theme.switchThumbOff}
                                />
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.surfaceBorder }]} />
                            <Pressable style={styles.settingRow} onPress={handleThemeModePress}>
                                <View style={styles.settingInfo}>
                                    <Ionicons name={isDark ? "moon" : "sunny"} size={22} color={theme.primary} />
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Theme</Text>
                                </View>
                                <View style={styles.themeModeContainer}>
                                    <Text style={[styles.themeModeText, { color: theme.textSecondary }]}>{getThemeModeLabel()}</Text>
                                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account</Text>
                        <View style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                            {menuItems.map((item, i) => (
                                <Pressable key={item.id}>
                                    <View style={styles.menuRow}>
                                        <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                                            <Ionicons name={item.icon as any} size={20} color={item.color} />
                                        </View>
                                        <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                                    </View>
                                    {i < menuItems.length - 1 && <View style={[styles.divider, { backgroundColor: theme.surfaceBorder }]} />}
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Logout Button */}
                    <Pressable
                        style={[styles.logoutBtn, { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)" }]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color={theme.error} />
                        <Text style={[styles.logoutText, { color: theme.error }]}>Log Out</Text>
                    </Pressable>

                    <Text style={[styles.version, { color: theme.textMuted }]}>Focus Room v1.0.0</Text>
                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    content: { paddingHorizontal: 20 },
    header: { paddingTop: 10, paddingBottom: 20 },
    title: { fontSize: 28, fontWeight: "bold" },
    profileCard: { marginBottom: 24, borderRadius: 24, overflow: "hidden" },
    profileBg: { alignItems: "center", padding: 28, borderWidth: 1, borderRadius: 24 },
    avatar: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    avatarText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
    userName: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
    userEmail: { fontSize: 15, marginBottom: 16 },
    badges: { flexDirection: "row", gap: 12 },
    badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    badgeText: { fontSize: 12, fontWeight: "500" },
    statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    statCard: { flex: 1, alignItems: "center", borderRadius: 16, padding: 16, borderWidth: 1 },
    statValue: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
    statLabel: { fontSize: 11, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
    settingCard: { borderRadius: 16, padding: 4, borderWidth: 1 },
    settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
    settingInfo: { flexDirection: "row", alignItems: "center", gap: 14 },
    settingLabel: { fontSize: 16 },
    themeModeContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
    themeModeText: { fontSize: 15 },
    divider: { height: 1, marginHorizontal: 14 },
    menuCard: { borderRadius: 16, borderWidth: 1 },
    menuRow: { flexDirection: "row", alignItems: "center", padding: 14 },
    menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14 },
    menuLabel: { flex: 1, fontSize: 16 },
    logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 16, paddingVertical: 16, gap: 8, marginBottom: 20 },
    logoutText: { fontSize: 16, fontWeight: "600" },
    version: { textAlign: "center", fontSize: 13 },
    loginPrompt: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
    guestAvatar: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 24 },
    loginTitle: { fontSize: 22, fontWeight: "600" },
    loginSubtitle: { fontSize: 15, marginTop: 8, textAlign: "center", lineHeight: 22 },
    loginBtn: { borderRadius: 30, overflow: "hidden", marginTop: 24 },
    loginBtnGrad: { paddingHorizontal: 40, paddingVertical: 14 },
    loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    signupBtn: { marginTop: 16 },
    signupText: { fontSize: 15, fontWeight: "500" },
});
