import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

type TabIconProps = {
    focused: boolean;
    color: string;
    name: keyof typeof Ionicons.glyphMap;
    label: string;
    theme: ReturnType<typeof useTheme>["theme"];
};

function TabIcon({ focused, color, name, label, theme }: TabIconProps) {
    return (
        <View style={styles.tabIconContainer}>
            <View
                style={[
                    styles.iconWrapper,
                    focused && { backgroundColor: theme.primaryLight },
                ]}
            >
                <Ionicons
                    name={name}
                    size={24}
                    color={focused ? theme.tabIconActive : theme.tabIconInactive}
                />
            </View>
            <Text
                style={[
                    styles.tabLabel,
                    { color: focused ? theme.primary : theme.tabIconInactive },
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

export default function TabLayout() {
    const { theme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: [
                    styles.tabBar,
                    {
                        backgroundColor: theme.tabBarBackground,
                        borderTopColor: theme.tabBarBorder,
                    },
                ],
                tabBarShowLabel: false,
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.tabIconInactive,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            focused={focused}
                            color={color}
                            name={focused ? "home" : "home-outline"}
                            label="Home"
                            theme={theme}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="rooms"
                options={{
                    title: "Rooms",
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            focused={focused}
                            color={color}
                            name={focused ? "grid" : "grid-outline"}
                            label="Rooms"
                            theme={theme}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="friends"
                options={{
                    title: "Friends",
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            focused={focused}
                            color={color}
                            name={focused ? "people" : "people-outline"}
                            label="Friends"
                            theme={theme}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            focused={focused}
                            color={color}
                            name={focused ? "person" : "person-outline"}
                            label="Profile"
                            theme={theme}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        borderTopWidth: 1,
        height: 75,
        paddingBottom: 10,
        paddingTop: 10,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabIconContainer: {
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: "600",
    },
});
