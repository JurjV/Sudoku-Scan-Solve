import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { loadUsername } from "./utils/statsStorage";

export default function Layout() {
    const router = useRouter();

    useEffect(() => {
        const checkUsername = async () => {
            const username = await loadUsername();
            if (!username) {
                router.replace('./screens/UsernameSetup');
            }
        };
        checkUsername();
    }, []);

    return (
        <Stack
            screenOptions={{
                headerBackTitle: "Back",
                headerStyle: {
                    backgroundColor: 'rgb(90, 90, 90)',
                },
                headerTitleStyle: {
                    color: 'white',
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Home" }} />
            <Stack.Screen name="screens/Profile" options={{ title: "Profile" }} />
            <Stack.Screen name="screens/PhotoPage" options={{ title: "Scan Sudoku" }} />
            <Stack.Screen name="screens/SudokuBoard" options={{ title: "" }} />
            <Stack.Screen name="screens/UsernameSetup" options={{ title: "Set Username", headerShown: false }} />
        </Stack>
    );
}