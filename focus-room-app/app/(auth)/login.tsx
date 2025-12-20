import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const { theme, isDark } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }
        setError("");
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (result.success) {
            router.replace("/(tabs)");
        } else {
            setError(result.error || "Login failed");
        }
    };

    const backgroundColors = isDark
        ? [theme.gradientStart, theme.gradientMid, theme.gradientEnd] as const
        : [theme.background, theme.backgroundSecondary, theme.backgroundTertiary] as const;

    return (
        <LinearGradient colors={backgroundColors} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
                    <View style={styles.content}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.logoIcon}>
                                <Ionicons name="videocam" size={40} color="#fff" />
                            </LinearGradient>
                            <Text style={[styles.logoText, { color: theme.text }]}>Focus Room</Text>
                            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Stay focused, together</Text>
                        </View>

                        {/* Error */}
                        {error ? (
                            <View style={[styles.errorBox, { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)" }]}>
                                <Ionicons name="alert-circle" size={18} color={theme.error} />
                                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                                <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.inputText }]}
                                    placeholder="Email"
                                    placeholderTextColor={theme.inputPlaceholder}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.inputText }]}
                                    placeholder="Password"
                                    placeholderTextColor={theme.inputPlaceholder}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <Pressable onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                                </Pressable>
                            </View>

                            <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                                <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.loginBtnGrad}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
                                </LinearGradient>
                            </Pressable>
                        </View>

                        {/* Signup link */}
                        <View style={styles.signupRow}>
                            <Text style={[styles.signupText, { color: theme.textSecondary }]}>Don't have an account? </Text>
                            <Pressable onPress={() => router.push("/(auth)/signup")}>
                                <Text style={[styles.signupLink, { color: theme.primary }]}>Sign Up</Text>
                            </Pressable>
                        </View>

                        {/* Guest mode */}
                        <Pressable style={styles.guestBtn} onPress={() => router.replace("/(tabs)")}>
                            <Text style={[styles.guestText, { color: theme.textMuted }]}>Continue as Guest</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
    logoContainer: { alignItems: "center", marginBottom: 40 },
    logoIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    logoText: { fontSize: 32, fontWeight: "bold" },
    tagline: { fontSize: 16, marginTop: 8 },
    errorBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 20, gap: 8 },
    errorText: { fontSize: 14 },
    form: { gap: 16 },
    inputContainer: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16 },
    loginBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
    loginBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
    loginBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
    signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    signupText: { fontSize: 15 },
    signupLink: { fontSize: 15, fontWeight: "600" },
    guestBtn: { marginTop: 20, paddingVertical: 16, alignItems: "center" },
    guestText: { fontSize: 15 },
});
