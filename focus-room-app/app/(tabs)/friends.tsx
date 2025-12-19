import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getFriendDetails, acceptFriendRequest, rejectFriendRequest, Friend, FriendRequest } from "@/services/friendService";

export default function FriendsScreen() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const { theme, isDark } = useTheme();
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"friends" | "requests">("friends");
    const [friends, setFriends] = useState<Friend[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        try {
            const data = await getFriendDetails();
            if (data.success) {
                setFriends(data.friends);
                setReceivedRequests(data.receivedRequests);
            }
        } catch (error) {
            console.log("Failed to fetch friends:", error);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const handleAccept = async (requestId: string) => {
        try {
            const result = await acceptFriendRequest(requestId);
            if (result.success) {
                Alert.alert("Success", "Friend request accepted!");
                fetchData();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to accept request");
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            const result = await rejectFriendRequest(requestId);
            if (result.success) {
                fetchData();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to reject request");
        }
    };

    const filtered = friends.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

    const backgroundColors = isDark
        ? [theme.gradientStart, theme.gradientMid, theme.gradientEnd] as const
        : [theme.background, theme.backgroundSecondary, theme.backgroundTertiary] as const;

    if (!isLoggedIn) {
        return (
            <LinearGradient colors={backgroundColors} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Friends</Text>
                    </View>
                    <View style={styles.loginPrompt}>
                        <Ionicons name="people-outline" size={64} color={theme.textMuted} />
                        <Text style={[styles.loginTitle, { color: theme.text }]}>Sign in to see friends</Text>
                        <Text style={[styles.loginSubtitle, { color: theme.textSecondary }]}>Connect with other focused learners</Text>
                        <Pressable style={styles.loginBtn} onPress={() => router.push("/(auth)/login")}>
                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.loginBtnGrad}>
                                <Text style={styles.loginBtnText}>Sign In</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={backgroundColors} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Friends</Text>
                    <Pressable style={[styles.addBtn, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="person-add-outline" size={22} color={theme.primary} />
                    </Pressable>
                </View>

                <View style={styles.searchWrap}>
                    <View style={[styles.searchBar, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                        <Ionicons name="search-outline" size={20} color={theme.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.inputText }]}
                            placeholder="Search friends..."
                            placeholderTextColor={theme.inputPlaceholder}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                <View style={styles.tabs}>
                    <Pressable
                        style={[
                            styles.tab,
                            { backgroundColor: theme.cardBackground },
                            tab === "friends" && { backgroundColor: theme.primaryLight }
                        ]}
                        onPress={() => setTab("friends")}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, tab === "friends" && { color: theme.text }]}>Friends ({friends.length})</Text>
                    </Pressable>
                    <Pressable
                        style={[
                            styles.tab,
                            { backgroundColor: theme.cardBackground },
                            tab === "requests" && { backgroundColor: theme.primaryLight }
                        ]}
                        onPress={() => setTab("requests")}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, tab === "requests" && { color: theme.text }]}>Requests ({receivedRequests.length})</Text>
                        {receivedRequests.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{receivedRequests.length}</Text></View>}
                    </Pressable>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
                    ) : tab === "friends" ? (
                        filtered.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>All Friends — {filtered.length}</Text>
                                {filtered.map((f) => (
                                    <Pressable key={f._id} style={[styles.friendCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                                        <View style={styles.avatarWrap}>
                                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.avatar}>
                                                <Text style={styles.avatarText}>{f.name.charAt(0).toUpperCase()}</Text>
                                            </LinearGradient>
                                        </View>
                                        <View style={styles.friendInfo}>
                                            <Text style={[styles.friendName, { color: theme.text }]}>{f.name}</Text>
                                            <Text style={[styles.friendStatus, { color: theme.textSecondary }]}>{f.email}</Text>
                                        </View>
                                        <Pressable style={[styles.chatBtn, { backgroundColor: theme.primaryLight }]}>
                                            <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
                                        </Pressable>
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>No friends yet</Text>
                                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Start adding friends to study together</Text>
                            </View>
                        )
                    ) : (
                        receivedRequests.length > 0 ? (
                            <View style={styles.section}>
                                {receivedRequests.map((r) => (
                                    <View key={r._id} style={[styles.requestCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                                        <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.avatar}>
                                            <Text style={styles.avatarText}>{r.sender.name.charAt(0).toUpperCase()}</Text>
                                        </LinearGradient>
                                        <View style={styles.requestInfo}>
                                            <Text style={[styles.friendName, { color: theme.text }]}>{r.sender.name}</Text>
                                            <Text style={[styles.mutualText, { color: theme.textSecondary }]}>{r.sender.email}</Text>
                                        </View>
                                        <View style={styles.requestActions}>
                                            <Pressable style={styles.acceptBtn} onPress={() => handleAccept(r._id)}><Ionicons name="checkmark" size={20} color="#fff" /></Pressable>
                                            <Pressable style={styles.declineBtn} onPress={() => handleReject(r._id)}><Ionicons name="close" size={20} color="#ef4444" /></Pressable>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="mail-outline" size={48} color={theme.textMuted} />
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>No pending requests</Text>
                                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Friend requests will appear here</Text>
                            </View>
                        )
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
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: "bold" },
    addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    searchWrap: { paddingHorizontal: 20, marginBottom: 16 },
    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 16, marginLeft: 12 },
    tabs: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 20, gap: 12 },
    tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, gap: 6 },
    tabText: { fontSize: 14, fontWeight: "500" },
    badge: { backgroundColor: "#ef4444", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
    list: { paddingHorizontal: 20 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
    friendCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
    avatarWrap: { marginRight: 14 },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontSize: 18, fontWeight: "600" },
    friendInfo: { flex: 1 },
    friendName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
    friendStatus: { fontSize: 13 },
    chatBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    requestCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
    requestInfo: { flex: 1, marginLeft: 14 },
    mutualText: { fontSize: 12, marginTop: 4 },
    requestActions: { flexDirection: "row", gap: 8 },
    acceptBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(16,185,129,0.3)", alignItems: "center", justifyContent: "center" },
    declineBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(239,68,68,0.2)", alignItems: "center", justifyContent: "center" },
    emptyState: { alignItems: "center", paddingTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
    emptySubtitle: { fontSize: 14, marginTop: 8 },
    loginPrompt: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
    loginTitle: { fontSize: 20, fontWeight: "600", marginTop: 20 },
    loginSubtitle: { fontSize: 15, marginTop: 8, textAlign: "center" },
    loginBtn: { borderRadius: 30, overflow: "hidden", marginTop: 24 },
    loginBtnGrad: { paddingHorizontal: 32, paddingVertical: 14 },
    loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
