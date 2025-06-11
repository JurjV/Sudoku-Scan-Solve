import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";


const BACKEND_CONFIG = {
  IP: "192.168.1.132",
  PORT: "5000",
};

export default function HomeScreen() {
  const router = useRouter();

  const navigateWithConfig = (screen: string) => {
    router.push({
      pathname: `./screens/${screen}`,
      params: { backendConfig: JSON.stringify(BACKEND_CONFIG) },
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to Sudoku Scan&Solve</Text>
      <Button 
        title="Start Scanning" 
        onPress={() => navigateWithConfig("PhotoPage")} 
      />
      <Button 
        title="Visit Profile" 
        onPress={() => navigateWithConfig("Profile")} 
      />
    </View>
  );
}