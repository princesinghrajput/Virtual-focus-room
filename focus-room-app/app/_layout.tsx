import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { CameraProvider } from "@/context/CameraContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import "../global.css";

function RootLayoutContent() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="room/prejoin" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="room/[roomId]" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CameraProvider>
            <RootLayoutContent />
          </CameraProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
