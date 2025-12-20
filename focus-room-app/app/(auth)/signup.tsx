import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function SignupScreen() {
    const router = useRouter();
    const { signup } = useAuth();
    const { theme, isDark } = useTheme();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setError("");
        setLoading(true);
        const result = await signup(name, email, password);
        setLoading(false);
        if (result.success) {
            router.replace("/(tabs)");
        } else {
            setError(result.error || "Signup failed");
        }
    };

    const backgroundColors = isDark
        ? [theme.gradientStart, theme.gradientMid, theme.gradientEnd] as const
        : [theme.background, theme.backgroundSecondary, theme.backgroundTertiary] as const;

    return (
        <LinearGradient colors={backgroundColors} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Pressable style={[styles.backBtn, { backgroundColor: theme.cardBackground }]} onPress={() => router.back()}>
                                <Ionicons name="arrow-back" size={24} color={theme.text} />
                            </Pressable>
                        </View>

                        <View style={styles.content}>
                            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join the Focus Room community</Text>

                            {error ? (
                                <View style={[styles.errorBox, { backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)" }]}>
                                    <Ionicons name="alert-circle" size={18} color={theme.error} />
                                    <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                                </View>
                            ) : null}

                            <View style={styles.form}>
                                <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                                    <Ionicons name="person-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.inputText }]}
                                        placeholder="Full Name"
                                        placeholderTextColor={theme.inputPlaceholder}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>

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

                                <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                                    <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.inputText }]}
                                        placeholder="Confirm Password"
                                        placeholderTextColor={theme.inputPlaceholder}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                </View>

                                <Pressable style={styles.signupBtn} onPress={handleSignup} disabled={loading}>
                                    <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.signupBtnGrad}>
                                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupBtnText}>Create Account</Text>}
                                    </LinearGradient>
                                </Pressable>
                            </View>

                            <View style={styles.loginRow}>
                                <Text style={[styles.loginText, { color: theme.textSecondary }]}>Already have an account? </Text>
                                <Pressable onPress={() => router.back()}>
                                    <Text style={[styles.loginLink, { color: theme.primary }]}>Sign In</Text>
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: { paddingHorizontal: 20, paddingTop: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: "center", paddingBottom: 40 },
    title: { fontSize: 32, fontWeight: "bold", marginBottom: 8 },
    subtitle: { fontSize: 16, marginBottom: 32 },
    errorBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 20, gap: 8 },
    errorText: { fontSize: 14 },
    form: { gap: 16 },
    inputContainer: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16 },
    signupBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
    signupBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
    signupBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
    loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    loginText: { fontSize: 15 },
    loginLink: { fontSize: 15, fontWeight: "600" },
});
