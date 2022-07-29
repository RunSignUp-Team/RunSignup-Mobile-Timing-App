import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";


/** Toggle Device Sync */
export default function ToggleSync(syncEnabled: boolean, setSyncEnabled: (value: React.SetStateAction<boolean>) => void): void {
	if (syncEnabled) {
		Alert.alert(
			"Disable Sync?",
			"Are you sure you want to disable sync for this device? This will keep all data local to your device, and no data will be synced to RunSignup until you re-enable sync.",
			[
				{ text: "Cancel" },
				{
					text: "Disable Sync",
					style: "destructive",
					onPress: (): void => {
						setSyncEnabled(false);
						AsyncStorage.setItem("syncEnabled", "false");
					}
				}
			]
		);
	} else {
		Alert.alert(
			"Re-Enable Sync?",
			"Are you sure you want to re-enable sync for this device? This will sync all current local data to RunSignup, and any future data will automatically be synced to RunSignup unless you disable sync for this device.",
			[
				{ text: "Cancel" },
				{
					text: "Enable Sync",
					style: "destructive",
					onPress: (): void => {
						setSyncEnabled(true);
						AsyncStorage.setItem("syncEnabled", "true");
					}
				}
			]
		);
	}
}