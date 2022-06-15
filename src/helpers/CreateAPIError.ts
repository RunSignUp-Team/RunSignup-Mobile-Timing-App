import { Alert } from "react-native";
import Logger from "./Logger";

/** Return Network Error Boolean */
export const NetworkErrorBool = (error: unknown): boolean => {
	return error instanceof Error && (error.message === "Network request failed" || error.message === "Aborted");
};

/** Creates an error after checking for network connection */
export default function CreateAPIError(location: string, error: unknown): void {
	if (error instanceof Error && NetworkErrorBool(error)) {
		Alert.alert("Connection Error", "No response received from the server. Please check your internet connection and try again.");
	} else {
		// Something else
		Logger(`Unknown Error (${location})`, error, true);
	}
}